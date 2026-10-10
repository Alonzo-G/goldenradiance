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
| 目录一致性 | `node scripts/verify-catalog-consistency.mjs` | [1][2][3] 通过（钢线 608 / 合金 404 对账 OK）；og:image 已于本轮补齐后全可达 |
| 单文件 ≤300 行 | `wc -l` | 全部通过（`line-aggregation.ts` 300 → **213**，已拆出 `recommend.ts`） |

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

## 遗留与后续（本轮**已全部处理**）

| # | 原项 | 处理结果 |
|---|---|---|
| 1 | `public/og/` 仅 111 张 → PDP `og:image` 1012 处 404 | ✅ **已修复**。重跑 `node scripts/make-og-images.mjs`（3m0s）补齐 **1012 张** 1200×630 JPEG，`public/og` 由 111 → **1123** 文件（39 MB）。`verify-catalog-consistency.mjs` 的 `[3]` og:image 可达性断言由 1012 fail → **EXIT=0 全部通过** |
| 2 | `line-aggregation.ts` 恰好 300 行（P0 上限） | ✅ **已拆分**。选品算法抽到新文件 `src/lib/products/recommend.ts`（117 行），`line-aggregation.ts` 由 300 → **213 行**。`RAIL_MAX` / `pickRepresentatives` 经 re-export 保持既有导入路径不变；`recommend.ts` 自带最小 `RecommendFacet` 接口以避开与 `line-aggregation` 的循环依赖 |
| 3 | `plating_method` 0% 填充，但多处称 "stated per style" | ✅ **已软化**（决策：同 MOQ，撤不实表述、保留字段）。3 处自述型全改「confirmed with your quotation」：`scenarios.volume.desc`、`markets/middle-east.astro` 的 coating thickness 条目、`blog/pvd-vs-water-plating.md`（此处补「Where a style has no confirmed value yet, the field is filled in with your quotation rather than guessed at」）。`blog/moq-and-tiers.md` 的「a quotation **should** state plating method」属**行业通识建议**（讲供应商该给买家什么），非自述承诺 → **保留** |
| 4 | PDP 面包屑三元拼 key | ✅ **已收口**。可见面包屑与 BreadcrumbList JSON-LD 两处均改 `lineLabel(data.line) \|\| data.line`（`src/lib/products/lines.ts` 单一入口），与此前 Header/Footer/404 的收口方式一致。全站 `nav.line.${` / `'alloy' : 'steel'` 仅剩注释与 `lines.ts` 文档串 |
| 5 | 「12–120」是否真为对外 MOQ 政策档 | ✅ **已定调并撤数字**。核对 `docs/decisions/OPEN-DECISIONS.md` OD-04：MOQ 明文属**客户 P1 未确认数据**，规则「到位前页面禁止出现具体数字，一律走 PRD §6.2 降级写法」。故全站 ~11 处 `MOQ 12-120 pcs` 一律改为「MOQ confirmed per style with your quotation」；首页统计卡第三格 `12–120` → **`Quoted`**（新增 `stats.moq.value` key，与既有 `stats.leadTime` 同构）。`src/`（不含 `src/content/products/`）内 `12-120` / `12–120` **已清零**。`RFQ_DEFAULT_QTY = 12` 保留但已在 `format.ts` 注明**仅为表单默认填充值、非对外政策**。OD-04 本身**保持 OPEN**（客户数据仍未到位） |

### 本轮新增/改动文件一览

- 新增：`src/lib/products/recommend.ts`、`public/og/*.jpg`（+1012）
- 改动：`src/lib/products/line-aggregation.ts`、`src/pages/products/[sku].astro`、`src/i18n/en.json`、`src/components/home/HomeStats.astro`、`src/lib/shared/format.ts`、`src/components/product-line/LineStatsBar.astro`、`src/content/pages/faq.json`、`src/content/pages/shipping-payment.md`、`src/pages/markets/europe-uk.astro`、`src/pages/markets/middle-east.astro`、`src/content/blog/pvd-vs-water-plating.md`
- 决策登记：`docs/decisions/OPEN-DECISIONS.md`（追加 OD-04 MOQ 子项进展）

### 复跑门禁（本轮）

```
astro check      107 files  → 0 error / 0 warning / 4 hint
vitest run       7 files    → 83 passed
emoji-scan       108 files  → 含 emoji 0
npm run build    1032 pages + pagefind OK
verify-catalog-consistency  → EXIT=0（含 og:image 全可达）
verify-product-lines        → 41/41 PASS
```

### 仍开着的项（非本轮范围）

- **OD-04 未关闭**：MOQ 实际档位、交期、付款方式等 9 项客户 P1 数据仍未到位 → 页面继续走降级文案。
- **OD-03 未关闭**：Logo/Slogan 仍为字标占位。
- `public/og` 的 1012 张新图为 git 追踪资产，本批提交将使仓库体积 +39 MB —— 若后续走 Cloudflare 构建，属可接受；若担心仓体，可改由构建期生成（需把 `make-og-images.mjs` 挂进 `npm run build` 前置）。**当前决策：入库**（CI 构建更快、og 图内容稳定，且 111→1123 的 gap 本身就是漏跑脚本的证据）。

---

## 回滚

`output: static` + Workers 静态资源：无数据库迁移、无运行时状态、无客户端路由。整批回滚 = `git revert 1fbc659 3197a95 77ef795 1c0ec16 b3d81b0` → `npm run build` → CI 重新部署。
