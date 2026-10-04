// scripts/report-1688-sku.mjs —— 由 catalog-1688-sku.json 生成人类可读清单
// 输出：docs/material-intake/INVENTORY-1688.md
// 取代 scripts/report-1688.mjs（链接级口径）——后者保留仅作历史归档，勿再用于产出。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

const c = read('docs/material-intake/catalog-1688-sku.json');
const inv = read('docs/material-intake/inventory-1688.json');
const byOffer = new Map(inv.products.map((p) => [String(p.offerId), p]));

const esc = (s) => String(s).replace(/\|/g, '\\|');
const L = [];
const p = (s = '') => L.push(s);

const REASON = {
  NO_BASE_MATERIAL: '标题未声明基材（不锈钢 / 钛钢 / 合金），无法判定产品线归属，按不编造原则扣住。',
  TEXT: '图上叠加供应商中文水印（「东莞市骏娅饰品有限公司」），去字后不可用。',
  THIRD_PARTY_BRAND: '图上带第三方品牌水印并叠加引流单价，挂到 Rayan Accessories 名下涉商标与价格风险。',
};

p('# 1688 批次素材清单');
p();
p(`> 源目录 \`${c._meta.sourceDir}\`　|　生成时间 ${c._meta.generatedAt.slice(0, 10)}　|　**产品粒度 = SKU（颜色变体）**`);
p(`> 供应商：东莞市骏娅饰品有限公司、义乌市空屿饰品有限公司`);
p();
p('> 本文由 `scripts/report-1688-sku.mjs` 从 `catalog-1688-sku.json` 生成，**请勿手改**。');
p();

p('## 一、总览');
p();
p('| 项 | 数量 |');
p('|----|------|');
p(`| 扫描到的商品链接 | ${c._meta.totals.listings} |`);
p(`| **已发布产品** | **${c._meta.totals.products}**（SKU 级 ${c._meta.totals.skuLevel} + 款式级 ${c._meta.totals.styleLevel}） |`);
p(`| 发布图片 | ${c._meta.totals.images} |`);
p(`| 扣住候选 | ${c.held.length} |`);
p(`| 已读出的尺寸/克重实测数据 | ${c._meta.diagramData.length}（源链接整体未发布，数据仅作内部留档） |`);
p();
p('### 粒度口径（关键）');
p();
p('产品粒度取 **SKU（颜色变体）**，不取商品链接。同一链接下的每个颜色变体独立成一条产品，');
p('SKU 编码 `RA-{品类码}-{链接号}{变体号}` 可回溯到 1688 offerId；款式族以 `styleFamily` 记录，不作为产品层。');
p('链接下无可用 SKU 图时，降级为一条**款式级**条目并在 §五 标出。');
p();
p('### 筛选口径');
p();
for (const s of c._meta.policy) p(`- ${s.replace(/\*\*/g, '**')}`);
p();
p('### 方法');
p();
p('- `scripts/inventory-1688.mjs` —— 解析 `_URL.txt` 与中文标题，抽取品类 / 材质 / 风格 / 主题 / 色系关键词');
p('- `scripts/skin-filter.mjs` —— **肤色占比**批量剔除真人佩戴照（RGB 肤色区间 + 色相 5°–52° + 饱和度 <0.62）');
p('- `scripts/candidates-1688.mjs` —— 按确定顺序输出候选拼版，人工只判定「干不干净」');
p('- `scripts/build-catalog-sku.mjs` —— 候选判定 → SKU 级台账，含基材英译闸门 `baseEn()`');
p('- `scripts/ingest-1688-sku.mjs` —— 出 WebP + 写 `src/content/products/*.md`，并撤回被取代的链接级产品');
p();
p('### 已知陷阱');
p();
p('- **拼版缩略图上的标签读数不可靠**。曾据此把一款实为模特照的主图判成白底影棚图，肤色检测推翻了该判断。产品归属一律以**文件路径**为准，不靠肉眼辨认拼版标签；拼版只用于判断干不干净。');
p('- 中文基材必须经 `baseEn()` 转英文后才允许入文案。曾因直接把「不锈钢」写进 `short_description` 造成 34 页汉字外泄，闸门即为此设：映射缺失则整条不外发。');
p('- 撤回链接级产品时不能只按 slug 判归属（款式级回退会复用旧 slug），须按批次清单判定，否则留下无主图片目录。');
p();

