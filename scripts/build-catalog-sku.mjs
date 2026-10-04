// scripts/build-catalog-sku.mjs — 按 SKU 粒度重建 1688 批次产品清单
// 输入：.tmp-1688/verdicts.json（审核判定，按 "<供应商>:<位号>" 索引）
// 输出：docs/material-intake/catalog-1688-sku.json
//
// 粒度规则
//   SKU 级  —— 每个通过审核的颜色变体独立成一条产品，SKU 编码可回溯到 1688 offerId
//   款式级  —— 该链接无任何可用 SKU 图、但有干净主图时，保留一条款式级条目并标注
//   尺寸图  —— 只作数据源，数值进 diagramData；不作为商品图发布
import fs from 'node:fs';
import path from 'node:path';
import { STYLES, lineFor, baseEn } from './sku-style-table.mjs';

const SRC = 'D:\\AAAAAAA外贸资料\\饰品\\产品(1)';
const TMP = path.resolve('.tmp-1688');
const inv = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/inventory-1688.json'), 'utf8'));
const prev = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/catalog-1688.json'), 'utf8'));
const verdicts = JSON.parse(fs.readFileSync(path.join(TMP, 'verdicts.json'), 'utf8'));

const CAT = { earrings: 'E', necklace: 'N', bracelet: 'B', cuff: 'C', ring: 'R', 'hair-accessory': 'H', anklet: 'A', brooch: 'O' };
const CATWORD = { earrings: 'Earrings', necklace: 'Necklace', bracelet: 'Bracelet', cuff: 'Cuff', ring: 'Ring', 'hair-accessory': 'Hair Accessory', anklet: 'Anklet', brooch: 'Brooch' };

const colorLabel = (c) => (!c || c === 'n/a' || c === 'uncertain' ? null : c.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('-'));
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const skuOrdinal = (img) => String(Number(/(\d+)\.jpg$/i.exec(img)?.[1] ?? 0)).padStart(2, '0');

const cleanMain = {};
for (const p of prev.products) cleanMain[p.no - 1] = p;

const products = [];
const held = [];
const diagramData = [];
const usedSlugs = new Set();
const variantSeen = new Map();
const usedSkus = new Set(Object.values(cleanMain).map((m) => m.sku));
const posMap = {};
for (const v of ['骏娅', '空屿']) {
  const f = path.join(TMP, `cand-map-${v}.json`);
  if (!fs.existsSync(f)) continue;
  for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) posMap[`${v}:${e.pos}`] = e;
}

