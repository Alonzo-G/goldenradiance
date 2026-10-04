// scripts/verify-catalog-consistency.mjs —— 列表页 / 详情页 / 产品线页 三处一致性校验
// 依据：dist/client/products/index.html 与 dist/client/product-lines/*/index.html 内嵌的全量目录 JSON
//       vs src/content/products/*.md 的 frontmatter vs 每张 PDP 的实际渲染
// 用法：node scripts/verify-catalog-consistency.mjs   （先跑 npm run build）
//
// 可见性口径说明（2026-10-03）：占位种子数据（dataStatus: placeholder）可经
// src/lib/products/queries.ts 的 SHOW_PLACEHOLDER_PRODUCTS 开关整体撤下公开面。
// 撤下后这些内容文件仍在磁盘上，但**不再**有列表条目与 PDP。故本脚本不硬编码可见性，
// 而是从 queries.ts 读取该开关，保持与站点同一真源——否则开关翻转后本脚本会全线误报。
import fs from 'node:fs';

const DIR = 'src/content/products';

// ---- 从 queries.ts 读取可见性开关（单一真源，避免与本脚本漂移）----
const queriesSrc = fs.readFileSync('src/lib/products/queries.ts', 'utf8');
const flagMatch = /SHOW_PLACEHOLDER_PRODUCTS\s*=\s*(true|false)/.exec(queriesSrc);
if (!flagMatch) throw new Error('未能在 src/lib/products/queries.ts 中解析 SHOW_PLACEHOLDER_PRODUCTS');
const SHOW_PLACEHOLDER = flagMatch[1] === 'true';
const isPublic = (s) => SHOW_PLACEHOLDER || s.status !== 'placeholder';

const src = {};
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.md'))) {
  const t = fs.readFileSync(DIR + '/' + f, 'utf8');
  const pick = (k) => new RegExp('^' + k + ':[ \\t]*(\\S+)', 'm').exec(t)?.[1] ?? '?';
  const title = /^title:[ \t]*"?(.+?)"?[ \t]*$/m.exec(t)?.[1] ?? '?';
  src[f.replace(/\.md$/, '')] = { line: pick('line'), cat: pick('category'), status: pick('dataStatus'), title };
}

const publicSlugs = Object.keys(src).filter((s) => isPublic(src[s]));
const heldSlugs = Object.keys(src).filter((s) => !isPublic(src[s]));

function extractCatalog(file) {
  const html = fs.readFileSync(file, 'utf8');
  const start = html.indexOf('[{"sku":');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '[' || ch === '{') depth++;
    else if (ch === ']' || ch === '}') { depth--; if (depth === 0) return JSON.parse(html.slice(start, i + 1)); }
  }
  return null;
}

const fail = [];
const ok = (cond, msg) => { if (!cond) fail.push(msg); };

console.log(`可见性：SHOW_PLACEHOLDER_PRODUCTS=${SHOW_PLACEHOLDER} → 公开 ${publicSlugs.length} 款` +
  (heldSlugs.length ? ` / 已撤下 ${heldSlugs.length} 款（文件保留）` : ''));

// ---- 1) 列表页内嵌目录 vs 公开内容文件 ----
const list = extractCatalog('dist/client/products/index.html');
ok(list !== null, '列表页未找到内嵌目录');
if (list) {
  const slugs = new Set(list.map((p) => p.slug));
  ok(list.length === publicSlugs.length, `列表页条目 ${list.length} ≠ 公开内容文件 ${publicSlugs.length}`);
  for (const s of slugs) ok(!!src[s], `列表页出现悬空 slug: ${s}`);
  for (const s of publicSlugs) ok(slugs.has(s), `公开内容文件未出现在列表页: ${s}`);
  for (const s of heldSlugs) ok(!slugs.has(s), `已撤下的占位款仍出现在列表页: ${s}`);
  for (const p of list) {
    const s = src[p.slug];
    if (!s) continue;
    ok(p.line === s.line, `${p.slug} 列表页 line=${p.line} ≠ 内容 ${s.line}`);
    ok(p.category === s.cat, `${p.slug} 列表页 category=${p.category} ≠ 内容 ${s.cat}`);
    ok(p.title === s.title, `${p.slug} 列表页 title="${p.title}" ≠ 内容 "${s.title}"`);
    ok(p.dataStatus === s.status, `${p.slug} 列表页 dataStatus=${p.dataStatus} ≠ 内容 ${s.status}`);
  }
  console.log(`[1] 列表页 ${list.length} 条 ↔ 公开内容文件 ${publicSlugs.length} 条：字段逐条比对完成`);
}

