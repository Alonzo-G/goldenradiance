# 交付说明：两条产品线 Landing 页重构

> 日期：2026-10-10　｜　提交：`b3d81b0` `1c0ec16` `77ef795` `3197a95` `1fbc659`　｜　CI run #37967744098 success
> 线上：https://goldenradiance.fun/product-lines/stainless-titanium-steel/ ・ /product-lines/fashion-alloy-brass/
> 依据：`docs/plan-product-lines-2026-10-09.md`

---

## 一句话

两个产品线落地页从「按线名走 i18n 编号 key 的模板」改成「一份数据 → 各自长出形态」：钢线点品类不再串到全站 892 条、门面不再是占该线 0.7% 的 ring、rail 不再清一色手链。

---

## 做了什么（Batch 1 主体 + 收尾）

| 层 | 文件 | 变更 |
|---|---|---|
| 页面 | `src/pages/product-lines/[line].astro` | 274 → 149 行；职责压缩为「取数 → 建 ViewModel → 传 Props」，零 `line === 'xxx'` 分支 |
| 组件 | `src/components/product-line/*`（新，9 个） | Hero / StatsBar / AnchorNav / Facts / StyleChips / CategoryGrid / ProductRail / CtaBand / OtherLines |
| 聚合 | `src/lib/products/line-aggregation.ts`（新） | 品类/款式 facet、选品算法、栅格·限宽·sizes 静态映射表 |
| 深链 | `src/lib/products/deeplink.ts`（新） | `CATALOG_AXES` 轴名单一真源 + `catalogUrl()` |
| 线标签 | `src/lib/products/lines.ts`（新） | line slug ↔ i18n key 单一入口 + RFQ `?note=` 预填 |
| 面包屑 | `src/components/layout/Breadcrumb.astro`（新） | UI 与 BreadcrumbList 共用同一数组 |
| 卡片 | `src/components/product/ProductCard.astro` | 新增可选 props `sizes` / `badge` / `ctaMode`（默认行为不变） |
| 逻辑 | `src/components/product/catalog.ts` | line 文案走 `lineLabel()`；`initFromUrl()` 遍历 `CATALOG_AXES` |
| 逻辑 | `src/components/rfq/RfqPanel.astro` | 空篮硬编码线 → `/products/` |
| 文案 | `src/i18n/en.json` | 删除按线编号旧 key（`line.steel.*` / `line.alloy.*` / `line.stats.*`），换与线无关的新 key |
| 测试 | `tests/line-aggregation.test.ts`（新） | 26 项（跑真实全量数据） |
| 测试 | `scripts/verify-product-lines.mjs`（新） | 41 项端到端断言 |
| 工具 | `scripts/emoji-scan.mjs` | 手写清单 → 递归扫描整个 `src/`（排除 `src/content/`） |

---

## 关键决策

### 1. 事实先于版面：文案迁入内容集合 frontmatter

旧实现按线名走 i18n 编号 key（`line.steel.fact.1`…）。这没有类型把「文案」与「正确的线」绑在一起——把钢线的 bangle/cuff 卖点贴到合金线页，编译器不会拦。改为每条线的 `position` / `facts` 存进 `src/content/product-lines/*.md`，`astro check` 直接校验形状。

### 2. 选品算法：桶去重 + 品类保底但不决定排位

第一版「按款式族 round-robin + 单族上限 2」被全量实测推翻：钢线 6 张里 4 个重复 SKU（`SZGSS160` 同时带 `[cable,bangle]` 跨族不去重）；合金线 6 张全 bracelet，necklace（占该线 25%）零曝光。

修订版桶 key = `(品类, 排序款式签名)`，**单桶硬上限 1**：天然跨族去重。无标签桶排末尾。品类保底 1 席只解决「小品类零曝光」，**不决定排位**——否则钢线 ring（0.7%）会重占第二视觉位，等于把 Hero 刚赶走的失真换个形式请回来。

### 3. 深链加 `?line=`：为什么这是必修而不是优化

钢线点 Bracelet 过去只带 `?category=bracelet` → 看到全站 892 条（含合金），不是本线 604 条。`catalog.ts` 早就支持 `?line=`，能力一直闲置。风险在于「URL 看着对、点了不筛选」的**静默失效**：三层防线——轴名单一真源（`deeplink.ts`）+ vitest 精确字符串断言 + Playwright 点卡后断言 checkbox 回填且结果数 == 604。

