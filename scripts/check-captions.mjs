// Verify: which generated product images actually carry a burned-in caption band?
// Only the 18 translated dimension diagrams should.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('public', 'products');
const withCaption = [];

for (const slug of fs.readdirSync(ROOT).sort()) {
  const dir = path.join(ROOT, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir).filter((x) => /^\d+\.webp$/.test(x)).sort()) {
    const { data, info } = await sharp(path.join(dir, f))
      .resize(256, 256, { fit: 'fill' }).grayscale().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const dark = new Array(H).fill(0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[y * W + x] < 128) dark[y]++;

    let yBot = -1;
    for (let y = H - 1; y >= 0; y--) if (dark[y] > 1) { yBot = y; break; }
    if (yBot < 0) continue;
    let capTop = yBot, gap = 0;
    for (let y = yBot; y >= 0; y--) { if (dark[y] > 1) { capTop = y; gap = 0; } else { gap++; if (gap > 2) break; } }
    const capH = yBot - capTop + 1;
    let gapAbove = true;
    for (let y = Math.max(0, capTop - 10); y < capTop - 1; y++) if (dark[y] > 0) { gapAbove = false; break; }

    if (capH >= 3 && capH <= 34 && gapAbove && capTop / H > 0.70) {
      withCaption.push(`${slug}/${f}`);
    }
  }
}

console.log('images carrying a bottom caption band:', withCaption.length);
for (const s of withCaption) console.log(' ', s);
