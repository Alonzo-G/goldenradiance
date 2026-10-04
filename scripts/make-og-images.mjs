// scripts/make-og-images.mjs — 为每款真实产品生成社交分享图 public/og/{slug}.jpg
//
// 为什么需要：og:image 原先全部指向同一张 /og-default.png，111 个产品页在
// LinkedIn / WhatsApp / Facebook 的分享卡片长得一模一样，抓不到产品图。
//
// 为什么是 JPEG 而不是直接用现成的 WebP：Facebook 与 LinkedIn 的抓取器对 WebP
// 支持不可靠，可能整张预览都不显示——那比显示通用卡更糟。转 JPEG 是最低成本的
// 普适做法。不确定格式能否被平台接受时，选格式保守的那一边。
//
// 为什么是 1200x630 而不是 1:1：SeoHead 把 og:image:width/height 写死为
// 1200x630，改尺寸就要连带改分享尺寸声明。保持一致，且这是 OG 的标准比例。
//
// 为什么是留白而不是裁切：产品是 1:1 实拍图，裁成 1200x630 会切掉饰品上下部分；
// 居中留白到品牌底色上不丢信息，视觉上也与通用卡同源。
//
// 为什么**不叠文字**：叠标题等于在图上做卖点声明，那些规格尚未与客户确认，
// 按项目「不编造」纪律不应出现在对外素材上。纯产品照最诚实。
//
// 运行：node scripts/make-og-images.mjs
// 幂等：按文件名覆盖。新增产品后重跑；PDP 对缺失文件自动回落 og-default。
import sharp from 'sharp';
import { mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const productsDir = join(root, 'src/content/products');
const publicDir = join(root, 'public');
const outDir = join(publicDir, 'og');

const OG_W = 1200;
const OG_H = 630;
const ACCENT = '#123a38';   // 与 make-assets.mjs 的 og-default 同一品牌底色
const METAL = '#7d6330';    // 同上，顶部细条
const QUALITY = 82;

mkdirSync(outDir, { recursive: true });

/** 真实素材款（占位种子数据无实拍图，不生成） */
function realProductSlugs() {
  return readdirSync(productsDir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => /^dataStatus:\s*real\s*$/m.test(readFileSync(join(productsDir, f), 'utf8')))
    .map((f) => f.replace(/\.md$/, ''));
}

const slugs = realProductSlugs();
let written = 0;
let skipped = 0;
let bytes = 0;

for (const slug of slugs) {
  // 主图取该款第一张；命名与 ingest 管线一致（01.webp 起）
  let source = null;
  for (const n of ['01', '02', '03']) {
    const p = join(publicDir, 'products', slug, `${n}.webp`);
    try {
      statSync(p);
      source = p;
      break;
    } catch {
      /* 试下一张 */
    }
  }
  if (!source) {
    skipped++;
    continue;
  }

  const out = join(outDir, `${slug}.jpg`);
  const meta = await sharp(source).metadata();
  // 1:1 → 先取短边成正方形，再**缩到画布高度**（composite 不允许输入大于画布），
  // 然后居中留白。任意比例都不变形、不裁切。
  const side = Math.min(meta.width ?? OG_W, meta.height ?? OG_H, OG_H);
  const square = await sharp(source)
    .resize(side, side, { fit: 'cover', position: 'centre' })
    .toBuffer();

  await sharp({
    create: {
      width: OG_W,
      height: OG_H,
      channels: 3,
      background: ACCENT,
    },
  })
    .composite([
      { input: square, left: Math.round((OG_W - side) / 2), top: Math.round((OG_H - side) / 2) },
      // 顶部品牌细条，与 og-default.png 同一元素
      {
        input: { create: { width: OG_W, height: 8, channels: 3, background: METAL } },
        left: 0,
        top: 0,
      },
    ])
    .jpeg({ quality: QUALITY, mozjpeg: true, chromaSubsampling: '4:4:4' })
    .toFile(out);

  written++;
  bytes += statSync(out).size;
}

console.log(
  `生成 public/og/*.jpg：${written} 张，均 ${OG_W}x${OG_H}，共 ${(bytes / 1048576).toFixed(2)} MB` +
    (skipped ? `；跳过 ${skipped} 款（无实拍主图）` : ''),
);
if (written === 0) {
  console.error('未生成任何文件——检查 src/content/products 是否有 dataStatus: real 的条目');
  process.exit(1);
}
