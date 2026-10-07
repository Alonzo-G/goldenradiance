// scripts/ingest-suppliers.mjs — 三厂家产品图整库入库管线（2026-10 产品库重建）
//
// 依据用户决策：1020 张厂家实拍图 = 全部在售货，以图片文件名为产品编号重建产品库，
// 原有 132 个产品（AI 占位 + 旧素材）全部下架。
//
// 输入：D:/AAAAAAA外贸资料/饰品/产品图/{钢骑士,骏娅,链艺} 三个厂家目录
// 分类：scripts/build-supplier-sheets.mjs 生成联络表 → 人工视觉逐 SKU 分类（品类/产品线/风格）
// 输出：
//   1) public/products/<slug>/NN.webp + NN-thumb.webp（主图 1200 / 缩略 360）
//   2) src/content/products/<slug>.md（dataStatus: real，规格留空走「随报价确认」降级）
//   3) docs/material-intake/supplier-intake.json（可追溯 manifest）
//
// 编号规则（用户确认）：文件名去掉尾部 _N 多图变体后缀 = 产品编号（大写）；
// 字母后缀（s/b/gc/jgL 等）是编号本身的一部分。
// 诚实红线：不编造规格/价格；厂家信息（目录名含联系人电话）不入站点产物。
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_PUBLIC = path.join(ROOT, 'public', 'products');
const OUT_CONTENT = path.join(ROOT, 'src', 'content', 'products');
const MANIFEST = path.join(ROOT, 'docs', 'material-intake', 'supplier-intake.json');
const DRY = process.argv.includes('--dry');

const MAIN_MAX = 1200;
const THUMB_MAX = 360;
const MAIN_Q = 76;
const THUMB_Q = 72;

const SUPPLIERS = [
  { dir: '钢骑士102672颜颜18867552390', tag: 'GK' },
  { dir: '骏娅-诚信值千金', tag: 'JY' },
  { dir: '链艺饰品Mick Huang', tag: 'LY' },
];

/** 有明确依据排除的图片（红叉作废标记等） */
const EXCLUDED_SKUS = new Set(['SZKK214']); // 厂家图上画了红叉作废标记，不发布

// ---- 分类（29 张联络表 + 5 张 480px 验证表逐 SKU 视觉核对，2026-10-07）----
// 例外品类：默认 bracelet，以下 SKU 是 necklace / ring / earrings
const NECKLACE = new Set([
  'GR160','GR161','GR183','GR185','GR187','GR188','GR189',
  'GR217','GR218','GR219','GR220','GR221','GR222','GR223','GR224','GR225',
  'GR230','GR231','GR232','GR233','GR234','GR235','GR236','GR237','GR238','GR239',
  'GR240','GR241','GR242','GR243','GR244','GR254',
  'GR262','GR263','GR264','GR265','GR266','GR267','GR268','GR269',
  'GR270','GR271','GR272','GR273','GR274','GR275','GR276','GR277','GR278','GR279','GR280','GR281',
  'GR311','GR313','GR314',
  ...range('GR332','GR378'),
]);
const RING = new Set(['GR001','GR002','GR003','GR291','GR292','GR293','GR294','GR295','GR296','GR297','GR298','SZGSS157']);
const EARRING = new Set(['GR302','GR305','GR306','GR307','GR308','GR309']);
// 耳钉针杆在照片中清晰可见 → ear_post true（其余一律保守 false）
const EAR_POST_TRUE = new Set(['GR305','GR306','GR307','GR308','GR309']);

function range(a, b) {
  const pa = a.match(/^([A-Z]+)(\d+)$/); const pb = b.match(/^([A-Z]+)(\d+)$/);
  if (!pa || !pb || pa[1] !== pb[1]) throw new Error(`bad range ${a}-${b}`);
  const out = [];
  for (let i = parseInt(pa[2], 10); i <= parseInt(pb[2], 10); i++) {
    out.push(pa[1] + String(i).padStart(pa[2].length, '0'));
  }
  return out;
}