for (const [key, e] of Object.entries(posMap)) {
  const v = verdicts[key];
  if (!v) continue;
  const li = e.productIndex;
  const style = STYLES[li];
  if (!style) { held.push({ listing: li + 1, pos: key, reasonCode: 'NO_STYLE_NAME', reason: '款式英文名未定义' }); continue; }

  if (v.verdict === 'diagram') {
    // 源图写法为 "weight:5.26/pair 0.18oz/pair"（克重无 g 后缀）与 "dims=5cm x 2.3cm"
    const wRaw = /weight=([^;]*)/i.exec(v.data || '')?.[1]?.trim() ?? '';
    const dRaw = /dims=([^;]*)/i.exec(v.data || '')?.[1]?.trim() ?? '';
    const grams = /([\d.]+)/.exec(wRaw)?.[1];
    const oz = /([\d.]+)\s*oz/i.exec(wRaw)?.[1];
    let conflict = null;
    if (grams && oz) {
      const expect = Number(grams) / 28.3495;
      if (Math.abs(expect - Number(oz)) / Number(oz) > 0.12) {
        conflict = `源图克重自相矛盾：${grams}g 应约 ${expect.toFixed(2)}oz，标注却为 ${oz}oz`;
      }
    }
    diagramData.push({
      pos: key, listing: li + 1, offerId: e.offerId, img: e.img, category: v.category,
      weight_g: grams ? Number(grams) : null, weightOz: oz ? Number(oz) : null,
      dimensions_raw: dRaw || null, dataRaw: v.data, sourceConflict: conflict, note: v.note || null,
    });
    continue;
  }

  if (v.verdict !== 'clean') {
    held.push({ listing: li + 1, pos: key, offerId: e.offerId, img: e.img, reasonCode: v.verdict.toUpperCase(), reason: v.note || v.verdict });
    continue;
  }

  const line = lineFor(style.base);
  const matEn = baseEn(style.base);
  if (!line || !matEn) {
    held.push({
      listing: li + 1, pos: key, offerId: e.offerId, img: e.img,
      reasonCode: style.base ? 'LINE_TAXONOMY_GAP' : 'NO_BASE_MATERIAL',
      reason: style.base
        ? `标题基材为 ${style.base}，现有三条产品线无法容纳`
        : '标题未声明基材，无法判定产品线归属',
    });
    continue;
  }

  const cat = v.category || 'necklace';
  const catWord = CATWORD[cat] ?? 'Piece';
  const ord = skuOrdinal(e.img);
  const listingNo = String(li + 1).padStart(2, '0');
  const sku = `RA-${CAT[cat] ?? 'X'}-${listingNo}${ord}`;
  if (usedSkus.has(sku)) { held.push({ listing: li + 1, pos: key, reasonCode: 'SKU_DUP', reason: `SKU 编码重复 ${sku}` }); continue; }
  usedSkus.add(sku);

  // 款式名去掉尾部品类词，品类由本 SKU 实际判定结果决定。
  // 原因：同一链接内可能混有不同品类（例：骏娅 #34 前 15 个 SKU 是项链、后 6 个是手链），
  // 款式名里写死品类会产出 "Heart Zircon Tennis Necklace Bracelet" 这种自相矛盾的标题。
  const styleBase = style.style
    .replace(new RegExp('\\s(' + Object.values(CATWORD).join('|') + ')$', 'i'), '')
    .replace(/\s(Jewelry )?Set$/i, '')
    .trim();

  const col = colorLabel(v.color);
  let title = col ? `${col} ${styleBase} ${catWord}` : `${styleBase} ${catWord}`;

  let slug = slugify(`${v.color && v.color !== 'uncertain' ? v.color : 'untitled'}-${styleBase}-${catWord}`);
  if (usedSlugs.has(slug)) slug = `${slug}-v${ord}`;
  usedSlugs.add(slug);

  // 同款式 + 同颜色 + 同品类出现多个 SKU：说明供应商按其它维度（长度/尺寸）分了 SKU，
  // 但目录导出未含 SKU 属性表，无法区分 → 标题加变体序号并标注待确认，不编造差异。
  const sig = `${styleBase}|${v.color}|${cat}`;
  variantSeen.set(sig, (variantSeen.get(sig) ?? 0) + 1);
  const dupSig = variantSeen.get(sig) > 1;
  if (dupSig) title = `${title} (Variant ${ord})`;

  const p = inv.products[li];
  const folder = fs.readdirSync(path.join(SRC, p.vendor)).find((f) => f.startsWith(p.folder.slice(0, 20)));
  const abs = path.join(SRC, p.vendor, folder, 'SKU 属性图', e.img);
  if (!fs.existsSync(abs)) { held.push({ listing: li + 1, pos: key, reasonCode: 'FILE_MISSING', reason: abs }); continue; }

  products.push({
    granularity: 'sku',
    sku, slug, title,
    titleCn: p.titleCn,
    colorRaw: v.color ?? null,
    category: cat, line,
    lineBasis: `supplier title states ${matEn}`,
    styleFamily: { offerId: e.offerId, styleCn: p.titleCn, styleEn: style.style },
    shortDescription: col
      ? `${col} colourway of the ${styleBase.toLowerCase()}. Base material is stated by the supplier as ${matEn}; grade, plating specification, MOQ and tiered pricing are confirmed with your quotation.`
      : `${styleBase} in the colourway shown. Base material is stated by the supplier as ${matEn}; grade, plating specification, MOQ and tiered pricing are confirmed with your quotation.`,
    styleTags: [...new Set([cat, v.color, style.style.split(' ')[0]].filter((t) => t && t !== 'n/a' && t !== 'uncertain').map(slugify))],
    vendor: p.vendor,
    images: [{ sub: 'SKU 属性图', file: e.img, abs, seq: 1 }],
    dimensions_mm: null, weight_g: null, weight_basis: null, dimensionsFrom: null,
    offerId: e.offerId, sourceUrl: p.productUrl,
    priceUsd: null, moqMin: null, moqMax: null, materialGrade: null, platingSpec: null,
    note: dupSig ? `与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。` + (v.note ? ` ${v.note}` : '') : (v.note || null),
  });
}

