// scripts/report-1688.mjs — 由 catalog-1688.json 生成人类可读清单（docs/material-intake/INVENTORY-1688.md）
import fs from 'node:fs';
import path from 'node:path';

const c = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/catalog-1688.json'), 'utf8'));
const inv = JSON.parse(fs.readFileSync(path.resolve('docs/material-intake/inventory-1688.json'), 'utf8'));

const esc = (s) => String(s).replace(/\|/g, '\\|');
const L = [];
const p = (s = '') => L.push(s);

p('# 1688 批次素材清单');
p();
p(`> 源目录 \`${c._meta.sourceDir}\`　|　扫描时间 ${c._meta.scannedAt.slice(0, 10)}`);
p(`> 供应商：${c._meta.suppliers.join('、')}`);
p();
p('## 一、总览');
p();
p('| 项 | 数量 |');
p('|----|------|');
p(`| 扫描到的商品链接 | ${c._meta.totals.listings} |`);
p(`| 扫描到的图片 | ${c._meta.totals.imagesScanned} |`);
p(`| **已发布** | **${c._meta.totals.published}** |`);
p(`| **扣住待确认** | **${c._meta.totals.held}** |`);
p();
p('### 口径');
p();
for (const s of c._meta.policy) p(`- ${s}`);
p();
p('### 方法');
p();
for (const s of c._meta.method) p(`- ${s}`);
p();
p('### 已知陷阱');
p();
for (const s of c._meta.caveats) p(`- ${s}`);
p();

p('## 二、已发布款式');
p();
p('| SKU | 英文标题 | 品类 | 产品线 | 风格标签 | 图 | 源链接 |');
p('|----|----------|------|--------|----------|----|--------|');
for (const x of c.products) {
  p(`| ${x.sku} | ${esc(x.title)} | ${x.category} | ${x.line} | ${x.styleTags.join(', ')} | ${x.images.length} | [${x.offerId}](${x.sourceUrl}) |`);
}
p();
p('### 原始中文标题对照');
p();
p('| SKU | 原始中文标题 | 英文标题 |');
p('|----|--------------|----------|');
for (const x of c.products) p(`| ${x.sku} | ${esc(x.titleCn)} | ${esc(x.title)} |`);
p();
p('### 需客户确认的图文差异');
p();
const noted = c.products.filter((x) => x.note);
if (!noted.length) p('（无）');
for (const x of noted) p(`- **${x.sku} ${x.title}** — ${x.note}`);
p();

p('## 三、扣住款式');
p();
const groups = {};
for (const h of c.held) (groups[h.reasonCode] ||= []).push(h);
for (const [code, list] of Object.entries(groups)) {
  p(`### ${code} —— ${list.length} 款`);
  p();
  p(`> ${c.reasonCodes[code]}`);
  p();
  p('| # | offerId | 原始中文标题 | 供应商 |');
  p('|---|---------|--------------|--------|');
  for (const h of list) p(`| ${h.no} | ${h.offerId} | ${esc(h.titleCn)} | ${h.vendor} |`);
  p();
}

p('## 四、字段缺失说明');
p();
p('下列字段在本批次**一律留空**，站点按「Price on request」「Confirmed with your quotation」降级渲染，未做任何推测填充：');
p();
p('| 字段 | 状态 | 原因 |');
p('|------|------|------|');
p('| 价格 / 阶梯价 | 留空 | 1688 目录未提供可信批发价；站内出现过的 USD 单价均为引流价，不可作报价依据 |');
p('| MOQ | 留空 | 目录未标注起订量 |');
p('| 材质等级 | 留空 | 标题仅写「不锈钢 / 钛钢」，未给牌号（如 304 / 316L） |');
p('| 镀层规格 | 留空 | 标题仅写「镀 18K 金」，未给厚度 |');
p('| 尺寸 / 重量 | 留空 | 本批次图片中无可用的尺寸标注图 |');
p();

fs.writeFileSync(path.resolve('docs/material-intake/INVENTORY-1688.md'), L.join('\n'), 'utf8');
console.log('wrote docs/material-intake/INVENTORY-1688.md', L.length, 'lines');
