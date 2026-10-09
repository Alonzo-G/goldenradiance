# 交付说明：产品列表页款式二级筛选

> 日期：2026-10-09　｜　提交：`13879b6`（功能）+ `970f64f`（连带修复）　｜　CI run #28 success
> 线上：https://goldenradiance.aoxiliexuhuihui.workers.dev/products/

---

## 一句话

892 个手链此前只能靠无限滚动翻找，现在可以按「结构形态（bangle / open cuff / cable / tennis / multi-station）+ 图案母题（四叶草 / floral / leaf / heart / cross / initial letter）」筛，筛选结果可分享 URL。

---

## 做了什么

| 层 | 文件 | 变更 |
|---|---|---|
| 数据 | `src/lib/products/queries.ts` | `SkuIndexItem` 加 `styles: string[]` |
| 数据 | `src/lib/products/styles.ts`（新） | slug → i18n 登记 + Form/Motif 分组 + 阈值常量 |
| 视图 | `src/components/product/FilterStyleGroups.astro`（新） | 款式 facet 组渲染 |
| 逻辑 | `src/components/product/catalog.ts` | OR 过滤 + 深链 + ghost checkbox |
| 拆分 | `src/components/product/catalog-views.ts`（新） | 视图渲染拆出，保持单文件 ≤300 行 |
| 文案 | `src/i18n/en.json` | 15 个款式标签 + 品类定义 |
| 测试 | `scripts/verify-style-filter.mjs`（新） | 34 项断言 |

---

## 关键决策

### 1. 为什么是「款式」而不是「材质」

B2B 采购商买手链的第一刀通常切材质，但**材质字段填充率是 0%**（`base_material_grade` 一个都没填），切不出来。款式标签填充率 89%，且是欧美买手的通用检索语言——"我要麻绳的"、"我要四叶草的"。这是数据能支撑的唯一选择。

### 2. 为什么要分 Form / Motif 两组

款式标签天然分两层：**结构形态**（bangle 圆实镯 / cuff 开口镯 / cable 麻绳 / tennis 排钻）和**图案母题**（clover 四叶草 / leaf 叶 / heart 心）。两组在数据上正交——四叶草既可能是手镯也可能是开口镯。平铺 13 项买家无法归类，分组把这个认知工作前置到 UI。

Form 命中约 99% 手链（必答题，默认展开）；Motif 仅约 23%（选答题，默认折叠）。

### 3. 阈值为什么是 5

低于 5 款的款式不渲染选项。理由不是"长尾不重要"，而是**一个筛选器的可信度由最小值决定**——买家点到只出 1 个结果的选项，会怀疑计数坏了。阈值写成常量而非硬编码：某个款式补货到过线时，选项自动出现，不需要改代码。

被砍掉的：`chain`(4) / `hoop`(1) / `zodiac`(1) / `number`(1)。保留 `cross`(7)：十字架是欧美批发商的明确品类（复活节/圣诞季）。

### 4. 一句话解决 cuff / bangle 歧义

数据里 243 款同时带 `cuff` 和 `bangle` 两个标签。买家看到这两个并列选项会不知道该点哪个，所以 Style 组下方常驻一句话：

> Bangle is a closed ring; a cuff is open-ended and slips on without a clasp.

这 8 个词是本次改动里性价比最高的一句文案。

---

## 我对设计方案的修正（重要）

设计师的方案里写「未知值靠 `styles.has()` 自然返回 0 结果」——**这条不成立**。

现有过滤链路是：`initFromUrl()` 回填 checkbox → `activeFilters()` 读 DOM → `apply()` 过滤。URL 里的值如果找不到对应 checkbox，就等于这个参数被**静默忽略**——买家以为筛过了，实际看到的是全量 1012 个。同理，设计师要求的「低于阈值的 `?style=zodiac` 仍要出结果」用现有机制也实现不了。

**解法：ghost checkbox。** URL 里没有对应可见 checkbox 的值时，动态创建一个隐藏的 checked checkbox 塞进 form。之后过滤、chip 显示、chip 移除、Clear all 全部复用现成逻辑，零特例分支。

实测：`?style=zodiac` → 1 款（不是 1012 全量），chip 显示 "Zodiac sign ×" 可移除。

---

## 验证证据

| 项 | 结果 |
|---|---|
| `astro check` | 0 error |
| `npm run build` | 通过，pagefind 索引 1032 页 |
| `vitest` | 57 / 57 |
| emoji 门禁 | 0 命中 |
| `verify-style-filter.mjs` | **34 / 34** |
| `verify-header-nav.mjs` | 全部通过 |
| `verify-filters-sticky.mjs` | PASS |
| `verify-home-refactor.mjs` | ALL PASS |
| `verify-two-lines.mjs` | PASS |
| `verify-brand-assets.mjs` | PASS |
| 注入体积 | gzip **+73 字节**（无需字典编码） |

最强的一条断言：单独勾 `cuff` 恰好命中 243 款（数据里 cuff 全部与 bangle 共现，是 `["cuff","bangle"]`）——如果 OR 语义被误写成 AND，这里会是 0。

**连带修复**：跑全量回归时发现首页在 320px（iPhone SE）横向溢出 23px。这是今天 header 优化（`84469b0`）的遗留——当时只测了 1024/1280/1366/1924 四档桌面 + 375px，漏了 320。已修（<360px 隐藏字标只留 logo glyph），`970f64f`。

---

## 已知边界（运营需知悉）

1. **款式 × 品类组合中 59% 会是 0 结果**。例如 Earrings + Bangle 必然为空（耳环没有 bangle）。这是静态 facet 的固有代价——与现有 4 组 facet 行为一致，换来的是计数稳定不跳动（动态收窄会导致"选了 Necklaces 后 tennis 突然消失"这种抖动）。买家看到空结果时可以用 chips 逐项移除。

2. **111 款产品没有款式标签**，选中任一款式后它们会被排除。这是诚实过滤——不假装它们属于任何款式类。

3. **ghost checkbox 在 Clear all 后残留在 DOM**（`checked=false`，不影响过滤）。若未来要做筛选状态 localStorage 持久化，需先清理这些节点。

4. **`hoop` 已登记但当前不可见**（earrings 仅 1 款，低于阈值）。补货到 5 款后会自动出现在 Form 组。

---

## 后续建议

- **筛选态 URL 加 `noindex`**：款式 × 品类组合会产生大量低价值 URL，建议加 `<meta name="robots" content="noindex,follow">`。同样适用于现有的 `category` / `line` 深链。
- **侧栏 Collapse all**：加款式组后侧栏约 1004px，1366×768 可视高度 672px，靠 `overflow-y-auto` 兜底。建议给买家一键收起的能力，但按钮语义（只折叠 Motif 却放在顶部）需要在设计时再想清楚。
- **材质 facet**：等业务侧补齐 `base_material_grade` 后，`present()` 逻辑会自动把材质组显示出来，零代码。