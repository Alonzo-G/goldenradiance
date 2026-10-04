// scripts/skin-filter.mjs — 1688 批次图片风险预筛
// 1) 肤色占比 → 真人佩戴照（隐私 + 非影棚图），批量剔除
// 2) 边缘区高饱和小色块占比 → 叠加文字/数字标注的可疑信号（仅作提示，仍需目视定夺）
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'D:\\AAAAAAA外贸资料\\饰品\\产品(1)';
const vendorKey = process.argv[2] || '*';
const sub = process.argv[3] || '主图';
const OUT = path.resolve(`docs/material-intake/image-risk-1688-${vendorKey}-${sub.replace(/\s+/g, '')}.json`);

const inv = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/inventory-1688.json'), 'utf8'));

const isSkin = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (r > 95 && g > 40 && b > 20 && mx - mn > 15 && r > g && r > b && r - g > 12) {
    // 色相落在 5°~52°（橙红到黄褐）且饱和度不过高，排除饱和红宝石
    const hue = 60 * (((g - b) / (mx - mn)) % 6);
    const sat = mx === 0 ? 0 : (mx - mn) / mx;
    if (hue >= 5 && hue <= 52 && sat < 0.62) return true;
  }
  return false;
};

const rows = [];
for (const p of inv.products) {
  if (vendorKey !== '*' && !p.vendor.includes(vendorKey)) continue;
  const folder = fs.readdirSync(path.join(SRC, p.vendor)).find((f) => f.startsWith(p.folder.slice(0, 20)));
  if (!folder) continue;
  const d = path.join(SRC, p.vendor, folder, sub);
  if (!fs.existsSync(d)) continue;
  const files = fs.readdirSync(d).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f)).sort();

  for (let i = 0; i < files.length; i++) {
    const file = path.join(d, files[i]);
    const { data, info } = await sharp(file).resize(200, 200, { fit: 'fill' }).removeAlpha().raw()
      .toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    let skin = 0, chroma = 0, total = 0;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i3 = (y * W + x) * 3;
        const r = data[i3], g = data[i3 + 1], b = data[i3 + 2];
        total++;
        if (isSkin(r, g, b)) skin++;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        // 高饱和纯色：叠加文字/数字常用
        if (mx > 120 && mx - mn > 110 && (r > 200 || g > 200 || b > 200)) chroma++;
      }
    }
    rows.push({
      productIndex: inv.products.indexOf(p),
      offerId: p.offerId,
      slugKey: p.folder.slice(-20),
      img: files[i],
      skinFrac: +(skin / total).toFixed(3),
      chromaFrac: +(chroma / total).toFixed(4),
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify({ sub, count: rows.length, images: rows }, null, 1), 'utf8');
rows.sort((a, b) => a.skinFrac - b.skinFrac);
const clean = rows.filter((r) => r.skinFrac < 0.06);
console.log(`${sub} images: ${rows.length}`);
console.log('skinFrac < 0.06 (无真人):', clean.length, `(${(clean.length / rows.length * 100).toFixed(0)}%)`);
console.log('skinFrac >= 0.30 (明显真人):', rows.filter((r) => r.skinFrac >= 0.3).length);
console.log('\n分布:');
for (const t of [0, 0.02, 0.06, 0.15, 0.3, 0.5]) {
  console.log(`  >= ${t}: ${rows.filter((r) => r.skinFrac >= t).length}`);
}
console.log('\n每款最佳候选（skinFrac 最低者）:');
const byProd = {};
for (const r of rows) (byProd[r.productIndex] ||= []).push(r);
let noClean = 0;
for (const k of Object.keys(byProd).map(Number).sort((a, b) => a - b)) {
  const list = byProd[k].sort((a, b) => a.skinFrac - b.skinFrac);
  const best = list[0];
  const ok = best.skinFrac < 0.06;
  if (!ok) noClean++;
  console.log(`  #${k}  best=${best.img}  skin=${best.skinFrac}  chroma=${best.chromaFrac}  ${ok ? '' : '<-- 全部含真人'}`);
}
console.log('\n无可用候选的款数:', noClean);
