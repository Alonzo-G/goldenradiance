// Recon helper (temporary): scan EVERY source image for the factory's
// dimension-diagram template (mostly white canvas + thin rule lines +
// a dark Chinese caption band sitting alone at the very bottom).
// Output is a ranked candidate list to be visually verified afterwards.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'D:/AAAAAAA外贸资料/饰品/NEW';
const posts = fs.readdirSync(SRC).filter((d) => /^\d{2}_/.test(d)).sort();
const rows = [];

for (const folder of posts) {
  const no = Number(folder.slice(0, 2));
  const dir = path.join(SRC, folder);
  const jpgs = fs.readdirSync(dir).filter((f) => /\.jpe?g$/i.test(f)).sort();
  for (let i = 0; i < jpgs.length; i++) {
    const key = `${String(no).padStart(2, '0')}.${String(i + 1).padStart(2, '0')}`;
    const { data, info } = await sharp(path.join(dir, jpgs[i]))
      .resize(256, 256, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    let white = 0;
    const dark = new Array(H).fill(0);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const v = data[y * W + x];
        if (v > 242) white++;
        if (v < 128) dark[y]++;
      }
    }
    const whiteFrac = white / (W * H);

    // lowest row carrying any ink, then walk up through the contiguous band
    let yBot = -1;
    for (let y = H - 1; y >= 0; y--) if (dark[y] > 1) { yBot = y; break; }
    let capTop = yBot, gap = 0;
    if (yBot >= 0) {
      for (let y = yBot; y >= 0; y--) {
        if (dark[y] > 1) { capTop = y; gap = 0; } else { gap++; if (gap > 2) break; }
      }
    }
    const capH = yBot - capTop + 1;
    // clean white separation between the caption and everything above it
    let gapAbove = true;
    for (let y = Math.max(0, capTop - 10); y < capTop - 1; y++) if (dark[y] > 0) { gapAbove = false; break; }

    const isCaption = yBot >= 0 && capH >= 3 && capH <= 34 && gapAbove && capTop / H > 0.70;

    rows.push({ key, no, file: jpgs[i], whiteFrac: +whiteFrac.toFixed(3), capH, gapAbove, isCaption });
  }
}

fs.writeFileSync(path.resolve('docs/material-intake/diagram-scan.json'), JSON.stringify(rows, null, 1));
rows.sort((a, b) => b.whiteFrac - a.whiteFrac);
console.log('total images:', rows.length);
console.log('isCaption true:', rows.filter((r) => r.isCaption).length);
console.log('\n--- isCaption=true, sorted by key ---');
for (const r of rows.filter((r) => r.isCaption).sort((a, b) => a.key.localeCompare(b.key))) {
  console.log(`${r.key}  white=${r.whiteFrac}  capH=${r.capH}`);
}
console.log('\n--- top 20 by whiteFrac (regardless of caption flag) ---');
for (const r of rows.slice(0, 20)) {
  console.log(`${r.key}  white=${r.whiteFrac}  capH=${r.capH}  gapAbove=${r.gapAbove}  isCaption=${r.isCaption}`);
}
