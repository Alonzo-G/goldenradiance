// scripts/ingest-material.mjs — 真实素材入库管线
// 依据 docs/material-intake/catalog.json：
//   1) 逐产品输出响应式 WebP（主图 1200px / 缩略 360px）到 public/products/<slug>/
//   2) 工厂「中文尺寸标注图」在入库时重绘底部图注为英文后一并发布（见 translateDiagram）
//   3) 生成 src/content/products/<slug>.md（dataStatus: real，未确认规格留空走降级）
//   4) 源文案与 RMB 工厂价只留在 catalog.json（内部），绝不进入站点产物
//
// 用法: NODE_PATH=./node_modules node scripts/ingest-material.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'docs', 'material-intake', 'catalog.json');
const OUT_PUBLIC = path.join(ROOT, 'public', 'products');
const OUT_CONTENT = path.join(ROOT, 'src', 'content', 'products');
const DRY = process.argv.includes('--dry');

const MAIN_MAX = 1200;
const THUMB_MAX = 360;
const MAIN_Q = 76;
const THUMB_Q = 72;

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const SRC = catalog._meta.sourceDir;
const excluded = catalog._meta.excludedImages ?? {};
const diagrams = catalog._meta.dimensionAnnotations ?? {};

/** 按 "NN_" 前缀匹配源文件夹 */
function matchFolder(no) {
  const prefix = `${String(no).padStart(2, '0')}_`;
  const hit = fs.readdirSync(SRC).find((d) => d.startsWith(prefix));
  if (!hit) throw new Error(`源目录未找到产品 ${prefix}`);
  return hit;
}

const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * 把工厂尺寸图的底部中文克重行换成同句式英文图注。
 * 只改这一行：产品照与尺寸线原样保留——那些标注本来就只有阿拉伯数字加 "mm"，
 * 本身不需要翻译。
 *
 * 传入的 normalizedBuf 必须**已经是目标尺寸**：sharp 的 composite 排在 resize 之后，
 * 若先合成再缩放，覆盖层会被判定大于底图而报错。
 */
async function translateDiagram(normalizedBuf, caption) {
  const meta = await sharp(normalizedBuf).metadata();
  const W = meta.width;
  const H = meta.height;

  // 只在底部 30% 找那条孤立的图注带
  const bandTop = Math.floor(H * 0.7);
  const { data, info } = await sharp(normalizedBuf)
    .extract({ left: 0, top: bandTop, width: W, height: H - bandTop })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const BW = info.width;
  const BH = info.height;

  const dark = new Array(BH).fill(0);
  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < BW; x++) if (data[y * BW + x] < 128) dark[y]++;
  }

  let yBot = -1;
  for (let y = BH - 1; y >= 0; y--) if (dark[y] > 1) { yBot = y; break; }
  if (yBot < 0) throw new Error('未找到图注带');

  let capTop = yBot;
  let gap = 0;
  for (let y = yBot; y >= 0; y--) {
    if (dark[y] > 1) { capTop = y; gap = 0; } else { gap++; if (gap > 2) break; }
  }

  const capH = yBot - capTop + 1;
  const absTop = bandTop + capTop;

  // 与原文一样左对齐：取图注带里最左侧的着墨列
  let xLeft = 0;
  scan: for (let x = 0; x < BW; x++) {
    for (let y = capTop; y <= yBot; y++) if (data[y * BW + x] < 128) { xLeft = x; break scan; }
  }

  // 英文按同一视觉高度排，但过长时缩到可用宽度内（拉丁字符比汉字占宽）
  let fontSize = capH * 1.42;
  const maxW = W - xLeft - W * 0.03;
  const est = (fs) => caption.length * fs * 0.55;
  if (est(fontSize) > maxW) fontSize = maxW / (caption.length * 0.55);
  fontSize = Math.max(12, Math.round(fontSize));

  // Arial 大写字高约 0.716em，让字面中心落在图注带中心
  const centerY = bandTop + (capTop + yBot) / 2;
  const baseline = centerY + fontSize * 0.358;

  // 覆盖层只做底部那一条，且宽度/高度强制到精确像素，
  // 避免整幅 SVG 与底图出现 1px 舍入差导致 composite 拒绝
  const topY = Math.max(0, absTop - 6);
  const overlayH = H - topY;
  const overlaySvg = Buffer.from(
    `<svg width="${W}" height="${overlayH}" xmlns="http://www.w3.org/2000/svg">` +
      `<rect x="0" y="0" width="${W}" height="${overlayH}" fill="#ffffff"/>` +
      `<text x="${xLeft}" y="${baseline - topY}" font-family="Arial, Helvetica, sans-serif" ` +
      `font-size="${fontSize}" fill="#000000">${escapeXml(caption)}</text>` +
      `</svg>`
  );
  const overlay = await sharp(overlaySvg).resize(W, overlayH, { fit: 'fill' }).png().toBuffer();

  return sharp(normalizedBuf).composite([{ input: overlay, top: topY, left: 0 }]);
}

