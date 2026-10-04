// scripts/candidates-1688.mjs — 生成待人工确认的候选图拼版（顺序确定，标签为位号）
// 候选规则：skin-filter 判定无真人(skinFrac<0.06) 的图，每款取 skinFrac 最低的 N 张
// 输出: .tmp-1688/cand-<sheet>.png，并在 stdout 打印位号 → 产品/图序 的对照表
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'D:\\AAAAAAA外贸资料\\饰品\\产品(1)';
const TMP = path.resolve('.tmp-1688');
fs.mkdirSync(TMP, { recursive: true });

const PER_PRODUCT = Number(process.argv[2] || 2);
const VENDOR = process.argv[3] || '骏娅';
const SUB = process.argv[4] || '主图';
const ONLY = process.argv[5] ? process.argv[5].split(',').map(Number) : null;
const SKIN_MAX = 0.06;

const risk = JSON.parse(fs.readFileSync(path.resolve(`docs/material-intake/image-risk-1688-${VENDOR}-${SUB.replace(/\s+/g, '')}.json`), 'utf8'));
const inv = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/inventory-1688.json'), 'utf8'));

const byProd = {};
for (const r of risk.images) (byProd[r.productIndex] ||= []).push(r);

const cands = [];
for (const pi of Object.keys(byProd).map(Number).sort((a, b) => a - b)) {
  const p = inv.products[pi];
  if (!p.vendor.includes(VENDOR)) continue;
  if (ONLY && !ONLY.includes(pi)) continue;
  const list = byProd[pi].filter((r) => r.skinFrac < SKIN_MAX).sort((a, b) => a.skinFrac - b.skinFrac);
  for (const r of list.slice(0, PER_PRODUCT)) cands.push({ pi, p, ...r });
}

const COLS = Number(process.argv[6] || 4), ROWS = Number(process.argv[7] || 3), TILE = Number(process.argv[8] || 560), PAD = 8, LABEL = 28;
const per = COLS * ROWS;
const sheets = Math.ceil(cands.length / per);
const map = [];

for (let s = 0; s < sheets; s++) {
  const slice = cands.slice(s * per, (s + 1) * per);
  const comp = [];
  for (let i = 0; i < slice.length; i++) {
    const c = slice[i];
    const pos = s * per + i;
    const folder = fs.readdirSync(path.join(SRC, c.p.vendor)).find((f) => f.startsWith(c.p.folder.slice(0, 20)));
    const file = path.join(SRC, c.p.vendor, folder, SUB, c.img);
    const buf = await sharp(file).resize({ width: TILE, height: TILE, fit: 'contain', background: '#ffffff' }).png().toBuffer();
    const col = i % COLS, row = Math.floor(i / COLS);
    const left = PAD + col * (TILE + PAD), top = PAD + row * (TILE + LABEL + PAD);
    comp.push({
      input: Buffer.from(
        `<svg width="${TILE}" height="${LABEL}"><rect width="100%" height="100%" fill="#ffffff"/>
         <text x="6" y="20" font-family="Arial" font-size="18" font-weight="bold" fill="#c00">P${String(pos).padStart(2, '0')}</text></svg>`
      ), top, left,
    });
    comp.push({ input: buf, top: top + LABEL, left });
    const posLabel = 'P' + String(pos).padStart(2, '0');
    map.push({ pos: posLabel, productIndex: c.pi, offerId: c.p.offerId, img: c.img, skinFrac: c.skinFrac, titleCn: c.p.titleCn });
  }
  const out = path.join(TMP, `cand-${VENDOR}-${s}.png`);
  await sharp({ create: { width: COLS * (TILE + PAD) + PAD, height: ROWS * (TILE + LABEL + PAD) + PAD, channels: 3, background: '#dcdcdc' } })
    .composite(comp).png().toFile(out);
  console.log('wrote', out);
}

fs.writeFileSync(path.join(TMP, `cand-map-${VENDOR}.json`), JSON.stringify(map, null, 1), 'utf8');
console.log('\ncandidates:', cands.length, '| sheets:', sheets);
for (const m of map) console.log(`${m.pos}  #${m.productIndex}  ${m.img}  skin=${m.skinFrac}  ${m.titleCn.slice(0, 26)}`);
