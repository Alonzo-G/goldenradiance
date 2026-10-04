// scripts/ingest-1688-sku.mjs — SKU 级入库管线
// 依据 docs/material-intake/catalog-1688-sku.json：
//   1) 撤回上一轮「链接级」产品中已被 SKU 级取代的部分（删 .md 与图片目录）
//   2) 出响应式 WebP（主图 1200 / 缩略 360）
//   3) 生成 src/content/products/<slug>.md（dataStatus: real）
//   4) 价格 / MOQ / 材质牌号 / 镀层一律留空
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NEW = path.join(ROOT, 'docs', 'material-intake', 'catalog-1688-sku.json');
const OLD = path.join(ROOT, 'docs', 'material-intake', 'catalog-1688.json');
const OUT_PUBLIC = path.join(ROOT, 'public', 'products');
const OUT_CONTENT = path.join(ROOT, 'src', 'content', 'products');
const DRY = process.argv.includes('--dry');

const MAIN_MAX = 1200, THUMB_MAX = 360, MAIN_Q = 76, THUMB_Q = 72;
const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

async function main() {
  const next = JSON.parse(fs.readFileSync(NEW, 'utf8'));
  const prev = JSON.parse(fs.readFileSync(OLD, 'utf8'));

  const keepSlugs = new Set(next.products.map((p) => p.slug));

  // ---- 1) 撤回本管线此前写过、但已不在新清单中的产品 ----
  // 归属判定：SKU 以 RA- 开头（1688 批次编号段），且不属于首批工厂素材。
  // 这样既能清掉本管线上一轮的孤儿，又不会误伤首批 70 款与占位数据。
  const batch1 = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'material-intake', 'intake-result.json'), 'utf8'));
  const batch1Skus = new Set(batch1.products.map((p) => p.sku));
  const batch1Slugs = new Set(batch1.products.map((p) => p.slug));

  const withdraw = [];
  for (const f of fs.readdirSync(OUT_CONTENT).filter((x) => x.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    if (keepSlugs.has(slug)) continue;
    const sku = /^sku_code:\s*(\S+)/m.exec(fs.readFileSync(path.join(OUT_CONTENT, f), 'utf8'))?.[1];
    if (!sku || !sku.startsWith('RA-')) continue;
    if (batch1Skus.has(sku) || batch1Slugs.has(slug)) continue;
    withdraw.push({ slug, sku });
    if (DRY) continue;
    fs.rmSync(path.join(OUT_CONTENT, f));
    const dir = path.join(OUT_PUBLIC, slug);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true });
  }

  // ---- 2) 冲突校验 ----
  // 款式级回退产品会复用自身旧 slug/sku（正常覆盖），因此
  // 「slug 相同但 SKU 不同」才算真冲突。
  const existingBySlug = new Map();
  for (const f of fs.readdirSync(OUT_CONTENT).filter((x) => x.endsWith('.md'))) {
    const slug = f.replace(/\.md$/, '');
    const m = /^sku_code:\s*(\S+)/m.exec(fs.readFileSync(path.join(OUT_CONTENT, f), 'utf8'));
    existingBySlug.set(slug, m?.[1] ?? null);
  }
  const seen = new Set();
  for (const p of next.products) {
    if (seen.has(p.slug)) throw new Error(`清单内 slug 重复: ${p.slug}`);
    seen.add(p.slug);
    const owner = existingBySlug.get(p.slug);
    if (owner && owner !== p.sku) {
      throw new Error(`slug 撞上既有其它产品: ${p.slug}（既有 ${owner} / 新 ${p.sku}）`);
    }
  }
  const keepSkus = new Set(next.products.map((p) => p.sku));
  for (const [slug, sku] of existingBySlug) {
    if (keepSlugs.has(slug)) continue;
    if (sku && keepSkus.has(sku)) throw new Error(`sku 与既有内容冲突: ${sku} (${slug})`);
  }

  let files = 0, bytes = 0;
  for (const p of next.products) {
    if (!DRY) fs.mkdirSync(path.join(OUT_PUBLIC, p.slug), { recursive: true });
    const images = [];
    for (const im of p.images) {
      if (!fs.existsSync(im.abs)) throw new Error(`源图缺失: ${im.abs}`);
      const base = String(im.seq ?? images.length + 1).padStart(2, '0');
      const rotated = await sharp(im.abs).rotate().toBuffer();
      const meta = await sharp(rotated).metadata();
      const mainBuf = await sharp(rotated).resize(MAIN_MAX, MAIN_MAX, { fit: 'inside', withoutEnlargement: true }).webp({ quality: MAIN_Q, effort: 5 }).toBuffer();
      const thumbBuf = await sharp(rotated).resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true }).webp({ quality: THUMB_Q, effort: 5 }).toBuffer();
      if (!DRY) {
        fs.writeFileSync(path.join(OUT_PUBLIC, p.slug, `${base}.webp`), mainBuf);
        fs.writeFileSync(path.join(OUT_PUBLIC, p.slug, `${base}-thumb.webp`), thumbBuf);
      }
      files += 2; bytes += mainBuf.length + thumbBuf.length;
      images.push({
        src: `/products/${p.slug}/${base}.webp`,
        thumb: `/products/${p.slug}/${base}-thumb.webp`,
        alt: images.length === 0 ? `${p.title} — main view` : `${p.title} — view ${images.length + 1}`,
        w: Math.min(meta.width ?? MAIN_MAX, MAIN_MAX),
        h: Math.min(meta.height ?? MAIN_MAX, MAIN_MAX),
      });
    }

    const spec = [];
    if (p.dimensions_mm) spec.push(`dimensions_mm: ${yamlStr(p.dimensions_mm)}`);
    if (p.weight_g) spec.push(`weight_g: ${p.weight_g}`, 'weight_basis: pair');
    if (p.dimensionsFrom) spec.push(`# 尺寸与克重来源：${p.dimensionsFrom}`);

    const fm = [
      '---',
      `sku_code: ${p.sku}`,
      `title: ${yamlStr(p.title)}`,
      `slug: ${p.slug}`,
      `line: ${p.line}`,
      `category: ${p.category}`,
      ...spec,
      'compliance_tag: on_request',
      'test_report_reference: null',
      '# 穿透类型未确认 → 保守取 false，PDP 因此不输出 EN 1811 耳针限值句',
      'ear_post: false',
      `short_description: ${yamlStr(p.shortDescription)}`,
      ...(p.styleTags?.length ? ['style_tags:', ...p.styleTags.map((t) => `  - ${yamlStr(t)}`)] : []),
      'images:',
      ...images.flatMap((im) => [`  - src: ${im.src}`, `    thumb: ${im.thumb}`, `    alt: ${yamlStr(im.alt)}`, `    width: ${im.w}`, `    height: ${im.h}`]),
      'dataStatus: real',
      '---',
      '',
      `${p.shortDescription}${p.granularity === 'style-level' ? ' Colourways for this style are confirmed with your quotation.' : ''}`,
      '',
    ].join('\n');

    if (!DRY) fs.writeFileSync(path.join(OUT_CONTENT, `${p.slug}.md`), fm, 'utf8');
  }

  if (!DRY) {
    fs.writeFileSync(
      path.join(ROOT, 'docs', 'material-intake', 'intake-result-1688-sku.json'),
      JSON.stringify({ generatedAt: new Date().toISOString(), products: next.products.length, withdrawn: withdraw.length, filesWritten: files, bytesWritten: bytes }, null, 2), 'utf8');
  }

  const t = next._meta.totals;
  console.log('=== SKU 级入库汇总 ===');
  console.log(`产品: ${t.products}（SKU 级 ${t.skuLevel} + 款式级 ${t.styleLevel}）`);
  console.log(`撤回链接级产品: ${withdraw.length}${withdraw.length ? ' → ' + withdraw.map((w) => w.sku).join(', ') : ''}`);
  console.log(`写出文件: ${files}`, DRY ? '[DRY RUN]' : `≈ ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`品类: ${JSON.stringify(next._meta.byCategory)}`);
  console.log(`产品线: ${JSON.stringify(next._meta.byLine)}`);
}

main().catch((e) => { console.error('入库失败:', e.message); process.exit(1); });
