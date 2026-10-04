// scripts/build-catalog-1688.mjs — 生成 1688 批次结构化清单
// 人工逐张核验后的结果固化在此：发布 / 扣住 / 待确认，逐款写明理由。
// 品类与产品线以「标题明示的基材 + 已核验图片内容」为依据，缺证据一律不猜。
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'D:\\AAAAAAA外贸资料\\饰品\\产品(1)';
const OUT = path.resolve('docs/material-intake/catalog-1688.json');
const inv = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/inventory-1688.json'), 'utf8'));

// ---- 已逐张核验通过的款式（18 款）----
const PUBLISH = [
  { i: 2,  sku: 'RA-N-101', slug: 'white-zircon-square-pendant-necklace',
    title: 'White Zircon Square Pendant Necklace', category: 'necklace',
    desc: 'A square white zircon pendant on a slim stainless chain. Minimal geometric styling that pairs as easily with plain bands as it does on its own.',
    imgs: [['主图', '主图_05.jpg']], tags: ['minimal', 'geometric', 'zircon'] },
  { i: 3,  sku: 'RA-N-102', slug: 'green-leaf-zircon-pendant-necklace',
    title: 'Green Leaf Zircon Pendant Necklace', category: 'necklace',
    desc: 'Two small green leaves on a fine chain, shown at two drop lengths so the shorter version can sit at the collarbone and the longer one over a neckline.',
    imgs: [['主图', '主图_04.jpg'], ['主图', '主图_07.jpg']], tags: ['botanical', 'leaf', 'zircon'] },
  { i: 4,  sku: 'RA-B-103', slug: 'heart-zircon-link-bracelet',
    title: 'Heart Zircon Link Bracelet', category: 'bracelet',
    desc: 'Heart-shaped white zircon links alternating with plain metal links, so the motif reads clearly without making the whole bracelet busy.',
    imgs: [['主图', '主图_11.jpg']], tags: ['heart', 'zircon', 'everyday'] },
  { i: 5,  sku: 'RA-N-104', slug: 'butterfly-tassel-pendant-necklace',
    title: 'Butterfly Tassel Pendant Necklace', category: 'necklace',
    desc: 'A slim butterfly pendant with a fine tassel drop on a long chain. Lightweight, with the movement built into the drop rather than the motif.',
    imgs: [['主图', '主图_05.jpg'], ['主图', '主图_04.jpg']], tags: ['butterfly', 'tassel', 'light-luxury'] },
  { i: 13, sku: 'RA-B-105', slug: 'six-flower-zircon-bracelet',
    title: 'Six-Flower Zircon Bracelet', category: 'bracelet',
    desc: 'Six open four-leaf clover links, each centred with a small zircon, shown in two colourways. An airy take on the motif that still reads across a counter.',
    imgs: [['SKU 属性图', 'SKU 属性图_04.jpg'], ['SKU 属性图', 'SKU 属性图_06.jpg']], tags: ['four-leaf-clover', 'zircon', 'trending'] },
  { i: 14, sku: 'RA-N-106', slug: 'open-ring-letter-pendant-necklace',
    title: 'Open Ring and Bar Letter Pendant Necklace', category: 'necklace',
    desc: 'An open ring paired with a slim letter bar on a fine chain. The ring keeps the direction without the weight of a full pendant.',
    imgs: [['主图', '主图_03.jpg'], ['主图', '主图_08.jpg']], tags: ['geometric', 'lettering', 'minimal'] },
  { i: 16, sku: 'RA-B-107', slug: 'chunky-chain-bracelet',
    title: 'Chunky Chain Bracelet', category: 'bracelet',
    desc: 'A chunky chain bracelet with pearl drops, shown in a silver-tone and a red-beaded colourway.',
    imgs: [['主图', '主图_10.jpg'], ['主图', '主图_01.jpg']], tags: ['everyday', 'minimal'],
    note: '两张已核验图风格差异较大（珍珠链 vs 红珠链），是否同款不同配色需客户确认。' },
  { i: 17, sku: 'RA-N-108', slug: 'two-face-clover-pendant-necklace',
    title: 'Two-Face Clover Pendant Necklace', category: 'necklace',
    desc: 'A four-leaf clover pendant with a dark face and a pavé gold-tone rim, built to be read from both sides.',
    imgs: [['主图', '主图_05.jpg']], tags: ['four-leaf-clover', 'light-luxury'] },
  { i: 18, sku: 'RA-N-109', slug: 'shell-butterfly-pendant-necklace',
    title: 'Shell Butterfly Pendant Necklace', category: 'necklace',
    desc: 'A slim butterfly pendant on a fine gold-tone chain, with pale shell inlay across the wings.',
    imgs: [['主图', '主图_05.jpg'], ['主图', '主图_03.jpg']], tags: ['butterfly', 'shell', 'vintage'] },
  { i: 20, sku: 'RA-N-110', slug: 'six-stone-disc-pendant-necklace',
    title: 'Six-Stone Disc Pendant Necklace', category: 'necklace',
    desc: 'A flat round pendant with six evenly spaced stones on a fine chain. Coin-pendant sizing that layers without competing.',
    imgs: [['主图', '主图_04.jpg'], ['主图', '主图_08.jpg']], tags: ['minimal', 'zircon', 'everyday'] },
  { i: 22, sku: 'RA-N-111', slug: 'green-bead-y-necklace',
    title: 'Green Bead Y-Necklace', category: 'necklace',
    desc: 'A Y-shaped necklace pairing a fine chain with a green-beaded drop, in stainless steel with an 18K gold-tone finish.',
    imgs: [['主图', '主图_12.jpg'], ['主图', '主图_09.jpg']], tags: ['geometric', 'everyday'],
    note: '标题写「花朵 Y 型项链」，但已核验图为绿珠链，无花朵元素，品类按图片判定，需客户确认。' },
  { i: 24, sku: 'RA-B-112', slug: 'five-clover-bracelet',
    title: 'Five-Clover Bracelet', category: 'bracelet',
    desc: 'Five open clover links with a raised rim, in rose-gold and deep red tones. A statement bracelet that keeps an open, airy profile.',
    imgs: [['主图', '主图_07.jpg'], ['主图', '主图_08.jpg']], tags: ['four-leaf-clover', 'vintage'] },
  { i: 25, sku: 'RA-E-113', slug: 'textured-clover-stud-earrings',
    title: 'Textured Clover Stud Earrings', category: 'earrings',
    desc: 'Textured four-leaf clover studs in silver-tone and gold-tone. A flat profile, so they sit close to the lobe.',
    imgs: [['主图', '主图_05.jpg'], ['主图', '主图_10.jpg']], tags: ['four-leaf-clover', 'minimal'],
    note: '该链接为「套装」（标题含项链/手链/耳钉），但本批次可用干净图仅耳钉，品类按图片判定，套装构成待客户确认。' },
  { i: 29, sku: 'RA-N-114', slug: 'black-round-pendant-necklace',
    title: 'Black Round Pendant Necklace', category: 'necklace',
    desc: 'A small black round pendant on a gold-tone chain with two elongated stations.',
    imgs: [['主图', '主图_05.jpg']], tags: ['minimal', 'everyday'],
    note: '标题提到「别针 / 罗马数字」，已核验图中不可见，未写入描述。' },
  { i: 30, sku: 'RA-N-115', slug: 'black-ceramic-bead-necklace',
    title: 'Black Ceramic Bead Necklace', category: 'necklace',
    desc: 'A ribbed black-and-silver focal bead on a fine chain, with small crystal stations either side.',
    imgs: [['主图', '主图_01.jpg'], ['主图', '主图_08.jpg']], tags: ['minimal', 'everyday'] },
  { i: 34, sku: 'RA-B-116', slug: 'zircon-tennis-bracelet',
    title: 'Zircon Tennis Bracelet', category: 'bracelet',
    desc: 'A line of round white zircon set flush in a bracelet, shown plain and with heart-shaped stations.',
    imgs: [['主图', '主图_21.jpg'], ['主图', '主图_22.jpg']], tags: ['zircon', 'heart', 'trending'],
    note: '标题为「项链」，但本批次可用干净图为手链，品类按图片判定，需客户确认该链接是否含项链。' },
  { i: 35, sku: 'RA-N-117', slug: 'pave-clover-pendant-necklace',
    title: 'Pavé Clover Pendant Necklace', category: 'necklace',
    desc: 'A pavé-set clover pendant on a fine gold-tone chain, with a soft matte ground against the stones.',
    imgs: [['主图', '主图_02.jpg']], tags: ['four-leaf-clover', 'light-luxury'] },
  { i: 36, sku: 'RA-N-118', slug: 'square-plate-snake-chain-necklace',
    title: 'Square-Plate Snake Chain Necklace', category: 'necklace',
    desc: 'A snake chain broken up with flat square plates, in silver-tone and gold-tone. A plain base that picks up its texture from the plates.',
    imgs: [['主图', '主图_07.jpg'], ['主图', '主图_05.jpg']], tags: ['snake-chain', 'geometric', 'minimal'] },
];