### 4. Hero 选图第三级 tie-break 是修 bug

`representativeEntry()` 原只有两级排序（图多 > 款式标签多）。合金线 404 款全部 1 张图 → 两级全线平局，跑对纯靠 `Array.sort` 稳定性 + 入参顺序。补 `sku_code asc` 第三级。**顺带**：落地页过去拿不到这个类型，只能 `realInLine[0].data.images[0]`（sku 字典序首款），于是钢线门面变成 ring，而首页拿的是手链——同一条线两个页面两张图。现两处共用 `heroImageOfLine()`。

---

## 门禁输出（全绿）

| 门禁 | 命令 | 结果 |
|---|---|---|
| 类型 | `npx astro check` | 0 error / 0 warning / 4 hint |
| 单元 | `npx vitest run` | 83 passed（含 26 项聚合层） |
| emoji | `node scripts/emoji-scan.mjs` | 107 文件，含 emoji 0 |
| 构建 | `npm run build` | 1032 页 + pagefind 索引 OK |
| 端到端（本批次） | `node scripts/verify-product-lines.mjs` | **41 / 41** |
| 首页回归 | `node scripts/verify-home-refactor.mjs` | ALL PASS |
| 两条线回归 | `node scripts/verify-two-lines.mjs` | PASS |
| 款式筛选回归 | `node scripts/verify-style-filter.mjs` | 34 / 34 |
| 筛选侧栏 sticky | `node scripts/verify-filters-sticky.mjs` | PASS |
| 目录一致性 | `node scripts/verify-catalog-consistency.mjs` | [1][2][3] 通过（钢线 608 / 合金 404 对账 OK）；og:image 见「遗留」 |
| 单文件 ≤300 行 | `wc -l` | 全部通过（`line-aggregation.ts` 恰好 300，见「遗留」） |

### 实测值 vs 计划预期（逐位一致）

| 项 | 预期 | 实测 |
|---|---|---|
| 钢线 SKU / 品类 | 608；bracelet 604 · ring 4 | ✅ 一致 |
| 钢线 rail | 4 张：SZKK001S · SZTX001 · SZGSS160 · GR001 | ✅ 一致 |
| 合金线 SKU / 品类 | 404；bracelet 288 · necklace 102 · ring 8 · earrings 6 | ✅ 一致 |
| 合金线 rail | 6 张：GR190 · GR059 · GR217 · GR299 · GR291 · GR305 | ✅ 一致 |
| 深链闭环 | 点钢线 Bracelet 卡 → 结果 604 | ✅ 604 |
| Hero 同源 | 钢线 Hero 图 == 首页线卡图 | ✅ 同为 `/products/szgss160/01.webp` |
| 溢出 | 320/375/768/1440 全 0 | ✅ 全 0 |

---

## 遗留与后续（本次未动）

| # | 项 | 性质 | 建议 |
|---|---|---|---|
| 1 | `public/og/` 仅 **111** 张，但 PDP 指向 `/og/{slug}.jpg` → **901 款 og:image 在生产环境 404** | **既有缺陷，非本次引入**（`public/og` 无未提交改动，随首次提交入库） | 重跑 `node scripts/make-og-images.mjs` 补齐 1012 张后重新部署 |
| 2 | `line-aggregation.ts` 恰好 **300 行**（P0 上限） | 边界脆弱：再加一行注释即越线 | 预置拆分点：选品段抽 `recommend.ts`（牵动面广，本次按计划未触发） |
| 3 | `plating_method` 填充率 **0%**，但约 6 处文案称 "plating method stated per style" | 与已修的 MOQ 表述同族的名不副实 | 待你决策：同 MOQ 处理（保留数字、改措辞）还是先下架该表述 |
| 4 | PDP 面包屑仍用 `t(\`nav.line.${data.line==='fashion-alloy-brass'?'alloy':'steel'}\`)` 三元拼 key | 债务（功能正确） | 复用 `lines.ts` 的 `lineLabel()` |
| 5 | 「12–120」是否真为对外 MOQ 政策档 | 口径确认 | 建议确认后写进内容集合，避免散落文案 |

---

## 回滚

`output: static` + Workers 静态资源：无数据库迁移、无运行时状态、无客户端路由。整批回滚 = `git revert 1fbc659 3197a95 77ef795 1c0ec16 b3d81b0` → `npm run build` → CI 重新部署。
