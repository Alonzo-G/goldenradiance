// scripts/gen-mid-thumbs.mjs — 从主图生成 640px 中间档缩略图（响应式图片档位补齐 §3.5）
//
// 解决 DPR2 手机（逻辑 320px × 2 = 640 物理 px）列表卡模糊：缩略图只有 360px 单档，
// srcset 补 640w 后浏览器可在移动端选到更清晰的档。
//
// 输入：public/products/<slug>/NN.webp（主图）
// 输出：public/products/<slug>/NN-640.webp（640 max, quality 74）
// 幂等：已存在 NN-640.webp 跳过；主图宽度 ≤640 无需中间档（主图本身即覆盖）。
//
// 前端契约：srcset 是否写 640 档由 `image.width > 640` 判断，与本脚本的生成条件一致——
// 主图 ≤640 的款式不会出现「描述符 640w 但实际更小」的选图误差。
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PRODUCTS = path.join(ROOT, 'public', 'products');
const MID_MAX = 640;
const MID_Q = 74;

const dirs = fs.readdirSync(PRODUCTS).filter((d) => fs.statSync(path.join(PRODUCTS, d)).isDirectory());

let generated = 0;
let skipped = 0;
let small = 0;
let failed = 0;

for (const dir of dirs) {
  const files = fs
    .readdirSync(path.join(PRODUCTS, dir))
    .filter((f) => /^\d+\.webp$/.test(f));
  for (const f of files) {
    const mainPath = path.join(PRODUCTS, dir, f);
    const midPath = path.join(PRODUCTS, dir, f.replace(/\.webp$/, '-640.webp'));
    if (fs.existsSync(midPath)) {
      skipped++;
      continue;
    }
    try {
      const meta = await sharp(mainPath).metadata();
      if (!meta.width || meta.width <= MID_MAX) {
        small++;
        continue;
      }
      const buf = await sharp(mainPath)
        .resize(MID_MAX, MID_MAX, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: MID_Q, effort: 5 })
        .toBuffer();
      fs.writeFileSync(midPath, buf);
      generated++;
    } catch (err) {
      console.error('FAIL', mainPath, err.message);
      failed++;
    }
  }
}

console.log(`mid-thumbs: generated=${generated} skipped=${skipped} small-skipped=${small} failed=${failed}`);
