// scripts/inventory-1688.mjs — 清点 1688 批次素材
// 遍历两个供应商目录下的 *_images 文件夹，读取 _URL.txt 取元数据，
// 并从中文商品标题里抽取品类/材质/风格/主题/色系关键词。
// 输出: docs/material-intake/inventory-1688.json
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'D:\\AAAAAAA外贸资料\\饰品\\产品(1)';
const OUT = path.resolve('docs/material-intake/inventory-1688.json');

// ---- 中文关键词 → 受控词表 ----
const CATEGORY_RULES = [
  [/耳(环|钉|坠|饰|圈|夹)/, 'earrings'],
  [/项链|锁骨链|颈链|吊坠|毛衣链/, 'necklace'],
  [/手镯|手筒|镯子/, 'cuff'],
  [/手链|手环|手饰/, 'bracelet'],
  [/戒指|戒托|对戒/, 'ring'],
  [/胸针/, 'brooch'],
  [/发(饰|夹|卡)/, 'hair-accessory'],
  [/脚链/, 'anklet'],
];

const MATERIAL_RULES = [
  [/s925银针|925银/, '925-silver-post'],
  [/钛钢/, 'titanium-steel'],
  [/不锈钢/, 'stainless-steel'],
  [/合金/, 'alloy'],
  [/铜/, 'brass'],
  [/亚克力/, 'acrylic'],
  [/锆石|锆|钻|满钻|密镶/, 'cubic-zirconia'],
  [/珍珠/, 'pearl'],
  [/贝母|白贝|贝壳/, 'shell'],
  [/彩宝|彩钻|琉璃|玻璃/, 'colored-stone'],
  [/陶瓷/, 'ceramic'],
  [/木质|木/, 'wood'],
  [/布艺/, 'fabric'],
];

const PLATING_RULES = [
  [/18k金|镀18k|镀金/, '18k-gold-tone'],
  [/玫瑰金/, 'rose-gold'],
  [/银色|白钢/, 'silver-tone'],
];

const STYLE_RULES = [
  [/复古/, 'vintage'],
  [/轻奢|高级感|气质/, 'light-luxury'],
  [/波西米亚|民族风|苗族|苗银|古风|国风|国潮/, 'bohemian'],
  [/港风/, 'hong-kong-chic'],
  [/韩系|日韩/, 'korean'],
  [/甜酷|甜美/, 'sweet'],
  [/朋克|哥特|夸张/, 'punk'],
  [/圣诞/, 'christmas'],
  [/万圣节|搞怪|恐怖/, 'halloween'],
  [/欧美/, 'western'],
  [/冷淡风|极简|简约/, 'minimal'],
  [/美拉德/, 'maillard'],
  [/小众|ins风|设计师款|设计感|个性|独特/, 'niche-designer'],
  [/百搭/, 'everyday'],
  [/网红|爆款|热销|热卖/, 'trending'],
];

const THEME_RULES = [
  [/鱼尾流苏|流苏/, 'tassel'],
  [/蝴蝶/, 'butterfly'],
  [/四叶草|幸运草|四叶花/, 'four-leaf-clover'],
  [/骷髅|骨架/, 'skull'],
  [/圣诞老人|麋鹿|铃铛|雪花|拐杖糖|圣诞帽/, 'christmas-motifs'],
  [/竹节/, 'bamboo'],
  [/水滴|泪滴|梨形/, 'teardrop'],
  [/豹纹/, 'leopard'],
  [/爱心/, 'heart'],
  [/浪花|海浪/, 'wave'],
  [/几何|方块|方形|方糖|菱形|多边形/, 'geometric'],
  [/花朵|花|叶|树叶|牡丹|玫瑰/, 'botanical'],
  [/数字|圆牌|罗马/, 'numeral-coin'],
  [/蛇骨/, 'snake-chain'],
  [/树叶/, 'leaf'],
  [/金条|金砖|招财/, 'gold-bar'],
  [/相思豆|贝壳/, 'shell'],
  [/珍珠/, 'pearl'],
  [/锆石|钻/, 'zircon'],
  [/不规则|液态/, 'liquid-abstract'],
  [/套装|两戴/, 'convertible-set'],
  [/流苏/, 'tassel'],
];