// ---- 款式级回退：该链接没有任何可用 SKU 图，但有已核验的干净主图 ----
const listingsWithSku = new Set(products.map((p) => p.styleFamily.offerId));
for (const [liStr, m] of Object.entries(cleanMain)) {
  const li = Number(liStr);
  if (listingsWithSku.has(m.offerId)) continue;
  const style = STYLES[li];
  const matEn = baseEn(style?.base);
  const line = lineFor(style?.base);
  if (!matEn || !line) continue;
  products.push({
    granularity: 'style-level',
    sku: m.sku, slug: m.slug, title: m.title,
    titleCn: inv.products[li].titleCn, colorRaw: null,
    category: m.category, line,
    lineBasis: `supplier title states ${matEn}`,
    styleFamily: { offerId: inv.products[li].offerId, styleCn: inv.products[li].titleCn, styleEn: style.style },
    shortDescription: m.desc,
    styleTags: [m.category],
    vendor: inv.products[li].vendor,
    images: m.images.map((im, k) => ({ sub: im.sub, file: im.file, abs: im.path, seq: k + 1 })),
    dimensions_mm: null, weight_g: null, weight_basis: null, dimensionsFrom: null,
    offerId: inv.products[li].offerId, sourceUrl: inv.products[li].productUrl,
    priceUsd: null, moqMin: null, moqMax: null, materialGrade: null, platingSpec: null,
    note: '该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。',
  });
}

products.sort((a, b) => a.sku.localeCompare(b.sku));

const byCat = {}, byLine = {};
for (const p of products) { byCat[p.category] = (byCat[p.category] || 0) + 1; byLine[p.line] = (byLine[p.line] || 0) + 1; }

fs.writeFileSync(path.resolve('docs/material-intake/catalog-1688-sku.json'), JSON.stringify({
  _meta: {
    sourceDir: SRC, granularity: 'sku', generatedAt: new Date().toISOString(),
    note: '产品粒度 = SKU（颜色变体）。款式族以 styleFamily 记录 offerId，不再作为产品层。',
    policy: [
      '每个通过审核的颜色变体独立成一条产品；SKU 编码 = RA-{品类}-{链接号}{变体号}，可回溯到 1688 offerId。',
      '颜色名为依据图片判读的结果，**不是供应商官方 SKU 属性名**（目录导出未含 SKU 属性表），须客户核对。',
      '所有面向站点的文案必须经 baseEn() 转成英文——中文基材直接入文案会把汉字带进英文站产物。',
      '尺寸/重量标注图只作数据源；图上 0.xx 为盎司不是美元，但仍不作为商品图发布。',
      '产品线归属必须有标题明示基材；S925 银不在现有三条线内，记 LINE_TAXONOMY_GAP。',
      '价格/MOQ/材质牌号/镀层厚度一律留空。',
    ],
    totals: {
      listings: inv.products.length,
      products: products.length,
      skuLevel: products.filter((p) => p.granularity === 'sku').length,
      styleLevel: products.filter((p) => p.granularity === 'style-level').length,
      images: products.reduce((a, p) => a + p.images.length, 0),
      held: held.length,
      diagramData: diagramData.length,
    },
    byCategory: byCat, byLine, diagramData,
  },
  products, held,
}, null, 2), 'utf8');

console.log('产品:', products.length, '= SKU 级', products.filter((p) => p.granularity === 'sku').length, '+ 款式级', products.filter((p) => p.granularity === 'style-level').length);
console.log('品类:', JSON.stringify(byCat));
console.log('产品线:', JSON.stringify(byLine));
console.log('图片:', products.reduce((a, p) => a + p.images.length, 0), '| 扣住条目:', held.length);
const rc = {};
for (const h of held) rc[h.reasonCode] = (rc[h.reasonCode] || 0) + 1;
console.log('扣住原因:', JSON.stringify(rc));
console.log('尺寸重量标注图提取:', diagramData.length, '条');
const cf = diagramData.filter((d) => d.sourceConflict);
if (cf.length) console.log('  源图自相矛盾', cf.length, '条:', cf.map((d) => d.pos).join(', '));