/** 出图：先缩到目标尺寸，必要时在目标尺寸上标注，再编码 WebP */
async function makeVariant(normalizedBuf, maxSize, quality, caption) {
  const base = await sharp(normalizedBuf)
    .resize(maxSize, maxSize, { fit: 'inside', withoutEnlargement: true })
    .toBuffer();
  const meta = await sharp(base).metadata();
  const pipeline = caption ? await translateDiagram(base, caption) : sharp(base);
  const buffer = await pipeline.webp({ quality, effort: 5 }).toBuffer();
  return { buffer, width: meta.width, height: meta.height };
}

async function main() {
  if (!fs.existsSync(SRC)) throw new Error(`源目录不存在: ${SRC}`);
  fs.mkdirSync(OUT_PUBLIC, { recursive: true });

  const published = catalog.products.filter((p) => p.published !== false);
  let totalOut = 0;
  let totalSkipped = 0;
  let totalTranslated = 0;
  let bytesOut = 0;
  const manifest = [];

  for (const p of published) {
    const folder = matchFolder(p.no);
    const srcDir = path.join(SRC, folder);
    const jpgs = fs
      .readdirSync(srcDir)
      .filter((f) => /\.jpe?g$/i.test(f))
      .sort();
    const destDir = path.join(OUT_PUBLIC, p.slug);

    // 本款带哪张尺寸图（一个产品最多一张）
    const diagramKey = Object.keys(diagrams).find((k) => diagrams[k].postNo === p.no) ?? null;
    const diagram = diagramKey ? diagrams[diagramKey] : null;

    const kept = [];
    jpgs.forEach((f, i) => {
      const key = `${String(p.no).padStart(2, '0')}.${String(i + 1).padStart(2, '0')}`;
      if (excluded[key]) {
        totalSkipped++;
        return;
      }
      kept.push({ file: f, src: path.join(srcDir, f), seq: kept.length + 1, key });
    });

    if (!kept.length) {
      console.warn(`! ${p.slug}: 无可发布图片，跳过`);
      continue;
    }
    if (!DRY) fs.mkdirSync(destDir, { recursive: true });

    const images = [];
    for (const k of kept) {
      const base = String(k.seq).padStart(2, '0');
      const mainName = `${base}.webp`;
      const thumbName = `${base}-thumb.webp`;
      const isDiagram = diagramKey === k.key;

      const alt = isDiagram
        ? `${p.title} — dimension diagram: ${diagram.dimensionsMm}, ${diagram.caption.toLowerCase()}`
        : k.seq === 1
          ? `${p.title} — main view`
          : `${p.title} — view ${k.seq}`;

      if (!DRY) {
        // 先统一方向；标注在已缩放到目标尺寸的底图上做
        const normalized = await sharp(k.src).rotate().toBuffer();
        const cap = isDiagram ? diagram.caption : null;
        if (isDiagram) totalTranslated++;

        const main = await makeVariant(normalized, MAIN_MAX, MAIN_Q, cap);
        fs.writeFileSync(path.join(destDir, mainName), main.buffer);

        const thumb = await makeVariant(normalized, THUMB_MAX, THUMB_Q, cap);
        fs.writeFileSync(path.join(destDir, thumbName), thumb.buffer);

        bytesOut += main.buffer.length + thumb.buffer.length;
        totalOut += 2;
        images.push({
          src: `/products/${p.slug}/${mainName}`,
          thumb: `/products/${p.slug}/${thumbName}`,
          alt,
          w: main.width,
          h: main.height,
        });
      } else {
        images.push({ src: `/products/${p.slug}/${mainName}`, thumb: `/products/${p.slug}/${thumbName}`, alt, w: 0, h: 0 });
      }
    }

    // 尺寸图恒排末位，不抢首图缩略
    const di = images.findIndex((im) => /dimension diagram/.test(im.alt));
    if (di >= 0 && di !== images.length - 1) images.push(images.splice(di, 1)[0]);

    // ---- 生成内容文件 ----
    const specLines = [];
    if (diagram) {
      specLines.push(`dimensions_mm: ${yamlStr(diagram.dimensionsMm)}`);
      // 源图明确写的是「一对」克重，逐字保留并显式标注基准，避免被读成单只
      specLines.push(`weight_g: ${diagram.weightG}`, 'weight_basis: pair');
    }

    const fm = [
      '---',
      `sku_code: ${p.sku}`,
      `title: ${yamlStr(p.title)}`,
      `slug: ${p.slug}`,
      `line: ${p.line}`,
      `category: ${p.category}`,
      ...specLines,
      'compliance_tag: on_request',
      'test_report_reference: null',
      '# 穿透类型未确认 → 保守取 false，PDP 因此不输出 EN 1811 耳针限值句，而非替客户断言',
      'ear_post: false',
      `short_description: ${yamlStr(p.desc)}`,
      'images:',
      ...images.map((im) => {
        const lines = [`  - src: ${im.src}`, `    thumb: ${im.thumb}`, `    alt: ${yamlStr(im.alt)}`];
        if (im.w) lines.push(`    width: ${im.w}`, `    height: ${im.h}`);
        return lines.join('\n');
      }),
      'dataStatus: real',
      '---',
      '',
      diagram
        ? `New arrival from the ${p.category} line. Measured size and pair weight are confirmed by the factory drawing; material grade, plating and MOQ are confirmed with your quotation.`
        : `New arrival from the ${p.category} line. Full specification — material grade, plating, dimensions, weight and MOQ — is confirmed with your quotation.`,
      '',
    ].join('\n');

    if (!DRY) fs.writeFileSync(path.join(OUT_CONTENT, `${p.slug}.md`), fm, 'utf8');

    manifest.push({
      no: p.no,
      slug: p.slug,
      sku: p.sku,
      category: p.category,
      line: p.line,
      images: images.length,
      folder,
      skipped: jpgs.length - kept.length,
      dimensionDiagram: diagramKey,
    });
    process.stdout.write(`. ${String(p.no).padStart(2, '0')} ${p.slug} → ${images.length} imgs${diagramKey ? ` [尺寸图 ${diagramKey} 已英译]` : ''}\n`);
  }

  if (!DRY) {
    fs.writeFileSync(
      path.join(ROOT, 'docs', 'material-intake', 'intake-result.json'),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          products: manifest,
          filesWritten: totalOut,
          imagesSkipped: totalSkipped,
          diagramsTranslated: totalTranslated,
          bytesWritten: bytesOut,
        },
        null,
        2
      ),
      'utf8'
    );
  }

  console.log('\n=== 入库汇总 ===');
  console.log(`产品: ${published.length}  →  成功 ${manifest.length}`);
  console.log(`写出文件: ${totalOut}（主图+缩略）`, DRY ? '[DRY RUN]' : `≈ ${(bytesOut / 1024 / 1024).toFixed(1)} MB`);
  console.log(`尺寸图英译发布: ${totalTranslated}`);
  console.log(`排除图片: ${totalSkipped}（中文海报/真人/明星/RMB 价签）`);
}

main().catch((e) => {
  console.error('入库失败:', e.message);
  process.exit(1);
});