const COLOR_RULES = [
  [/蓝/, 'blue'], [/紫/, 'purple'], [/粉/, 'pink'], [/红/, 'red'],
  [/黑/, 'black'], [/白/, 'white'], [/金/, 'gold'], [/银/, 'silver'],
  [/玫瑰金/, 'rose-gold'], [/棕|咖啡/, 'brown'], [/绿/, 'green'],
  [/彩|彩色|多色/, 'multicolour'], [/透明|白贝/, 'white'],
];

const apply = (rules, text) => rules.filter(([re]) => re.test(text)).map(([, v]) => v);

function parseUrlTxt(file) {
  if (!fs.existsSync(file)) return {};
  const raw = fs.readFileSync(file, 'utf8');
  const pick = (label) => {
    const m = new RegExp(label + ':\\s*\\n([^\\n]*)').exec(raw);
    return m ? m[1].trim() : '';
  };
  return {
    shop: pick('店铺名称'),
    title: pick('商品标题'),
    productUrl: pick('商品链接'),
  };
}

const rows = [];
for (const vendor of fs.readdirSync(SRC)) {
  const vdir = path.join(SRC, vendor);
  if (!fs.statSync(vdir).isDirectory()) continue;
  for (const folder of fs.readdirSync(vdir)) {
    if (!folder.endsWith('_images')) continue;
    const fdir = path.join(vdir, folder);
    const meta = parseUrlTxt(path.join(fdir, '_URL.txt'));
    const title = meta.title || folder.replace(/_images$/, '');
    const offerId = (folder.match(/_(\d+)_images$/) || [, ''])[1];
    const countOf = (sub) => {
      const d = path.join(fdir, sub);
      if (!fs.existsSync(d)) return 0;
      return fs.readdirSync(d).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f)).length;
    };
    rows.push({
      vendor,
      folder,
      offerId,
      titleCn: title,
      shop: meta.shop,
      productUrl: meta.productUrl,
      counts: { main: countOf('主图'), sku: countOf('SKU 属性图'), desc: countOf('描述图') },
      inferred: {
        category: apply(CATEGORY_RULES, title),
        material: apply(MATERIAL_RULES, title),
        plating: apply(PLATING_RULES, title),
        style: apply(STYLE_RULES, title),
        theme: apply(THEME_RULES, title),
        color: apply(COLOR_RULES, title),
      },
    });
  }
}

rows.sort((a, b) => (a.vendor + a.folder).localeCompare(b.vendor + b.folder));

fs.writeFileSync(OUT, JSON.stringify({ sourceDir: SRC, generatedAt: new Date().toISOString(), count: rows.length, products: rows }, null, 2), 'utf8');

console.log('products:', rows.length);
const tally = (key) => rows.reduce((a, r) => { for (const v of r.inferred[key]) a[v] = (a[v] || 0) + 1; return a; }, {});
for (const k of ['category', 'material', 'style', 'theme', 'color']) {
  console.log('\n[' + k + ']', JSON.stringify(tally(k), null, 0));
}
const noCat = rows.filter((r) => !r.inferred.category.length);
console.log('\n品类未识别:', noCat.length, noCat.map((r) => r.folder.slice(0, 30)));
const imgTotal = rows.reduce((a, r) => a + r.counts.main + r.counts.sku + r.counts.desc, 0);
console.log('\n图片合计:', imgTotal, JSON.stringify(rows.reduce((a, r) => { a.main += r.counts.main; a.sku += r.counts.sku; a.desc += r.counts.desc; return a; }, { main: 0, sku: 0, desc: 0 })));
