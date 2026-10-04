// scripts/make-assets.mjs — 生成品牌位图资产（OG 卡 + app icons）
// 真源为脚本内联 SVG；favicon.svg 单独手写在 public/。
// 运行：NODE_PATH=./node_modules node scripts/make-assets.mjs
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public');
mkdirSync(out, { recursive: true });

const ACCENT = '#123a38';
const ACCENT_DARK = '#0c2b29';
const METAL = '#7d6330';
const METAL_LIGHT = '#a8873f';
const FG = '#f4f6f5';
const FONT = 'Segoe UI, Arial, Helvetica, sans-serif';

// 珠宝宝石标：crown（亮金）+ pavilion（深金）+ 描边
const gem = (fill1 = METAL_LIGHT, fill2 = METAL) => `
  <path d="M22 18 L42 18 L50 28 L14 28 Z" fill="${fill1}"/>
  <path d="M14 28 L50 28 L32 48 Z" fill="${fill2}"/>
  <path d="M22 18 L42 18 L50 28 L32 48 L14 28 Z" fill="none" stroke="#e6d3a3" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="M14 28 L50 28" stroke="#e6d3a3" stroke-width="1.1" opacity="0.7"/>`;

// 圆角标（favicon / manifest icon 用）
const markSvg = (rounded) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${ACCENT}"/>
  ${gem()}
</svg>`;

// OG 卡 1200x630
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${ACCENT}"/>
  <rect x="0" y="0" width="1200" height="8" fill="${METAL}"/>
  <g opacity="0.08" transform="translate(880,110) scale(5.2)">${gem()}</g>
  <g transform="translate(80,66)">
    <rect width="46" height="46" rx="10" fill="${ACCENT_DARK}"/>
    <g transform="translate(7,7) scale(0.5)">${gem()}</g>
  </g>
  <text x="146" y="100" font-family="${FONT}" font-size="26" font-weight="600" fill="${FG}" letter-spacing="2">GOLDEN RADIANCE</text>
  <text x="80" y="322" font-family="${FONT}" font-size="62" font-weight="700" fill="${FG}">Three product lines.</text>
  <text x="80" y="402" font-family="${FONT}" font-size="62" font-weight="700" fill="${FG}">Verified specs on every SKU.</text>
  <text x="80" y="478" font-family="${FONT}" font-size="30" fill="#c9d3d1">Wholesale jewelry sourcing. MOQ 12-120 pcs, stated per style.</text>
  <rect x="80" y="524" width="132" height="6" fill="${METAL}"/>
  <text x="80" y="586" font-family="${FONT}" font-size="26" fill="#9fb0ad">rayan-accessories.com</text>
</svg>`;
// 注：上行为 OG 图脚注域名，仍沿用已持有的 rayan-accessories.com（未正式启用新域名前不改）。
// 品牌文字已更新为 GOLDEN RADIANCE；域名文字待正式域名确定后同步替换。

const jobs = [
  { name: 'og-default.png', svg: ogSvg, w: 1200, h: 630 },
  { name: 'apple-touch-icon.png', svg: markSvg(false), w: 180, h: 180 },
  { name: 'icon-192.png', svg: markSvg(true), w: 192, h: 192 },
  { name: 'icon-512.png', svg: markSvg(true), w: 512, h: 512 },
];

for (const j of jobs) {
  await sharp(Buffer.from(j.svg))
    .resize(j.w, j.h)
    .png({ compressionLevel: 9 })
    .toFile(join(out, j.name));
  console.log(`wrote public/${j.name} (${j.w}x${j.h})`);
}