/** 标题桶：按编号区间给英文标题（含款式词），SKU 恒在末尾。title ≤ 80 字符 */
function titleFor(sku, category) {
  const n = parseInt(sku.replace(/^\D+/, ''), 10) || 0;
  const g = (a, b) => sku.startsWith('GR') && n >= a && n <= b;
  const cat = { bracelet: 'Bracelet', necklace: 'Necklace', ring: 'Ring', earrings: 'Earrings' }[category];

  if (sku.startsWith('SZGSS')) return `Stainless Steel Cable ${cat} ${sku}`;
  if (sku.startsWith('SZKK')) return `Stainless Steel Cuff ${cat} ${sku}`;
  if (sku.startsWith('SZTX')) return `Stainless Steel Bangle ${cat} ${sku}`;
  // GK 的 GR001-003 钢缆戒指
  if (g(1, 3)) return `Stainless Steel Cable ${cat} ${sku}`;
  if (g(4, 58)) return `Gold-Tone Crystal ${cat} ${sku}`;
  if (g(59, 70)) return `Gold-Tone Flower ${cat} ${sku}`;
  if (g(71, 108)) return `Gold-Tone Crystal ${cat} ${sku}`;
  if (g(109, 130)) return `Gold-Tone Crystal Station ${cat} ${sku}`;
  if (n === 131 || n === 303) return `Gold-Tone Chain ${cat} ${sku}`;
  if (n === 132) return `Gold-Tone Curb Chain ${cat} ${sku}`;
  if (g(133, 158) || g(162, 162) || n === 310) return `Gold-Tone Crystal ${cat} ${sku}`;
  if (n === 159 || g(163, 186)) return `Gold-Tone Leaf ${cat} ${sku}`;
  if (g(187, 188)) return `Gold-Tone Heart ${cat} ${sku}`;
  if (n === 189) return `Gold-Tone Chain ${cat} ${sku}`;
  if (g(190, 261) && category === 'bracelet') return `Gold-Tone Clover ${cat} ${sku}`;
  if (g(190, 269) && category === 'necklace') {
    if (g(270, 281)) return `Gold-Tone Clover Lariat ${cat} ${sku}`;
    return `Gold-Tone Clover ${cat} ${sku}`;
  }
  if (g(262, 290) && category === 'bracelet') return `Gold-Tone Clover Charm ${cat} ${sku}`;
  if (g(291, 298)) return `Gold-Tone Clover ${cat} ${sku}`;
  if (n === 299 || g(329, 331) || g(379, 407)) return `Zircon Tennis ${cat} ${sku}`;
  if (n === 300) return `Gold-Tone Open Bangle ${sku}`;
  if (n === 301 || n === 312 || g(315, 326)) return `Gold-Tone Charm ${cat} ${sku}`;
  if (n === 302) return `Gold-Tone Wavy Hoop ${cat} ${sku}`;
  if (n === 304) return `Gold-Tone Heart Bangle ${sku}`;
  if (g(305, 309)) return `Gold-Tone Flower Drop ${cat} ${sku}`;
  if (n === 311) return `Gold-Tone Letter Pendant ${cat} ${sku}`;
  if (n === 313) return `Gold-Tone Circle Pendant ${cat} ${sku}`;
  if (n === 314) return `Gold-Tone Square Pendant ${cat} ${sku}`;
  if (n === 327) return `Gold-Tone Cross ${cat} ${sku}`;
  if (n === 328) return `Gold-Tone Clover ${cat} ${sku}`;
  if (n === 332 || (n >= 333 && n <= 336) || n === 354) return `Gold-Tone Cross ${cat} ${sku}`;
  if (n === 337 || n === 338 || n === 357) return `Gold-Tone Heart ${cat} ${sku}`;
  if (n === 344 || n === 347) return `Gold-Tone Nameplate ${cat} ${sku}`;
  if (n === 345 || n === 346) return `Gold-Tone Circle Pendant ${cat} ${sku}`;
  if (n === 348) return `Gold-Tone Zodiac ${cat} ${sku}`;
  if (n === 349) return `Gold-Tone Halo Pendant ${cat} ${sku}`;
  if (n === 350) return `Gold-Tone Number ${cat} ${sku}`;
  if (g(351, 353)) return `Gold-Tone Initial ${cat} ${sku}`;
  if (n === 358) return `Gold-Tone Cat Pendant ${cat} ${sku}`;
  if (n === 359 || n === 360 || g(361, 370) || g(373, 378)) return `Gold-Tone Pendant ${cat} ${sku}`;
  if (n === 355 || n === 356 || g(365, 366) || n === 371 || n === 372) return `Gold-Tone Charm ${cat} ${sku}`;
  return `Gold-Tone ${cat} ${sku}`;
}

