// scripts/fetch-fonts.mjs — 自托管字体抓取器（2026-10-13 全站审计）
//
// 背景：站点原先外接 Google Fonts（BaseLayout preconnect + css2 API）。
// 三个问题：① GDPR——访客 IP 与 UA 会送到 Google（LG München I 2022 判例
// 认定未同意嵌入即违法，而本站主打欧盟/英国市场）；② 性能——多一次跨域
// DNS+TLS，css2 CSS 曾是渲染阻塞项（此前用 media=print onload  hack 绕过）；
// ③ 可靠性——第三方抖动即字体丢字。
//
// 本脚本从 css2 API 抓 woff2（现代 Chrome UA）落盘 public/fonts/，
// 并打印本地 @font-face CSS（手工贴进 src/styles/global.css）。
//
// 幂等：同名文件重复覆盖。改字体或权重 → 改 FAMILIES 后重跑，并同步
// global.css 的 --font-* 与 _headers 的缓存规则。
import { writeFile, mkdir } from 'node:fs/promises';

const FAMILIES = ['Archivo:wght@500;600;700', 'Public+Sans:wght@400;500;600', 'JetBrains+Mono:wght@400;500'];
const CSS2_URL = `https://fonts.googleapis.com/css2?family=${FAMILIES.join('&family=')}&display=swap`;
const OUT_DIR = 'public/fonts';
// 现代 Chrome UA → Google 返回 woff2（默认 UA 会返回 ttf，体积翻数倍）
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const familySlug = (family) => family.trim().toLowerCase().replace(/\s+/g, '-');

const res = await fetch(CSS2_URL, { headers: { 'User-Agent': UA } });
if (!res.ok) throw new Error(`css2 fetch failed: HTTP ${res.status}`);
const css = await res.text();

// 逐块解析 @font-face；只保留 latin 子集（unicode-range 含 U+0000-00FF）——
// 站点为纯英文内容，latin-ext/cyrillic/vietnamese 等子集是纯浪费。
const blockRe = /@font-face\s*\{([^}]*)\}/g;
const kept = [];
let m;
while ((m = blockRe.exec(css)) !== null) {
  const body = m[1];
  const get = (prop) => {
    const mm = body.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`));
    return mm ? mm[1].trim() : '';
  };
  const range = get('unicode-range');
  if (!range.includes('U+0000-00FF')) continue;
  const family = get('font-family').replace(/^["']|["']$/g, '');
  const weight = get('font-weight');
  const style = get('font-style') || 'normal';
  const display = get('font-display') || 'swap';
  const srcUrl = (get('src').match(/url\(([^)]+)\)/) ?? [])[1]?.replace(/^["']|["']$/g, '');
  if (!srcUrl) continue;
  kept.push({ family, weight, style, display, range, srcUrl });
}

if (kept.length === 0) throw new Error('no latin @font-face blocks parsed — css2 response format changed?');

await mkdir(OUT_DIR, { recursive: true });

let out = '';
for (const f of kept) {
  const file = `${familySlug(f.family)}-${f.weight}.woff2`;
  const bin = await fetch(f.srcUrl, { headers: { 'User-Agent': UA } });
  if (!bin.ok) throw new Error(`font download failed: ${f.srcUrl} → HTTP ${bin.status}`);
  const buf = Buffer.from(await bin.arrayBuffer());
  await writeFile(`${OUT_DIR}/${file}`, buf);
  out += `@font-face {
  font-family: "${f.family}";
  font-style: ${f.style};
  font-weight: ${f.weight};
  font-display: ${f.display};
  src: url("/fonts/${file}") format("woff2");
  unicode-range: ${f.range};
}
`;
  console.log(`${file.padEnd(28)} ${(buf.length / 1024).toFixed(1)} KB`);
}

console.log('\n--- 贴进 src/styles/global.css（@import "tailwindcss"; 之后）---\n');
console.log(out);
