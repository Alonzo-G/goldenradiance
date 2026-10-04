// scripts/contact-sheet.mjs — 素材侦察工具：把每个产品首图拼成网格，用于快速视觉分类
// 用法: NODE_PATH=./node_modules node scripts/contact-sheet.mjs <源目录> <输出目录> [每版数量]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = process.argv[2];
const OUT = process.argv[3];
const PER_SHEET = Number(process.argv[4] || 18);
if (!SRC || !OUT) {
  console.error('用法: node scripts/contact-sheet.mjs <源目录> <输出目录> [每版数量]');
  process.exit(1);
}

const COLS = 6;
const CELL = 300;
const LABEL = 30;
fs.mkdirSync(OUT, { recursive: true });

const dirs = fs
  .readdirSync(SRC)
  .filter((d) => fs.statSync(path.join(SRC, d)).isDirectory())
  .sort();

const items = [];
for (const d of dirs) {
  const jpgs = fs
    .readdirSync(path.join(SRC, d))
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort();
  if (jpgs.length) items.push({ dir: d, first: path.join(SRC, d, jpgs[0]), count: jpgs.length });
}

console.log(`共 ${items.length} 个产品，分 ${Math.ceil(items.length / PER_SHEET)} 版`);
const index = [];

for (let s = 0; s * PER_SHEET < items.length; s++) {
  const slice = items.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
  const rows = Math.ceil(slice.length / COLS);
  const W = COLS * CELL;
  const H = rows * (CELL + LABEL);
  const composites = [];

  for (let i = 0; i < slice.length; i++) {
    const it = slice[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = col * CELL;
    const y = row * (CELL + LABEL);

    const buf = await sharp(it.first)
      .resize(CELL - 8, CELL - 8, { fit: 'cover' })
      .jpeg({ quality: 82 })
      .toBuffer();
    composites.push({ input: buf, left: x + 4, top: y + 4 });

    const label = `#${String(index.length + i + 1).padStart(2, '0')} ${it.dir.split('_').slice(1, 3).join('_')} (${it.count})`;
    const svg = Buffer.from(
      `<svg width="${CELL}" height="${LABEL}"><rect width="${CELL}" height="${LABEL}" fill="#123a38"/><text x="6" y="20" font-family="Segoe UI, Arial" font-size="15" fill="#ffffff">${label.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text></svg>`,
    );
    composites.push({ input: svg, left: x, top: y + CELL });
  }

  const outName = path.join(OUT, `sheet-${s + 1}.jpg`);
  await sharp({
    create: { width: W, height: H, channels: 3, background: '#e8e6e1' },
  })
    .composite(composites)
    .jpeg({ quality: 84 })
    .toFile(outName);
  console.log('已生成', outName, `${W}x${H}`);

  slice.forEach((it, i) => index.push({ no: index.length + i + 1, dir: it.dir, first: path.basename(it.first), count: it.count }));
  index.length = Math.min(index.length, items.length);
}

// 重新编号（上面循环里 index 长度技巧不严谨，这里统一重算）
const finalIndex = items.map((it, i) => ({ no: i + 1, dir: it.dir, first: path.basename(it.first), count: it.count }));
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(finalIndex, null, 2), 'utf8');
console.log('索引已写入 index.json，共', finalIndex.length, '条');