/** 风格标签（仅在照片有明确款式依据时填，≤2 个） */
function styleFor(sku, category) {
  const n = parseInt(sku.replace(/^\D+/, ''), 10) || 0;
  const g = (a, b) => sku.startsWith('GR') && n >= a && n <= b;
  if (sku.startsWith('SZGSS')) return sku === 'SZGSS157' ? ['cable'] : ['cable', 'bangle'];
  if (sku.startsWith('SZKK')) return ['cuff', 'bangle'];
  if (sku.startsWith('SZTX')) return ['bangle'];
  if (g(1, 3)) return ['cable'];
  if (g(4, 21) || g(187, 188) || n === 304) return ['heart'];
  if (g(59, 70) || g(71, 108) || g(305, 309)) return ['flower'];
  if (g(109, 130)) return ['station'];
  if (n === 131 || n === 132 || n === 303 || n === 189) return ['chain'];
  if (n === 159 || g(160, 186)) return ['leaf'];
  if (g(190, 298)) return ['clover'];
  if (g(270, 281)) return ['clover', 'lariat'];
  if (g(282, 290)) return ['clover', 'charm'];
  if (n === 299 || g(329, 331) || g(379, 407)) return ['tennis'];
  if (n === 302) return ['hoop'];
  if (n === 311 || n === 344 || n === 345 || n === 346 || n === 347 || g(351, 353)) return ['initial-letter'];
  if (n === 348) return ['zodiac'];
  if (n === 350) return ['number'];
  if (n === 332 || g(333, 336) || n === 354 || n === 327) return ['cross'];
  if (n === 337 || n === 338 || n === 357) return ['heart'];
  return [];
}

function categoryFor(sku) {
  if (RING.has(sku)) return 'ring';
  if (EARRING.has(sku)) return 'earrings';
  if (NECKLACE.has(sku)) return 'necklace';
  return 'bracelet';
}

function lineFor(sku, supplier) {
  // 钢骑士（GK）= 不锈钢/钛钢专业厂；骏娅/链艺（JY/LY）= 金色时尚合金
  return supplier === 'GK' ? 'stainless-titanium-steel' : 'fashion-alloy-brass';
}

const DESC = {
  bracelet: 'Bracelet photographed from the supplier collection; material grade, plating, dimensions, weight and MOQ are confirmed with your quotation.',
  necklace: 'Necklace photographed from the supplier collection; material grade, plating, dimensions, weight and MOQ are confirmed with your quotation.',
  ring: 'Ring photographed from the supplier collection; material grade, plating, dimensions, weight and MOQ are confirmed with your quotation.',
  earrings: 'Earrings photographed from the supplier collection; material grade, plating, dimensions, weight and MOQ are confirmed with your quotation.',
};

const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// ---- 1. 扫描 + 分组 ----
/** @type {Map<string, {sku:string, supplier:string, files:string[]}>} */
const groups = new Map();
const collisions = [];
for (const sup of SUPPLIERS) {
  const abs = path.join('D:', 'AAAAAAA外贸资料', '饰品', '产品图', sup.dir);
  for (const f of fs.readdirSync(abs).filter((f) => /\.(jpe?g|png)$/i.test(f))) {
    const base = f.replace(/\.(jpe?g|png)$/i, '');
    const sku = base.replace(/_[0-9]+$/, '').toUpperCase();
    if (!/^[A-Z0-9]{3,32}$/.test(sku)) throw new Error(`SKU 非法: ${f} → ${sku}`);
    const g = groups.get(sku);
    if (g) {
      if (g.supplier !== sup.tag) collisions.push(`${sku}: ${g.supplier} + ${sup.tag}`);
      g.files.push(f);
    } else groups.set(sku, { sku, supplier: sup.tag, files: [f] });
  }
}
if (collisions.length) throw new Error('跨厂家 SKU 撞名:\n' + collisions.join('\n'));
for (const g of groups.values()) {
  g.files.sort((a, b) => {
    const av = /_[0-9]+$/.test(a.replace(/\.(jpe?g|png)$/i, '')) ? 1 : 0;
    const bv = /_[0-9]+$/.test(b.replace(/\.(jpe?g|png)$/i, '')) ? 1 : 0;
    if (av !== bv) return av - bv;
    return a.localeCompare(b, undefined, { numeric: true });
  });
}

// ---- 2. 入库 ----
if (!DRY) {
  fs.mkdirSync(OUT_PUBLIC, { recursive: true });
  fs.mkdirSync(OUT_CONTENT, { recursive: true });
}

const manifest = [];
let filesOut = 0, bytesOut = 0, idx = 0;

