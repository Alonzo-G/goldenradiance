// scripts/listing-sku-sheet.mjs — 单个链接的全部 SKU 图拼版，用于判断「同款式不同色」还是「不同款式」
// 用法: node scripts/listing-sku-sheet.mjs <骏娅索引> [每行几个]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'D:\\AAAAAAA外贸资料\\饰品\\产品(1)';
const TMP = path.resolve('.tmp-sku');
fs.mkdirSync(TMP, { recursive: true });

const vendorKey = process.argv[2] || '骏娅';
const idx = Number(process.argv[3]);
const COLS = Number(process.argv[4] || 5);

const inv = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/inventory-1688.json'), 'utf8'));
const list = inv.products.filter((p) => p.vendor.includes(vendorKey));
const p = list[idx];
if (!p) { console.log('bad index'); process.exit(1); }
const folder = fs.readdirSync(path.join(SRC, p.vendor)).find((f) => f.startsWith(p.folder.slice(0, 20)));
const d = path.join(SRC, p.vendor, folder, 'SKU 属性图');
const files = fs.readdirSync(d).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();
console.log(`#${idx} ${p.titleCn}\n${files.length} SKU, titleCn=${p.titleCn}`);

const TILE = 380, PAD = 6, LABEL = 24;
const ROWS = Math.ceil(files.length / COLS);
const W = COLS * (TILE + PAD) + PAD;
const H = ROWS * (TILE + LABEL + PAD) + PAD;
const comp = [];
for (let i = 0; i < files.length; i++) {
  const buf = await sharp(path.join(d, files[i])).resize({ width: TILE, height: TILE, fit: 'contain', background: '#ffffff' }).png().toBuffer();
  const col = i % COLS, row = Math.floor(i / COLS);
  const left = PAD + col * (TILE + PAD), top = PAD + row * (TILE + LABEL + PAD);
  comp.push({
    input: Buffer.from(`<svg width="${TILE}" height="${LABEL}"><rect width="100%" height="100%" fill="#fff"/>
      <text x="4" y="18" font-family="Arial" font-size="16" font-weight="bold" fill="#c00">${i + 1}</text></svg>`), top, left,
  });
  comp.push({ input: buf, top: top + LABEL, left });
}
const out = path.join(TMP, `listing${idx}.png`);
await sharp({ create: { width: W, height: H, channels: 3, background: '#dcdcdc' } }).composite(comp).png().toFile(out);
console.log('wrote', out, `${W}x${H}`);