// ---- 2) 产品线页：过滤后条数 / 错线数 ----
console.log('[2] 产品线页（页面内嵌全量目录，按 line 客户端过滤）');
for (const ln of fs.readdirSync('dist/client/product-lines')) {
  const p = 'dist/client/product-lines/' + ln + '/index.html';
  if (!fs.existsSync(p)) continue;
  const cat = extractCatalog(p);
  const scope = Object.values(src).filter((x) => x.line === ln && isPublic(x)).length;
  if (!cat) { console.log(`    ${ln}: 静态渲染，跳过`); continue; }
  const filtered = cat.filter((x) => x.line === ln);
  ok(filtered.length === scope, `${ln} 线过滤后 ${filtered.length} ≠ 公开内容 ${scope}`);
  console.log(`    ${ln.padEnd(30)} 过滤后 ${String(filtered.length).padStart(3)} | 公开内容 ${String(scope).padStart(3)} | ${filtered.length === scope ? 'OK' : '**不一致**'}`);
}

// ---- 3) 详情页：每张公开款必须有 PDP 且渲染标题；已撤下款不得有 PDP ----
console.log('[3] 详情页 PDP ↔ 源内容');
let checked = 0;
for (const slug of publicSlugs) {
  const f = `dist/client/products/${slug}/index.html`;
  if (!fs.existsSync(f)) { fail.push(`PDP 缺失: ${slug}`); continue; }
  const html = fs.readFileSync(f, 'utf8');
  ok(html.includes(src[slug].title), `${slug} PDP 未渲染标题 "${src[slug].title}"`);
  checked++;
}
for (const slug of heldSlugs) {
  ok(!fs.existsSync(`dist/client/products/${slug}/index.html`), `已撤下的占位款仍生成了 PDP: ${slug}`);
}
console.log(`    已校验 ${checked} 张公开款 PDP 的标题渲染；${heldSlugs.length} 款已撤下款 PDP 零残留`);

// ---- 4) 社交分享图：PDP 的 og:image 必须指向真实存在的文件 ----
// 少了这条，漏跑 `scripts/make-og-images.mjs` 只会得到 404 预览，且没有任何报错。
let ogChecked = 0;
let ogPerProduct = 0;
for (const slug of publicSlugs) {
  const f = `dist/client/products/${slug}/index.html`;
  if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  const og = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1] ?? '';
  ok(og.length > 0, `${slug} PDP 缺 og:image`);
  if (!og) continue;
  ok(/^https?:\/\//.test(og), `${slug} og:image 非绝对 URL（社媒抓取器要求绝对 URL）: ${og}`);
  const rel = og.replace(/^https?:\/\/[^/]+/, '');
  ok(fs.existsSync('dist/client' + rel), `${slug} og:image 指向不存在的文件: ${rel}（漏跑 scripts/make-og-images.mjs？）`);
  if (/\/og\/.+\.jpg$/.test(rel)) ogPerProduct++;
  ogChecked++;
}
console.log(`    已校验 ${ogChecked} 张 PDP 的 og:image 可达性，其中 ${ogPerProduct} 张为产品专属图（其余回落通用卡）`);

console.log(fail.length ? `\n失败 ${fail.length} 项:\n` + fail.slice(0, 30).map((x) => '  - ' + x).join('\n') : '\n全部通过：列表页 / 产品线页 / 详情页 三处一致，零悬空、零缺失。');
process.exit(fail.length ? 1 : 0);