for (const g of groups.values()) {
  idx++;
  const { sku, supplier, files } = g;
  if (EXCLUDED_SKUS.has(sku)) {
    manifest.push({ sku, supplier, files, excluded: 'factory void-mark (red X) on photo' });
    process.stdout.write(`x ${sku} 排除（厂家作废标记）\n`);
    continue;
  }

  const category = categoryFor(sku);
  const line = lineFor(sku, supplier);
  const title = titleFor(sku, category);
  const slug = sku.toLowerCase();
  const styles = styleFor(sku, category);
  const earPost = EAR_POST_TRUE.has(sku);

  const srcDir = path.join('D:', 'AAAAAAA外贸资料', '饰品', '产品图',
    SUPPLIERS.find((s) => s.tag === supplier).dir);

  const images = [];
  if (!DRY) fs.mkdirSync(path.join(OUT_PUBLIC, slug), { recursive: true });

  for (let i = 0; i < files.length; i++) {
    const seq = String(i + 1).padStart(2, '0');
    const mainName = `${seq}.webp`;
    const thumbName = `${seq}-thumb.webp`;
    const alt = i === 0 ? `${title} — main view` : `${title} — view ${i + 1}`;

    if (!DRY) {
      const normalized = await sharp(path.join(srcDir, files[i])).rotate().toBuffer();
      const main = await sharp(normalized)
        .resize(MAIN_MAX, MAIN_MAX, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: MAIN_Q, effort: 5 })
        .toBuffer();
      fs.writeFileSync(path.join(OUT_PUBLIC, slug, mainName), main);
      const thumb = await sharp(normalized)
        .resize(THUMB_MAX, THUMB_MAX, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: THUMB_Q, effort: 5 })
        .toBuffer();
      fs.writeFileSync(path.join(OUT_PUBLIC, slug, thumbName), thumb);
      const m = await sharp(main).metadata();
      bytesOut += main.length + thumb.length;
      filesOut += 2;
      images.push({ src: `/products/${slug}/${mainName}`, thumb: `/products/${slug}/${thumbName}`, alt, width: m.width, height: m.height });
    } else {
      images.push({ src: `/products/${slug}/${mainName}`, thumb: `/products/${slug}/${thumbName}`, alt });
    }
  }

  const fm = [
    '---',
    `sku_code: ${sku}`,
    `title: ${yamlStr(title)}`,
    `slug: ${slug}`,
    `line: ${line}`,
    `category: ${category}`,
    'compliance_tag: on_request',
    'test_report_reference: null',
    '# 穿透类型未逐款确认 → 保守 false（耳钉针杆清晰可见者除外），PDP 据此决定是否输出 EN 1811 句',
    `ear_post: ${earPost}`,
    `short_description: ${yamlStr(DESC[category])}`,
    ...(styles.length ? [`style_tags: [${styles.map(yamlStr).join(', ')}]`] : []),
    'images:',
    ...images.map((im) => {
      const lines = [`  - src: ${im.src}`, `    thumb: ${im.thumb}`, `    alt: ${yamlStr(im.alt)}`];
      if (im.width) lines.push(`    width: ${im.width}`, `    height: ${im.height}`);
      return lines.join('\n');
    }),
    'dataStatus: real',
    '---',
    '',
    `New arrival from the ${category} line. Full specification — material grade, plating, dimensions, weight and MOQ — is confirmed with your quotation.`,
    '',
  ].join('\n');

  if (!DRY) fs.writeFileSync(path.join(OUT_CONTENT, `${slug}.md`), fm, 'utf8');

  manifest.push({ sku, supplier, category, line, title, slug, styles, files, images: images.length });
  if (idx % 50 === 0) process.stdout.write(`… ${idx}/${groups.size}\n`);
}

const dist = {};
for (const m of manifest) if (!m.excluded) dist[m.category] = (dist[m.category] ?? 0) + 1;

if (!DRY) {
  fs.writeFileSync(MANIFEST, JSON.stringify({ generatedAt: new Date().toISOString(), total: manifest.length, dist, products: manifest }, null, 2), 'utf8');
}

console.log(`\n=== 入库汇总 ${DRY ? '[DRY]' : ''} ===`);
console.log(`SKU: ${manifest.length}（排除 ${EXCLUDED_SKUS.size}）`);
console.log('品类分布:', JSON.stringify(dist));
if (!DRY) console.log(`图片: ${filesOut} 个文件 ≈ ${(bytesOut / 1024 / 1024).toFixed(1)} MB → manifest: docs/material-intake/supplier-intake.json`);