p('## 二、已发布产品');
p();
p('| SKU | 英文标题 | 品类 | 产品线 | 粒度 | 图 | 源链接 |');
p('|----|----------|------|--------|------|----|--------|');
for (const x of [...c.products].sort((a, b) => a.sku.localeCompare(b.sku))) {
  p(`| ${x.sku} | ${esc(x.title)} | ${x.category} | ${x.line} | ${x.granularity === 'sku' ? 'SKU' : '款式'} | ${x.images.length} | [${x.offerId}](https://detail.1688.com/offer/${x.offerId}.html) |`);
}
p();
p(`分布：品类 ${Object.entries(c._meta.byCategory).map(([k, v]) => `${k} ${v}`).join(' / ')}；产品线 ${Object.entries(c._meta.byLine).map(([k, v]) => `${k} ${v}`).join(' / ')}。`);
p();

p('### 原始中文标题对照');
p();
p('| SKU | 原始中文标题 | 英文标题 |');
p('|----|--------------|----------|');
for (const x of [...c.products].sort((a, b) => a.sku.localeCompare(b.sku))) p(`| ${x.sku} | ${esc(x.titleCn ?? '')} | ${esc(x.title)} |`);
p();

p('## 三、扣住候选');
p();
const groups = {};
for (const h of c.held) (groups[h.reasonCode] ||= []).push(h);
for (const [code, list] of Object.entries(groups).sort((a, b) => b[1].length - a[1].length)) {
  p(`### ${code} —— ${list.length} 格`);
  p();
  p(`> ${REASON[code] ?? code}`);
  p();
  p('| 位号 | offerId | 供应商 | 源图 |');
  p('|------|---------|--------|------|');
  for (const h of list) {
    const meta = byOffer.get(String(h.offerId));
    p(`| ${h.pos} | [${h.offerId}](https://detail.1688.com/offer/${h.offerId}.html) | ${meta?.vendor ?? '-'} | ${esc(h.img)} |`);
  }
  p();
}

p('## 四、已读出的尺寸 / 克重实测');
p();
p('来源为供应商 SKU 属性图上的**英文尺寸标注图**（保留原图，不作为商品图发布）。');
p('所属链接（空屿 listing 39）因标题未声明基材整条扣住，故这些数据**未挂到任何已发布产品上**，仅作内部留档。');
p();
p('| 位号 | 品类 | 克重 | 尺寸 | 原始数据串 |');
p('|------|------|------|------|------------|');
for (const d of c._meta.diagramData) p(`| ${d.pos} | ${d.category} | ${d.weight_g ?? '-'} g/pair | ${esc(d.dimensions_raw ?? '-')} | \`${esc(d.dataRaw)}\` |`);
p();

p('## 五、待客户确认');
p();
p('### 5.1 同款式同色变体差异');
p();
const variants = c.products.filter((x) => /同款式同色/.test(x.note ?? ''));
if (!variants.length) p('（无）');
for (const x of variants) p(`- **${x.sku} ${x.title}** —— ${x.note}`);
p();
p('### 5.2 链接无可用 SKU 图，降级为款式级条目');
p();
const styles = c.products.filter((x) => x.granularity === 'style-level');
for (const x of styles) p(`- **${x.sku} ${x.title}** —— ${x.note}`);
p();
p('### 5.3 未决事项');
p();
p('- **空屿整批 47 格扣住**：该供应商 3 个链接的标题均未声明基材，无法判定产品线。若客户确认基材（如均为不锈钢 / 合金），可批量解锁。');
p('- **S925 银分类缺口**：清单中 listing 51 / 52 标题写明「S925 银针」，但现有三条产品线（合金 / 天然石珍珠 / 不锈钢钛钢）均不覆盖 S925 银，`lineFor()` 返回 null 并记 `LINE_TAXONOMY_GAP`，需客户裁决归属。');
p('- **第三方品牌水印**：空屿 listing 41 等图片带 MILanTing / LALIAN components 水印并叠加 USD 引流单价，涉商标风险，不随基材确认一并解锁。');
p();

p('## 六、字段缺失说明');
p();
p('下列字段在本批次**一律留空**，站点按「Price on request」「Confirmed with your quotation」降级渲染，未做任何推测填充：');
p();
p('| 字段 | 状态 | 原因 |');
p('|------|------|------|');
p('| 价格 / 阶梯价 | 留空 | 1688 目录未提供可信批发价；站内出现过的 USD 单价均为引流价，不可作报价依据 |');
p('| MOQ | 留空 | 目录未标注起订量 |');
p('| 材质等级 | 留空 | 标题仅写「不锈钢 / 钛钢」，未给牌号（如 304 / 316L） |');
p('| 镀层规格 | 留空 | 标题仅写「镀 18K 金」，未给厚度 |');
p('| 尺寸 / 重量 | 留空 | 已发布产品所对应的链接未含可用尺寸标注图（见 §四） |');
p();

fs.writeFileSync(path.join(ROOT, 'docs/material-intake/INVENTORY-1688.md'), L.join('\n'), 'utf8');
console.log('wrote docs/material-intake/INVENTORY-1688.md', L.length, 'lines');
