// scripts/gen-brand-assets.mjs — 品牌资产适配管线（源图 → 全站各尺寸）
// 源：D:/AAAAAAA外贸资料/饰品/gr/logo-full-glyph.png（2048² 透明底 glyph）
//     + 光球 icon（350×381 白底 RGB，需 trim 白边）
// 产物：public/logo-glyph.png（header/footer）+ favicon 16/32 + apple-touch 180
//       + icon-192/512（PWA，深底 #123a38 与 theme_color 一致）
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
mkdirSync(PUBLIC, { recursive: true });

const LOGO_SRC = 'D:/AAAAAAA外贸资料/饰品/gr/logo-full-glyph.png';
const ORB_SRC = 'C:/Users/Administrator/.workbuddy/clipboard-images/clipboard-2026-10-08T14-00-49-752Z-7e8e05de.png';
const BRAND_DARK = '#123a38'; // 与 global.css --color-surface-inverse / theme_color 一致

/** 按透明度求内容 bbox（logo glyph 周围有大片透明 padding，trim 后显示尺寸可控） */
async function alphaBBox(src) {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/** 按白色阈值求内容 bbox（光球白边 trim） */
async function whiteBBox(src) {
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const isContent = (x, y) => {
    const i = (y * W + x) * C;
    return data[i] < 245 || data[i + 1] < 245 || data[i + 2] < 245;
  };
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (isContent(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

// ── 1. logo glyph：trim 透明边 → 128px 透明底 PNG（header 显示 40px 的 3x） ──
{
  const bbox = await alphaBBox(LOGO_SRC);
  const out = path.join(PUBLIC, 'logo-glyph.png');
  await sharp(LOGO_SRC)
    .extract(bbox)
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(out);
  const kb = ((await sharp(out).metadata()).size ?? 0) / 1024;
  console.log('logo-glyph.png:', `128x128 (bbox ${JSON.stringify(bbox)})`, kb.toFixed(1) + 'KB');
}

// ── 2. 光球 icon：trim 白边 → 居中裁方 → 径向羽化 → 深底 contain 系列 ──
// 光球边缘光晕渐白，硬 trim 必留白框；改用 radial mask 让白晕按光衰减融进深底。
{
  const bbox = await whiteBBox(ORB_SRC);
  const side = Math.min(bbox.width, bbox.height);
  // 居中取 side×side（内容宽>高：水平居中裁；反之垂直居中）
  const square = {
    left: bbox.left + Math.floor((bbox.width - side) / 2),
    top: bbox.top + Math.floor((bbox.height - side) / 2),
    width: side,
    height: side,
  };
  const base = await sharp(ORB_SRC).extract(square).png().toBuffer();

  /** 径向羽化 mask：球体（~48% 半径内）全保留，白晕区衰减到透明 */
  const radialMask = (s) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}">
        <defs><radialGradient id="g">
          <stop offset="0%" stop-color="#fff" stop-opacity="1"/>
          <stop offset="48%" stop-color="#fff" stop-opacity="1"/>
          <stop offset="92%" stop-color="#fff" stop-opacity="0"/>
        </radialGradient></defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
      </svg>`,
    );

  const makeIcon = async (size, file, fillRatio = 0.8) => {
    const inner = Math.round(size * fillRatio);
    const ball = await sharp(base)
      .resize(inner, inner)
      .composite([{ input: radialMask(inner), blend: 'dest-in' }])
      .png()
      .toBuffer();
    await sharp({
      create: { width: size, height: size, channels: 4, background: BRAND_DARK },
    })
      .composite([{ input: ball, gravity: 'center' }])
      .png()
      .toFile(path.join(PUBLIC, file));
    console.log(file + ':', size + 'x' + size);
  };

  await makeIcon(16, 'favicon-16x16.png', 0.92);
  await makeIcon(32, 'favicon-32x32.png', 0.92);
  await makeIcon(180, 'apple-touch-icon.png'); // 覆盖旧占位
  await makeIcon(192, 'icon-192.png'); // 覆盖旧占位，manifest 路径不变
  await makeIcon(512, 'icon-512.png'); // maskable 安全区：0.8×0.92 < 0.8 达标
  console.log('orb square base:', side + 'px side');
}
