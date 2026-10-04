// scripts/ingest-1688.mjs — 1688 批次入库管线
// 依据 docs/material-intake/catalog-1688.json（已逐张目视核验的清单）：
//   1) 出响应式 WebP（主图 1200px / 缩略 360px）到 public/products/<slug>/
//   2) 生成 src/content/products/<slug>.md（dataStatus: real）
//   3) 价格 / MOQ / 材质等级 / 镀层一律留空 —— 1688 目录无可信数据，站点走「Price on request」降级
//   4) 入库前校验 slug / sku 与既有内容不冲突
//
// 用法: node scripts/ingest-1688.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CATALOG = path.join(ROOT, 'docs', 'material-intake', 'catalog-1688.json');
const OUT_PUBLIC = path.join(ROOT, 'public', 'products');
const OUT_CONTENT = path.join(ROOT, 'src', 'content', 'products');
const DRY = process.argv.includes('--dry');

const MAIN_MAX = 1200;
const THUMB_MAX = 360;
const MAIN_Q = 76;
const THUMB_Q = 72;

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

async function main() {
  const products = catalog.products;
  if (!products.length) throw new Error('清单为空');

  // ---- 冲突校验：slug 与 sku 都不得与既有内容重复 ----
  const existingFiles = fs.readdirSync(OUT_CONTENT).filter((f) => f.endsWith('.md'));
  const existingSet = new Set(existingFiles.map((f) => f.replace(/\.md$/, '')));
  const seenSlug = new Set();
  const seenSku = new Set();
  for (const p of products) {
    if (existingSet.has(p.slug)) throw new Error(`slug 与既有内容冲突: ${p.slug}`);
    if (seenSlug.has(p.slug)) throw new Error(`清单内 slug 重复: ${p.slug}`);
    if (seenSku.has(p.sku)) throw new Error(`清单内 sku 重复: ${p.sku}`);
    seenSlug.add(p.slug);
    seenSku.add(p.sku);
  }
  // 既有内容的 sku 也查一遍
  for (const f of existingFiles) {
    const raw = fs.readFileSync(path.join(OUT_CONTENT, f), 'utf8');
    const m = /^sku_code:\s*(\S+)/m.exec(raw);
    if (m && seenSku.has(m[1])) throw new Error(`sku 与既有内容冲突: ${m[1]} (${f})`);
  }

  let files = 0;
  let bytes = 0;

  for (const p of products) {
    if (!DRY) fs.mkdirSync(path.join(OUT_PUBLIC, p.slug), { recursive: true });

    const images = [];
    for (const im of p.images) {
      if (!fs.existsSync(im.path)) throw new Error(`源图缺失: ${im.path}`);
      const base = String(im.seq).padStart(2, '0');
      const mainName = `${base}.webp`;
      const thumbName = `${base}-thumb.webp`;
      const meta = await sharp(im.path).metadata();
      const rotated = await sharp(im.path).rotate().toBuffer();

      const mainBuf = await sharp(rotated)
        .resize(MAIN_MAX, MAIN_MAX, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: MAIN_Q, effort: 5 })
        .toBuffer();
      const thumbBuf = await sharp(rotated)
        .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: THUMB_Q, effort: 5 })
        .toBuffer();

      if (!DRY) {
        fs.writeFileSync(path.join(OUT_PUBLIC, p.slug, mainName), mainBuf);
        fs.writeFileSync(path.join(OUT_PUBLIC, p.slug, thumbName), thumbBuf);
      }
      files += 2;
      bytes += mainBuf.length + thumbBuf.length;

      images.push({
        src: `/products/${p.slug}/${mainName}`,
        thumb: `/products/${p.slug}/${thumbName}`,
        alt: im.seq === 1 ? `${p.title} — main view` : `${p.title} — view ${im.seq}`,
        w: Math.min(meta.width ?? MAIN_MAX, MAIN_MAX),
        h: Math.min(meta.height ?? MAIN_MAX, MAIN_MAX),
      });
    }

    const fm = [
      '---',
      `sku_code: ${p.sku}`,
      `title: ${yamlStr(p.title)}`,
      `slug: ${p.slug}`,
      `line: ${p.line}`,
      `category: ${p.category}`,
      'compliance_tag: on_request',
      'test_report_reference: null',
      '# 穿透类型未确认 → 保守取 false，PDP 因此不输出 EN 1811 耳针限值句',
      'ear_post: false',
      `short_description: ${yamlStr(p.shortDescription)}`,
      ...(p.styleTags.length ? ['style_tags:', ...p.styleTags.map((tg) => `  - ${yamlStr(tg)}`)] : []),
      'images:',
      ...images.map((im) =>
        [
          `  - src: ${im.src}`,
          `    thumb: ${im.thumb}`,
          `    alt: ${yamlStr(im.alt)}`,
          `    width: ${im.w}`,
          `    height: ${im.h}`,
        ].join('\n')
      ),
      'dataStatus: real',
      '---',
      '',
      `New arrival from the ${p.category} line. Base material is stated by the supplier as ${p.lineBasis.replace('标题明示 ', '')}; grade, plating specification, plating thickness, MOQ and tiered pricing are confirmed with your quotation.`,
      '',
    ].join('\n');

    if (!DRY) fs.writeFileSync(path.join(OUT_CONTENT, `${p.slug}.md`), fm, 'utf8');
    process.stdout.write(`. ${p.sku} ${p.slug} → ${images.length} imgs\n`);
  }

  if (!DRY) {
    fs.writeFileSync(
      path.join(ROOT, 'docs', 'material-intake', 'intake-result-1688.json'),
      JSON.stringify(
        { generatedAt: new Date().toISOString(), products: products.length, filesWritten: files, bytesWritten: bytes },
        null,
        2
      ),
      'utf8'
    );
  }

  console.log('\n=== 1688 批次入库汇总 ===');
  console.log(`发布款式: ${products.length}`);
  console.log(`写出文件: ${files}`, DRY ? '[DRY RUN]' : `≈ ${(bytes / 1024 / 1024).toFixed(1)} MB`);
  console.log(`扣住款式: ${catalog.held.length}（理由见 catalog-1688.json 的 held）`);
}

main().catch((e) => {
  console.error('入库失败:', e.message);
  process.exit(1);
});
