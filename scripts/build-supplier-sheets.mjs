// scripts/build-supplier-sheets.mjs — 供应商图库联络表生成器
// 把三个厂家的产品图按 SKU 分组后拼成 6×6 联络表（含 SKU 标签），
// 供人工视觉分类（品类/产品线/风格），产出：
//   .gr_preview/sheets/sheet-NN.webp   联络表图
//   .gr_preview/sheets/manifest.json   每张表的 SKU 顺序清单（分类结果展开用）
//
// SKU 规则（与用户确认）：文件名去掉尾部 _N（同一产品的多图变体）后即产品编号，
// 大小写归一为大写；字母后缀（s/b/gc/jgL 等）是编号本身的一部分。
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '.gr_preview', 'sheets');

const SUPPLIERS = [
  { dir: '钢骑士102672颜颜18867552390', tag: 'GK' }, // 钢骑士
  { dir: '骏娅-诚信值千金', tag: 'JY' }, // 骏娅
  { dir: '链艺饰品Mick Huang', tag: 'LY' }, // 链艺
];

const CELL = 250; // 图格尺寸
const LABEL_H = 34; // 标签条高度
const COLS = 6;
const ROWS = 6;
const PER = COLS * ROWS;

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- 1. 扫描 + SKU 分组 ----
/** @type {Map<string, {sku:string, supplier:string, files:string[]}>} */
const groups = new Map();
const collisions = [];

for (const sup of SUPPLIERS) {
  const abs = path.join('D:', 'AAAAAAA外贸资料', '饰品', '产品图', sup.dir);
  const files = fs.readdirSync(abs).filter((f) => /\.(jpe?g|png)$/i.test(f));
  for (const f of files) {
    const base = f.replace(/\.(jpe?g|png)$/i, '');
    // 去掉尾部 _N 多图变体后缀；其余字母后缀是编号的一部分
    const sku = base.replace(/_[0-9]+$/, '').toUpperCase();
    if (!/^[A-Z0-9]{3,32}$/.test(sku)) throw new Error(`SKU 非法: ${f} → ${sku}`);
    const g = groups.get(sku);
    if (g) {
      if (g.supplier !== sup.tag) collisions.push(`${sku}: ${g.supplier} + ${sup.tag}`);
      g.files.push(f);
    } else {
      groups.set(sku, { sku, supplier: sup.tag, files: [f] });
    }
  }
}

if (collisions.length) throw new Error('跨厂家 SKU 撞名:\n' + collisions.join('\n'));

// 组内排序：主文件（无 _N）在前，变体按编号升序
for (const g of groups.values()) {
  g.files.sort((a, b) => {
    const av = /_[0-9]+$/.test(a.replace(/\.(jpe?g|png)$/i, '')) ? 1 : 0;
    const bv = /_[0-9]+$/.test(b.replace(/\.(jpe?g|png)$/i, '')) ? 1 : 0;
    if (av !== bv) return av - bv;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

const skus = [...groups.keys()].sort((a, b) =>
  a.replace(/[0-9]+$/, '').localeCompare(b.replace(/[0-9]+$/, '')) ||
  parseInt(a.replace(/^\D+/, ''), 10) - parseInt(b.replace(/^\D+/, ''), 10)
);

console.log(`SKU 总数: ${skus.length}（图片 ${[...groups.values()].reduce((n, g) => n + g.files.length, 0)} 张）`);
const bySup = {};
for (const g of groups.values()) bySup[g.supplier] = (bySup[g.supplier] ?? 0) + 1;
console.log('按厂家:', JSON.stringify(bySup));

// ---- 2. 生成联络表 ----
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const manifest = [];
let sheetNo = 0;

for (let i = 0; i < skus.length; i += PER) {
  const batch = skus.slice(i, i + PER);
  const composites = [];
  const cells = [];

  for (let c = 0; c < batch.length; c++) {
    const g = groups.get(batch[c]);
    const abs = path.join('D:', 'AAAAAAA外贸资料', '饰品', '产品图',
      SUPPLIERS.find((s) => s.tag === g.supplier).dir, g.files[0]);
    const col = c % COLS;
    const row = Math.floor(c / COLS);
    const x = col * CELL;
    const y = row * (CELL + LABEL_H);

    const thumb = await sharp(abs)
      .rotate()
      .resize(CELL - 4, CELL - 4, { fit: 'inside' })
      .jpeg({ quality: 72 })
      .toBuffer();
    const tm = await sharp(thumb).metadata();
    composites.push({
      input: thumb,
      left: x + Math.floor((CELL - tm.width) / 2),
      top: y + Math.floor((CELL - 4 - tm.height) / 2) + 2,
    });
    cells.push({ sku: g.sku, supplier: g.supplier, file: g.files[0] });
  }

  const W = COLS * CELL;
  const H = Math.ceil(batch.length / COLS) * (CELL + LABEL_H);
  const labelSvg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">` +
      cells
        .map((c, idx) => {
          const col = idx % COLS;
          const row = Math.floor(idx / COLS);
          const x = col * CELL;
          const y = row * (CELL + LABEL_H) + CELL;
          return `<rect x="${x}" y="${y}" width="${CELL}" height="${LABEL_H}" fill="#111"/>` +
            `<text x="${x + 8}" y="${y + 24}" font-family="Arial" font-size="24" font-weight="bold" fill="#fff">${esc(c.sku)}</text>` +
            `<text x="${x + CELL - 46}" y="${y + 24}" font-family="Arial" font-size="20" fill="#fbbf24">${esc(c.supplier)}</text>`;
        })
        .join('') +
      `</svg>`
  );

  const sheet = await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite([...composites, { input: labelSvg, top: 0, left: 0 }])
    .webp({ quality: 80 })
    .toFile(path.join(OUT, `sheet-${String(sheetNo).padStart(2, '0')}.webp`));

  manifest.push({ sheet: sheetNo, file: `sheet-${String(sheetNo).padStart(2, '0')}.webp`, cells });
  console.log(`sheet-${String(sheetNo).padStart(2, '0')}.webp  ${sheet.width}x${sheet.height}  ${batch.length} SKU`);
  sheetNo++;
}

fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log(`\n完成: ${sheetNo} 张联络表 → ${path.relative(ROOT, OUT)}`);