// ---- 扣住不发布的款式，逐款写明理由 ----
const HELD = {
  ALL_MODEL: '全部可得图片均为真人佩戴照（部分含可辨识面部），不适合作为 B2B 目录图',
  NO_IMAGE: '该链接未下载任何图片，无图不可上架',
  ALL_WATERMARK: '可得影棚图均叠加供应商中文水印（东莞市骏娅饰品有限公司），去字后不可用',
  NO_BASE_MATERIAL: '标题未声明基材（不锈钢/钛钢/合金），无法判定产品线归属，按不编造原则扣住',
  THIRD_PARTY_BRAND: '图片带第三方品牌水印（MILanTing / LALIAN components）并叠加 USD 单价文字，挂到 Rayan Accessories 名下涉商标与价格风险',
};

const CAT2SKU = { earrings: 'E', necklace: 'N', bracelet: 'B', ring: 'R', cuff: 'C' };

const products = PUBLISH.map((p) => {
  const src = inv.products[p.i];
  const folder = fs.readdirSync(path.join(SRC, src.vendor)).find((f) => f.startsWith(src.folder.slice(0, 20)));
  return {
    no: p.i + 1,
    offerId: src.offerId,
    sku: p.sku,
    slug: p.slug,
    title: p.title,
    titleCn: src.titleCn,
    category: p.category,
    line: 'stainless-titanium-steel',
    lineBasis: '标题明示 316L 不锈钢 / 钛钢',
    styleTags: p.tags,
    shortDescription: p.desc,
    vendor: src.vendor,
    images: p.imgs.map(([sub, file], k) => ({
      sub, file, seq: k + 1,
      path: path.join(SRC, src.vendor, folder, sub, file),
    })),
    sourceUrl: src.productUrl,
    note: p.note ?? null,
    priceUsd: null,
    moqMin: null,
    moqMax: null,
    materialGrade: null,
    platingSpec: null,
  };
});

// ---- 全量 52 款状态台账 ----
const publishedIdx = new Set(PUBLISH.map((p) => p.i));
const held = [];
for (let i = 0; i < inv.products.length; i++) {
  if (publishedIdx.has(i)) continue;
  const p = inv.products[i];
  let reasonCode, reason;
  if (p.vendor.includes('空屿')) {
    reasonCode = 'THIRD_PARTY_BRAND'; reason = HELD.THIRD_PARTY_BRAND;
  } else if (p.counts.main + p.counts.sku + p.counts.desc === 0) {
    reasonCode = 'NO_IMAGE'; reason = HELD.NO_IMAGE;
  } else if (i === 6) {
    reasonCode = 'ALL_WATERMARK'; reason = HELD.ALL_WATERMARK;
  } else if ([0, 9, 15].includes(i)) {
    reasonCode = 'NO_BASE_MATERIAL'; reason = HELD.NO_BASE_MATERIAL;
  } else {
    reasonCode = 'ALL_MODEL'; reason = HELD.ALL_MODEL;
  }
  held.push({ no: i + 1, offerId: p.offerId, titleCn: p.titleCn, vendor: p.vendor, reasonCode, reason });
}

const out = {
  _meta: {
    sourceDir: SRC,
    sourceKind: '1688 批发平台商品目录（含 _URL.txt 元数据与 主图 / SKU 属性图 / 描述图 三类图）',
    suppliers: [...new Set(inv.products.map((p) => p.vendor))],
    scannedAt: new Date().toISOString(),
    totals: {
      listings: inv.products.length,
      imagesScanned: inv.products.reduce((a, p) => a + p.counts.main + p.counts.sku + p.counts.desc, 0),
      published: products.length,
      held: held.length,
    },
    policy: [
      '只发布经逐张目视核验为「无真人、无中文文字、无第三方品牌水印、无价格标注」的图片。',
      '产品线归属必须有标题明示的基材依据；无依据者扣住，不猜。',
      '品类以已核验图片的实际内容判定；与标题不符者按图片判定并记录待确认。',
      '价格、MOQ、材质等级、镀层规格一律留空 —— 1688 目录未提供可信数据，站点走「Price on request」降级。',
    ],
    method: [
      'scripts/inventory-1688.mjs —— 解析 _URL.txt 与中文标题，抽取品类/材质/风格/主题/色系关键词。',
      'scripts/skin-filter.mjs —— 肤色占比预筛，批量剔除真人佩戴照（骏娅主图 329 张中仅 97 张无真人）。',
      'scripts/candidates-1688.mjs —— 按确定顺序输出候选拼版，人工逐张判定干不干净；产品归属由文件路径保证，不靠肉眼辨认标签。',
    ],
    caveats: [
      '拼版缩略图上的标签读数不可靠：曾据此把一款实为模特照的主图误判为白底影棚图。归属一律以文件路径为准。',
      '骏娅有 3 款主图被中文水印覆盖，去字后不可用，故该款整体扣住。',
    ],
  },
  reasonCodes: HELD,
  products,
  held,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('发布:', products.length, '款 / 扣住:', held.length, '款');
const byCat = {};
for (const p of products) byCat[p.category] = (byCat[p.category] || 0) + 1;
console.log('品类分布:', JSON.stringify(byCat));
console.log('图片合计:', products.reduce((a, p) => a + p.images.length, 0));
const rc = {};
for (const h of held) rc[h.reasonCode] = (rc[h.reasonCode] || 0) + 1;
console.log('扣住原因:', JSON.stringify(rc));
console.log('→', OUT);
