# 产品线 Landing 页优化方案（两个页面）

> 状态：**待确认**（本阶段未改动任何代码）
> 日期：2026-10-09
> 对象：`/product-lines/stainless-titanium-steel/`、`/product-lines/fashion-alloy-brass/`
> 产出来源：项目总监（现状诊断 + 裁决）· 颜好看（设计侧）· 高见远（技术侧）

---

## 0. 两个页面的理解与差异分析

两个页面由**同一模板** `src/pages/product-lines/[line].astro`（179 行）渲染，差异只有两处：内容集合的 markdown 正文、`en.json` 里的 `line.steel.*` / `line.alloy.*` 两套文案。**区块结构、栅格、选品逻辑 100% 相同。**

但底层数据形态差得离谱（全量 1012 款 real 产品实测）：

| 维度 | Stainless & Titanium Steel | Fashion Alloy & Brass |
|---|---|---|
| SKU | **608** | **404** |
| 品类 | bracelet 604 / ring 4（**仅 2 类**） | bracelet 288 / necklace 102 / ring 8 / earrings 6（4 类） |
| 款式族（计数 ≥5） | bangle 604 / cuff 243 / cable 126 → **3 个 Form** | tennis 33 / station 22（Form）+ clover 109 / flower 55 / leaf 28 / heart 24 / initial-letter 8 / cross 7（Motif）→ **8 个** |
| 无款式标签 | 0 | **111** |
| 主图长宽比 | 方图 581 / 竖图 18 / 横图 9 | 方图 390 / 竖图 11 / 横图 3 |
| 规格字段（material/plating/dim/weight/MOQ/price） | 填充率 **0%** | 填充率 **0%** |
| 买家决策逻辑 | 耐久可验证 → **看规格、看测试报告** | 走量 → **看款式广度、看上新速度** |

**核心矛盾**：模板为"6 品类 + 多款式"的丰满形态设计，钢线是"2 品类 + 3 形态"的极瘦形态。所有硬伤几乎都源于此——同一个 `lg:grid-cols-6` 在合金线刚好铺满，在钢线变成"两张窄卡 + 右侧 4 列空白"。

**买家动线差异**：钢线买家要的是"316L/PVD/盐雾报告"这类可验证数字；合金线买家要的是"clover 有多少款、上新多快"。所以差异化的正确做法不是写两套页面代码，而是**让所有差异从数据里长出来**——这也正是方案的主线。

---

## 1. 现状问题诊断

### 1.1 结构性硬伤（P0）

| # | 问题 | 证据 | 后果 |
|---|---|---|---|
| S1 | 品类栅格列数写死 6 | `[line].astro:138` `lg:grid-cols-6` | 钢线 2 个品类 → 桌面端 2 张窄卡 + 4 列空白 |
| S2 | 容器双重 gutter | BaseLayout 未传 `wide` → main 是 `container-page`(1280)，区块内又套 `container-wide`(1440) | 内容比 `/products/` **窄 48px**。⚠️ **裁定：不修**（见 §7 #9）——改 `wide` 会让页脚变 1440 而区块内容区仍是 1280，宽度不一致比双重 gutter 更难看；首页 `container-wide` 是刻意的 brand 宽屏，产品线页走窄一档是产品寄存器的合理选择。双重 gutter 真实代价仅 24×2=48px 内缩，不是 bug |
| S3 | Hero 图与首页不同源（**仅钢线**） | 落地页不调 `heroImageForLine()`，取 `realInLine[0]`（sku 字典序首款）；首页调该函数。实测：首页钢线取到 **SZGSS160**（bracelet，3 图），落地页取到 **GR001**（**ring**，1 图） | 钢线落地页门面是 ring，而 ring 只占该线 **0.7%**；买家从首页点进来发现图换了。**合金线两页恰好同图（都是 GR004）**——因为合金线 404 款全部只有 1 张图，`heroImageForLine` 的两级排序全部平局，靠 `Array.sort` 稳定性 + 入参顺序兜底才落到 GR004 |
| S4 | Hero 裁切 | `ratio="4:5"` + `fit` 默认 `cover`；实拍主图多为方图 | 竖图款被裁掉约 20%，被裁的恰是镯口/链长等买家要看的部位 |
| S5 | rail 名为"最畅销"，实为字典序 | `[line].astro:33` `[...realInLine,...otherInLine].slice(0,6)` | 钢线 = 3 个 ring + 3 个 bracelet；合金线 = **6 条几乎同款的 heart 手链**（GR004–GR011） |
| S6 | 子品类深链丢线维度 | `[line].astro:141` `/products/?category=${cat}` | 钢线点 Bracelet → 看到全站 **892** 条（含合金），而不是本线 **604** 条。`catalog.ts` 早已支持 `?line=`，能力闲置 |
| S7 | 款式族零曝光 | 页面无 style 入口 | 合金线 12 个款式族（8 个过阈值）在落地页完全不可见，深链能力闲置 |
| S8 | 跨线区块名不副实 | `crossRail` 取"其他线各一款" → 只有 2 条线 = 永远 **1 张卡** | 标题却写 "Buyers of this line also source" |

### 1.2 内容诚实性（P0 — 与站点定位直接冲突）

| # | 问题 | 证据 | 后果 |
|---|---|---|---|
| C1 | **内容事实错误** | `en.json` `line.alloy.fact.3`："Style-tag coverage — bangles, cuffs, chains, clover and more" | bangle 604 / cuff 243 是**钢线**的标签，合金线一条都没有。这是把钢线的卖点贴到合金线页上 |
| C2 | "Bestsellers" 无依据 | `line.bestsellers.title` | 全站 0 销量数据，rail 实为字典序 |
| C3 | "New Arrival" 100% 命中 | `ProductCard.astro:35` `dataStatus === 'real'` 即显示角标 | 1012 款全标"新品"，6 张卡 6 个"New"，信号归零 |
| C4 | 统计条无信息量 | `line.stats.*` 三条 i18n 硬编码，两条线**完全相同**，且三条共用 `lucide:ruler` | "Catalogue depth varies by line" 等于没说；真实计数（608/404）明明有 |

### 1.3 转化与 SEO 缺口（P1）

| # | 问题 | 后果 |
|---|---|---|
| T1 | 桌面端无常驻 CTA（8 区块约 4 屏，仅移动端有 `MobileRfqBar`） | 读到工艺长文时已无询价出口 |
| T2 | 无锚点导航 | 长页无法跳转定位 |
| T3 | 无面包屑 | PDP 有、落地页没有，层级断裂 |
| T4 | 无结构化数据 | `/products/` 有 `CollectionPage`，落地页只有默认 `Organization` |
| T5 | 标题/描述无采购语义 | title 仅线名，非 "wholesale" 语境 |

### 1.4 技术债（P1/P2）

| # | 问题 | 位置 |
|---|---|---|
| D1 | POSITION 字典硬编码两条线定位 | `[line].astro:47-56` |
| D2 | `taglineKey` 三元式硬分支 | `[line].astro:25-26` |
| D3 | RFQ 空篮写死合金线 URL | `RfqPanel.astro:32` `/product-lines/fashion-alloy-brass/` |
| D4 | line slug → i18n key 三元式 4 处 | `[sku].astro:49,98`、`catalog.ts:43` 等 |
| D5 | 深链轴名硬编码 | `catalog.ts:210` `['category','line','style']`，与拼 URL 处无编译期关联 → **漂移即静默失效** |
| D6 | `heroImageForLine` 返回类型 ≠ `SkuIndexImage` | 落地页没法直接复用（S3 的技术根因） |
| D7 | 落地页**零回归覆盖** | `scripts/verify-*.mjs` 只测首页/目录/筛选，无一条覆盖 `/product-lines/*` |
| D8 | i18n 死 key | `line.steel.pvd.*` / `.316l.*` / `.corrosion.*` 已无引用（正文改走 markdown） |
| D9 | `queries.ts` 208 行，逼近 300 行门禁 | — |

---

## 2. 优化目标

一句话：**让两个页面从同一份数据里长出各自的形态，把"证据"前置、把"工艺"后置，并把每一处"名不副实"改成"名副其实"。**

四条可验收目标：

1. **零空白列**：任何栅格的列数由条目数决定，不出现 2 张卡配 6 列。
2. **深链闭环**：落地页每一个跳转都带 `?line=`，且跳转后目录页的线筛选真被勾上（机器断言，不靠肉眼）。
3. **款到实处**：Hero / rail / 品类卡的代表图，全部来自"该线主品类 ∩ 主款式族 ∩ 图片最多"，且与首页同一函数、同一结果。
4. **说法与数据对齐**：改掉 3 处名不副实（C1/C2/C3），统计条换成真实计数。

---

## 3. 具体改进项

### 3.1 目标区块顺序（10 区块）

| # | 区块 | 钢线 | 合金线 | 变化 |
|---|---|---|---|---|
| 0 | 面包屑（Hero 内暗面） | ✓ | ✓ | 新增（T3） |
| 1 | Hero（暗面 3fr/2fr，实拍代表图） | 改图为 bangle 手镯 | 改图为 clover 手链 | 修 S3/S4 |
| 2 | At a glance 事实条（数据驱动 3 格） | 608 · 2 types · 3 forms | 404 · 4 types · 8 forms | 重写（C4） |
| 3 | 锚点导航条（lg+ sticky，含 RFQ 按钮） | ✓ | ✓ | 新增（T1/T2） |
| 4 | 定位（一句话 + 三事实，去编号、改分隔栏） | ✓ | ✓（**修 fact.3**） | 修 C1 |
| 5 | 款式族 chips（**新增**） | Form 3 个 | Form 2 + Motif 6 | 修 S7 |
| 6 | 子品类 Shop by type | 横向卡 ×2 | 网格卡 ×4 | 修 S1/S6 |
| 7 | 本线代表款 rail | **4 张**（只存在 4 种形态） | 6 张（6 种母题） | 修 S5/C2/C3 |
| 8 | 中途 CTA band（容器内深色卡） | ✓ | ✓ | 新增 |
| 9 | 材质工艺正文 + 合规链接 | ✓ | ✓ | **后移**到证据与 CTA 之后 |
| 10 | 另一条线（**线卡**） | → 合金 | → 钢 | 修 S8 |

**排序逻辑**：买家动线是"这条线是什么 → 有多少货/什么形态 → 看图 → 询价 → 才需要读工艺"。现状把 4 屏工艺长文放在购货证据之前，等于把评估型内容前置给还没决定要看货的人。

### 3.2 逐区块改进要点

**Hero** — `ratio="1:1"`（从 4:5 改）+ `fit="contain"` + `loading="eager"` + `fetchpriority="high"`；图落在 `bg-surface-warm` 浅色 figure 上，"暗面里嵌一张浅色实拍卡"；主 CTA 改指 `/products/?line=${line}`（现状裸 `/products/` 丢线上下文）；次 CTA 中性描边（`hover:bg-accent-hover` 在暗面是错配）；Hero 内强调色只出现在主按钮 1 处。

**事实条** — 三格全部计算得出，图标语义化改 `package` / `shapes` / `file-check`：
1. `{count} SKUs live on this line`（608 / 404）
2. `{types} product types · {styles} style families`（2·3 / 4·8）
3. `MOQ, plating and pricing confirmed with your quotation`（**不写** "MOQ 12-120 pcs"——那是站点 band，不是本线已确认值）

**款式族 chips** — 分组复用 `FORM_TAGS`/`MOTIF_TAGS`，阈值复用 `STYLE_MIN_COUNT=5`（与 `/products/` 同口径，防"落地页点了 chip → 目录页该 chip 不存在"）；chip `h-11` `rounded-full` 描边，带 `tnum` 计数；深链 `?line=${line}&style=${tag}`（**单轴，不做 category×style 组合**——实测组合零结果率钢线 33%、合金线 60%）；合金线 111 款无标签 → 渲染一行说明脚注（**不做 chip、不做"待补充"负面标签**），钢线 0 款 → 整行不渲染。

**子品类** — 链接补 `?line=`；补数量角标（对齐 `HomeCategories`）；**布局变体**：`n>=4` → 网格卡 `lg:grid-cols-4`，`n<=3` → 横向卡（图 `w-20` 左、文案右、`chevron-right` 右侧、`md:grid-cols-2`）；代表图改"该品类内图片数最多者"，不要 `find()` 首个（等同 sku 序抽样）。

**rail** — 标题改 `Styles on this line right now`；**移除每卡的 New Arrival 角标**，改区块级一行说明 `In-house photography of the actual sample — no catalogue stock images.`（顺带解决 320px 下 146px 卡宽时左上 44px checkbox 与右上角的碰撞）；选品算法见 3.3；**不足 6 张不凑数**；栅格列数按 n 决定。

**跨线** — 改渲染**线卡**：线名 + tagline + 该线 SKU 数 + "View line" CTA，图用 `heroImageForLine()`；复用子品类的横向卡组件；未来第 3 条线出现时自动切 `md:grid-cols-3`。

**CTA band** — 容器内深色卡（**不做满宽出血**，main 自带 gutter 时出血需负 margin hack）；`id="rfq"` 供锚点直达；按钮 `h-12`。

### 3.3 选品算法（确定性，SSG 可复现）

> ⚠️ 本规则经过**全量 1012 款实测迭代**，第一版（按款式族 round-robin + 单族上限 2）被数据推翻：钢线会输出 6 张里 4 个重复 SKU（SZGSS160 带 `[cable,bangle]` 双标签，同属两族，跨族不去重）；合金线 6 张全是 bracelet，而 necklace 占该线 25% 却零曝光。以下为修订版。

**五条规则**（顺序即优先级）：

1. **桶 key = `(category, sorted(style_tags))`，单桶硬上限 1 款** ← 天然跨族去重，消灭重复卡
2. **untagged 桶（无款式标签）强制排最后** ← 合金线 111 款无标签不占前排
3. **品类保底 1 席**（品类按 count desc 轮转）← 小品类不被埋：necklace/ring/earrings 各至少 1 张
4. **剩余席位按桶 count desc 补齐**（tie-break：`category asc → style 签名 asc`）
5. **桶内取：`images.length desc → sku_code asc`**
6. **渲染顺序按桶规模降序**（品类保底只决定"选谁"，不决定排位）—— 否则钢线 ring（占该线 0.7%）会占据第 2 个视觉位，等于把 Hero 刚赶走的失真换个形式请回来。ring 保席位做诚实展示，但**排最后**，由子品类卡的 `count=4` 纠正印象
7. **卡数 = `min(6, 桶数)`，列数 = `max(4, min(6, n))`，`sizes` 同批改**（否则 srcset 选错档）。**rail 永不重复 SKU**：桶少时既不复制也不隐藏 —— 重复图是"一眼可见的凑数"，比只有 4 张难看得多。广度由款式 chips + 子品类卡 + "View all 608 SKUs" 承担，rail 只负责"看真货"

**确定性四条硬规则**（写进文件头注释）：
- 输入必来自 `getProducts()`（已按 sku_code 排序），不重新 sort 输入
- 每处 `.sort()` 比较器**必须**有最终 tie-break 落到 `sku_code` 或字符串
- 禁用 `Math.random` / `Date` / `crypto` / 依赖 Set/Map 迭代顺序取值
- vitest 断言：同输入两次 `deep-equal` + 对账实测数据（608/404/604/109）

**实测产出**（架构师全量跑通，`// 实测预期输出，非配置` —— 这两串会被 Playwright 断言照抄，**不得**当配置硬编码进实现）：

```
钢线 4 张（该线数据层面只有 4 个品类×款式组合，硬凑 6 张必然重复）
  SZKK001S bracelet bangle+cuff(243) / SZTX001 bracelet bangle(239)
  SZGSS160 bracelet bangle+cable(122) / GR001 ring cable(4)

合金线 6 张（4 品类全覆盖，零重复）
  GR190 bracelet clover(56) / GR059 bracelet flower(50) / GR217 necklace clover(45)
  GR299 bracelet tennis(33) / GR291 ring clover(8) / GR305 earrings flower(5)
```

→ necklace 0→1、ring 0→1、earrings 0→1，bracelet 6→3。
**钢线只出 4 张不凑 6**：硬凑的第 5、6 位只能从同桶取第 2 款，视觉上就是"两个几乎一样的手链"，等于把 S5 换个形式留着。"永不复制"写成 lib 硬约束 + vitest 断言 `new Set(picks.map(sku)).size === picks.length`。

**栅格与 sizes**：卡数 `N = min(6, 线内桶数)`；卡宽**封顶 ≈336px**（靠 wrapper `lg:max-w-[42rem/63rem]` 限宽），**不靠减少列数**——`grid-cols-2` 在 1440 下会把卡撑到 688px（1:1 图 = 688px 高），是视觉灾难。`sizes` **分档写精确 px**（`(min-width:1440px)` 断点封顶：4 列 336px / 5 列 266px / 6 列 219px）；用 `23vw` 在 1920 视口会算成 442px 而卡实际只有 336px，浏览器会白下 640 档，6 张卡多约 200KB。

### 3.4 Hero 选图（跨页一致性）

分两层，**第一层是必修，第二层是可选**：

**第一层（必修，P0）** —— 落地页改调用现有 `heroImageForLine()`，**一行改动**，不改算法、不改签名：

- 新增 `heroImageOfLine(products, line): SkuIndexImage | null`（返回 `SkuIndexImage`，解决 D6 类型对不上的根因），`heroImageForLine` 内部委托它，签名/语义不变
- **补第三级 tie-break `sku_code asc`** —— 这是**真 bug 不是优化**：现有排序只有两级（图多 > 标签多），而合金线 404 款全部只有 1 张图 = 404 路平局，今天跑对纯靠 `Array.sort` 稳定性 + 入参顺序
- 结果：钢线落地页门面从 ring(GR001) → 与首页同为 SZGSS160 手链；**合金线不变（GR004），首页零牵动**

**第二层（可选，P1）** —— 排序规则改"代表性优先"：

```
主品类 ∩ 主款式族命中 → images.length desc → style_tags.length desc → sku_code asc
```

- ⚠️ 钢线上**零效果**：`bracelet ∩ bangle = 604 款 = 全线 99.3%`，第一级过滤形同虚设，结果仍是 SZGSS160
- 唯一实际影响：**合金线 hero 从 GR004（heart 族 24 款）换成 GR190（clover 族 109 款）**，且首页合金线卡会跟着变
- **本次裁定：不做第二层**（见 §7 裁定 #1）→ 合金线 hero 保持 GR004；第二层单列后续独立 commit
- "主品类 ∩ 主款式族"必须在**构建期算**，不写字典——写字典等于又一个 `POSITION` 式硬编码

**人工兜底** `LINE_HERO_OVERRIDE: Partial<Record<line, slug>>`（仿 `HomeCategories.astro:18` 的 `CATEGORY_HERO_OVERRIDE` 既有约定），**必须放在 lib**（首页 + 落地页两处消费，放组件会变成两份）。

### 3.5 数据驱动隐藏原则（写进 lib，不写进页面）

1. **区块级**：无可渲染数据 → 整块不渲染，不留空标题、不留 "coming soon" 占位
2. **列数级**：禁写死 `lg:grid-cols-6`，列数由条目数决定（静态映射表，Tailwind 禁动态拼接）
3. **阈值级**：chip 阈值与 `/products/` 同常量 `STYLE_MIN_COUNT=5`（口径统一是**视觉一致性**，不是功能保证——低于阈值的值由 `catalog.ts` 的 ghost checkbox 机制兜底，照样筛得出；真正保证"筛得出东西"的是 URL 必须带 `line=`）
4. **降级级**：未确认字段（0% 填充）**不隐藏、不编造**，统一走"随报价确认"显式说明

### 3.6 硬编码治理

| 项 | 改法 |
|---|---|
| POSITION / tagline / facts | → 内容集合 frontmatter（`tagline` / `position` / `facts: string[1..3]`），顺带修 alloy.fact.3。理由：文案是内容不是配置；编号 i18n key 正是 C1 的温床；顺带消灭 `t(key as ...)` 强转 |
| `RfqPanel.astro:32` | → `/products/`。空篮时我们不知道买家要哪条线，不该替他选合金线；全站目录自带线筛选，把选择权还给买家。**不新增 Props** |
| line slug → i18n key | → `src/lib/products/lines.ts`（`LINE_LABEL_KEY` + `lineLabelKey()` / `lineLabel()`），未登记回落到集合 name，绝不显示错线名 |
| 深链轴名 | → `src/lib/products/deeplink.ts` 导出 `CATALOG_AXES`，`catalog.ts` import 它。**这是唯一能杜绝静默失效的硬防线** |
| 页面零分支 | 禁 `line === 'xxx' ? A : B`，所有差异来自数据计算或 frontmatter |

### 3.7 面包屑层级与锚点偏移（新发现的两个坑）

**面包屑中间层不能写 "Product lines"** —— 全站**不存在** `/product-lines/` 索引页（`src/pages/product-lines/` 下只有 `[line].astro`，无 `index.astro`；Header 的 "Product Lines" 是纯下拉触发器，无 href；`Footer` / `404` 只链具体线）。写上去就是一个 **404 链接**。

**裁定方案 A**：`Home / All products / 线名`，中间层链 `/products/`（存在、有 `CollectionPage` 结构化数据、且与落地页平级语义正确）。理由：① 存在且可点，绝不 404；② 落地页是 `/products/` 的**子集视图**（`?line=` 过滤），层级语义正确；③ 面包屑与 `BreadcrumbList` 的第二层**指向同一个 URL**，UI 与结构化数据天然同源；④ 页脚已有全部产品线入口，不缺发现路径。
（备选 B `Home / 线名` 更短但省略了 `/products/` 这一真实存在的父层；备选 C 新建 `/product-lines/` 索引页属范围外，不做。）

**锚点跳转必须加 `scroll-mt`** —— 页面有 sticky Header(64px) + sticky 锚点条(56px)，锚点目标不带 `scroll-mt` 会被压在两条 sticky 底下。
- 所有锚点 section：`scroll-mt-20 lg:scroll-mt-[7.5rem]`（80px / 120px；锚点条仅 lg+ 出现）
- 钢线品类卡会变横向卡变体 → 该 section 的**高度会变**，`#gallery` / `#materials` 的 scroll-mt 值须在钢线页面实测复核
- ⚠️ sticky 祖先链**不能**有 `overflow-hidden`（`[line].astro` 现状无此问题，但新增 wrapper 时须检查）

### 3.8 SEO

- `CollectionPage`（`numberOfItems` = 线内 real 数）+ `BreadcrumbList`（Home → Products → 线名）
- ⚠️ **BaseLayout 的 `jsonld` 是默认参数，传入即覆盖** → 数组第一项必须显式带 `organizationJsonld()`
- 明确不做：不输出 608 个 `Product` 节点（规格全空 = thin node，且静态产物暴涨）；不输出 `aggregateRating`/`review`
- 面包屑 UI 与 `BreadcrumbList` **共用同一个 items 数组**，杜绝 UI 与结构化数据不一致

---

## 4. 涉及的文件与模块范围

### 新建（15）

| 文件 | 行数 | 职责 |
|---|---|---|
| `src/lib/products/line-aggregation.ts` | ~120 | `buildLineViewModel()`：计数、facet、选品、列数决策 |
| `src/lib/products/deeplink.ts` | ~40 | `CATALOG_AXES` + `catalogUrl()`，深链单一真源 |
| `src/lib/products/lines.ts` | ~30 | `LINE_LABEL_KEY` / `lineLabelKey()` / `lineLabel()` |
| `src/components/layout/Breadcrumb.astro` | ~35 | 面包屑（`tone: default \| inverse`） |
| `src/components/product-line/LineHero.astro` | ~55 | 面包屑 + 暗面 Hero |
| `src/components/product-line/LineStatsBar.astro` | ~30 | 数据驱动事实条（`items: {icon,text}[]`） |
| `src/components/product-line/LineFacts.astro` | ~45 | 一句话 + 三事实分隔栏 |
| `src/components/product-line/LineAnchorNav.astro` | ~40 | lg+ sticky 锚点条（含 ~15 行 IntersectionObserver） |
| `src/components/product-line/LineCategoryGrid.astro` | ~50 | 子品类栅格（列数字面量） |
| `src/components/product-line/LineStyleChips.astro` | ~40 | 款式族 chips + 无标签脚注 |
| `src/components/product-line/LineProductRail.astro` | ~35 | 通用 rail（本线代表款） |
| `src/components/product-line/LineOtherLines.astro` | ~45 | 跨线：**线卡** + SKU 数 + View line |
| `src/components/product-line/LineCtaBand.astro` | ~25 | 中途 CTA |
| `scripts/verify-product-lines.mjs` | ~180 | 落地页回归（12 项） |
| `tests/line-aggregation.test.ts` | ~120 | 选品确定性 + 计数对账 |

外加 `docs/decisions/ADR-00X` 三条（选品算法 / 深链单一真源 / 定位文案走内容集合）。

### 修改（11）

| 文件 | 改动 | 级别 | 牵动其他页面？ |
|---|---|---|---|
| `src/content.config.ts:79-87` | productLines schema +3 字段 | P0 | 否（Header/Footer/404 只读 `data.line`） |
| `src/content/product-lines/*.md` ×2 | 加 frontmatter（**含修 alloy.fact.3**） | P0 | 否 |
| `src/pages/product-lines/[line].astro` | 179 → ~110，纯装配 | P0 | 否 |
| `src/lib/products/queries.ts` | +`heroImageOfLine()`，老函数委托**并补 `sku_code asc` 第三级 tie-break** | P0 | **首页钢线选图不变**（SZGSS160 是唯一 3 图款）；tie-break 只把"靠 sort 稳定性兜底"变成显式保证 |
| `src/styles/global.css` | `@layer utilities` 加 `.scroll-mt-header`（`scroll-margin-top: 6rem`） | P0 | 否（新增工具类） |
| `src/components/product/catalog.ts:210,43` | import `CATALOG_AXES`；`lineLabelKey` | P1 | 仅 /products/ |
| `src/components/product/ProductCard.astro` | 加 `badge?: 'auto' \| 'none'`（默认 auto）+ `sizes?: string`（默认现有值） | P1 | 默认行为不变，零影响；`ctaMode?: 'hover'\|'always'` 为 P2 可选 |
| `src/components/rfq/RfqPanel.astro:32` | → `/products/` | P1 | RFQ 抽屉 + /rfq/ 页 |
| `src/lib/seo/jsonld.ts` | +`collectionPageJsonld()` | P1 | 否 |
| `src/i18n/en.json` | 修 1 条 + 新增约 15 条结构性文案 | P0/P1 | 否 |

### 不动（但需回归）

`HomeLines` / `HomeScenarios` / `HomeHero` / `Header` / `Footer` / `404` / `ProductImage` / `styles.ts` / `BaseLayout` —— 前三者**若采纳 Hero 第二层（代表性优先）**，`heroImageForLine` 结果会变，**必须跑 `verify-home-refactor` + `verify-two-lines`**；只做第一层则首页零牵动。

### i18n 增删清单（`src/i18n/en.json`）

- **删除 5 个死/弃用 key**：`line.bestsellers.title`（改名不实）、`line.stats.skuDepth` / `line.stats.moq` / `line.stats.cadence`（被数据驱动三格取代）、`line.crossLine.title`（跨线改线卡后语义变了）
- **新增 4 个**：`line.styleFamilies.title` / `.subtitle` / `.form` / `.motif`
- **复用已有、不新增**：`home.categories.count`（`{count} styles`）、`filter.style.*` 与 `.help`（35 个 key 现成）、`cta.viewAll` / `cta.browseCatalog` / `cta.startRfq`
- **迁移到 frontmatter**：`line.*.tagline` / `line.*.position` / `line.*.fact.N`
- **rail 标题终版文案**：`Styles on this line` + 副标题 `Six of the {count} styles on this line — in-house photography of the actual sample.`
- ⚠️ `nav.line.*` 保留（Header / Footer / 404 的线名来源，无 line 上下文）

### 深链必带 `line=` 的 5 处（漏一处即静默失效）

1. Hero 主按钮 → `/products/?line={line}`
2. 子品类卡 → `/products/?category={cat}&line={line}`
3. 款式 chip → `/products/?line={line}&style={tag}`
4. rail 尾 "View all" → `/products/?line={line}`
5. CTA band 次按钮 → `/products/?line={line}`

全部经 `catalogUrl()` 构造，禁手写字符串；`catalog.ts` 的 `CATALOG_AXES` 从 `deeplink.ts` import。

### RFQ 按钮链接形态（**改判：用 `?note=` 预填，不用裸 `/rfq/`**）

`rfq-client.ts:29` 的 `applyDeepLink()` 只读 `sku` 与 `note`，**`?line=` 会被静默忽略**（第 31 行 `if (!sku && !note) return`，note 单独存在即生效）。所以线上下文只能走 `?note=`——零代码，复用既有能力。

```
/rfq/?note=Interested%20in%20the%20Stainless%20%26%20Titanium%20Steel%20line%20%E2%80%94%20
```

**六条约束**（预填 = "我们替买家写话"，必须收着用）：

1. **只能是事实陈述，不能有推销味** —— 它落进买家自己的留言框，一旦像营销话术就变成"网站替我说话"，反而减分
2. 文案走 i18n 新增 key `rfq.note.fromLine` = `Interested in the {line} line — `，**线名由 `lineLabel()` 拼装，禁手写**；结尾用 em dash + 空格（邀请买家接着写），**不用句号**（句号会让人以为写完了）
3. 仅在留言框为空时预填（`applyDeepLink` 已是此行为），不覆盖买家已写内容
4. **该页三个"发起询价"入口统一带 note**（Hero 次按钮 / 锚点条按钮 / CTA band 主按钮）——不能出现"从 Hero 进去有上下文、从锚点条进去没有"的割裂
5. 必须 `encodeURIComponent`，`&` → `%26`（线名里有 `&`），漏转会截断参数 = 又造一个静默失效的假深链
6. **机器验证**：Playwright 断言从三个入口进入 `/rfq/` 后 `[name="message"]` 的值为预期文案 —— 这条不写，前面五条迟早被人改坏

买家可删掉这段预填文字，删了就回到裸 `/rfq/` 的状态，没有更差；**可编辑是这个方案的安全阀**。

`RfqPanel` 空篮的"去逛逛"则是 `/products/`（**不带线上下文**）—— 它是全站全局组件，不知道当前在哪条线，要带上下文就得把它从无状态变有状态，为次要 CTA 不划算。两条链接语义本就不同：一个"去找货"，一个"来询价"。

---

## 5. 实施步骤与优先级

### 批次 0 — MOQ 诚实性修复（**独立 commit，排在产品线页之前，但不延后**）

> 这一批与产品线页**同根因**（MOQ / 价格字段 0% 填充），但**不混进产品线页的 commit**——它跨首页 / FAQ / shipping / JSON-LD，回归面不同，混一起出问题不好定位。
> 边界澄清：**独立 commit ≠ 延后**。本次优化范围内必须做完，否则会出现"落地页修好了、点进去还是假筛选器"的中间态。

1. 全站 ~11 处 MOQ 文案：数字保留、动词改掉（统一措辞见 §8）
2. `faq.json` 三条改写（删掉指向不存在筛选器那句）
3. **3 个假控件**：MOQ 筛选组整组隐藏 + `moqAsc` / `priceAsc` 隐藏（剩 1 项则连 select 一起隐藏）
4. `jsonld.ts` Organization 描述改读 `t('meta.description')` 单一真源（**不加 vitest 相等断言**——单一真源后漂移在构造上不可能，断言反而会挡住未来合理的差异化）
5. 回归：`verify-home-refactor` + `verify-style-filter` + 全宽度溢出

### 批次 1 — P0：诚实性 + 结构性硬伤（独立 commit）

1. `content.config.ts` + 两份 md frontmatter（**顺带修 alloy.fact.3**）— 内容纠错先行，最小改动最大收益
2. 容器：`BaseLayout wide` + 删区块内层 `container-wide`（修 S2）
3. `queries.ts` 加 `heroImageOfLine()` + 排序规则改代表性优先（修 S3/S4/D6）
4. `line-aggregation.ts` 聚合层 + `tests/line-aggregation.test.ts`
5. `[line].astro` 拆分组件、装配新顺序（修 S1/S5/S7/S8/C2/C3/C4）
6. `deeplink.ts` + `catalog.ts` 接 `CATALOG_AXES` + 所有链接带 `?line=`（修 S6/D5）
7. 跑 `verify-home-refactor` / `verify-two-lines` / 新增 `verify-product-lines`

### 批次 2 — P1：转化与导航（独立 commit）

8. `StyleChips` 款式族入口
9. `LineAnchorNav` 锚点条 + `LineCtaBand` 中途 CTA
10. `Breadcrumb` 组件 + `CollectionPage` / `BreadcrumbList` JSON-LD
11. `lines.ts` + `RfqPanel` 硬编码治理

### 批次 3 — P2：收尾（可选）

12. PDP 面包屑复用同组件；`products/index` 内联 JSON-LD 函数化
13. `categoryLabel()` helper 收掉 3 处 `as` 强转
14. 清理 i18n 死 key（`line.steel.pvd.*` 等）；`motion-reduce:transform-none`

**排序理由**：内容事实错误（C1）是唯一"对外说错话"的问题，改一行 md 就能修，放最前；结构性硬伤（S1–S8）影响每一屏，紧随；转化与 SEO 属增强，放后面。**每批次一个 commit**，任一环节出问题可单独回滚而不牵连其他。

---

## 6. 预期收益与风险评估

### 预期收益

| 项 | 现状 | 优化后 |
|---|---|---|
| 深链准确性 | 钢线点 Bracelet → 892 条（跨线污染） | 604 条（本线正确） |
| 款式族曝光 | 0 | 合金 8 个 / 钢线 3 个，全部可点可筛 |
| rail 多样性 | 钢 3 ring+3 bracelet；合金 6 条同款 heart（全 bracelet） | 钢 4 张 4 组合；合金 6 张**覆盖 4 品类**（bracelet 6→3，necklace/ring/earrings 0→1） |
| Hero 代表性 | 钢线门面是 0.7% 的 ring，且与首页不同图 | 钢线与首页同为手链 SZGSS160（一层必修即可达成） |
| Hero 排序健壮性 | 两级排序，合金线 404 路平局，靠 sort 稳定性兜底 | 补 `sku_code asc` 第三级 tie-break（**真 bug 修复**） |
| 桌面端空白列 | 钢线 4 列空白 | 0（列数随条目数） |
| 内容可信度 | 3 处名不副实 | 0 |
| SEO | 无结构化数据 | CollectionPage + BreadcrumbList |
| 回归覆盖 | 落地页 0 条 | 11 项断言 |

### 风险与回滚

| # | 风险 | 等级 | 触发信号 | 回滚 |
|---|---|---|---|---|
| R1 | schema 加必填字段 | 中 | 某个 md 忘加 → `astro check` 直接红 | `git revert` |
| R2 | 选品算法 | 中 | rail 又变回同款堆叠 / 露出无图款 | vitest 对账断言（合金单桶 ≤2、钢线覆盖 2 品类）；`git revert` |
| R3 | **深链加 `?line=` 静默失效**（URL 对但 JS 没接住，UI 看不出来） | **高** | 点了卡但线筛选没勾上 | 三层防线：常量单一真源 + vitest 精确字符串断言 + Playwright 扫 href 并断言 checkbox 回填 |
| R4 | Hero 排序规则变更牵动首页 | 中 | 首页线卡图片变了 | `verify-home-refactor` / `verify-two-lines` 截图比对 |
| R5 | 容器改 `wide` 后版心变宽 208px | 低 | 视觉变化 | 四宽度溢出回归 |
| R6 | `queries.ts` 逼近 300 行 | 中 | 超线 | 预留判断点：拆分 `recommend.ts`（牵动面广，**本次不触发**） |

**回滚方式（统一）**：`output: static` + Workers 静态资源，无数据库迁移、无运行时状态、无客户端路由 → 任何改动可**整个 commit 回滚**：`git revert <sha>` → `npm run build` → CI 部署。

### 门禁（按执行顺序）

| 门禁 | 命令 |
|---|---|
| 类型/Props | `npx astro check` |
| 单元 | `npx vitest run`（选品确定性、计数对账、`catalogUrl` 精确字符串、列数映射） |
| emoji | `node scripts/emoji-scan.mjs` |
| 端到端 | `node scripts/verify-product-lines.mjs`（需先 `npm run preview`，**沿用 `domcontentloaded` + `waitForTimeout`，禁 `networkidle`**；每宽度独立 context） |
| 300 行 | `wc -l` 检查所有新增/修改文件 |

`verify-product-lines.mjs` 的 11 项断言：两条线路由可达 / 品类卡数 == 线内品质数且钢线栅格为 2 列 / 品类卡 href 必含 `line=` / 合金 chip ≥8 / 深链闭环（点卡 → checkbox 已 checked → 结果数 604）/ rail 多样性 / Hero 与首页同源 / JSON-LD 含 CollectionPage + BreadcrumbList + **Organization** / 无 emoji / 320·375·768·1440 零溢出 / 触控 ≥44px。

### 不做的事（明确 Out-of-Scope）

- 不新增材质/镀层/MOQ/价格筛选入口（数据填充率 0%，补货后自动出现，零改码）
- 不做 category×style 组合深链（零结果率 33%/60%）
- 不引入满宽出血区块（main 自带 gutter，需负 margin hack）
- 不做滚动揭示/入场动画（动效刻度锁 2）
- 不动 `ProductCard` 默认角标行为（本次只加可选 prop，rail 传 `none`）

---

## 7. 待确认的决策点

### 已由数据定案（无需拍板）

| 项 | 结论 | 依据 |
|---|---|---|
| 款式 chip 阈值 | **沿用 `STYLE_MIN_COUNT = 5`** | 阈值 5 时合金线仍出 8 个族；阈值 3 只多出 chain(4 款) 一个。与 `/products/` facet 同口径，省一个常量、少一个漂移点 |
| 钢线 rail 张数 | **4 张** | 钢线 608 款只有 4 个 (品类,款式签名) 组合（243/239/122/4），凑 6 必然重复 |
| 面包屑 44px | **豁免** | 文字链接，沿用 PDP 现状，行高 ≥32px |
| 锚点条 z-index | **`lg:sticky lg:top-16 z-[150]` 安全** | 全站实测 z 值为 1/2/200(Header)/205/210/300/400/410/500/600，150 是空位且低于 Header；`top-16`(64px) 与 Header `h-16` 严丝合缝。⚠️ sticky 祖先链不能有 `overflow-hidden`，否则立即失效 |

### 门禁补充裁定（44px）

**面包屑豁免 44px 已批准**，但只豁免到这一条，条件照抄设计师的三条边界，写进 Spec：

1. 仅豁免**面包屑**（`<nav><ol>` 内文字链接），其余可点元素一律 ≥44px
2. 豁免后**行高仍需 ≥32px**（非 20px 密排），保证误触间距
3. ⚠️ **不豁免"桌面端鼠标专用元素"** —— 这条从未被申请，也不成立：鼠标用户同样会误触，44px 是点击可靠性的下限，不是触屏专属

### 项目总监裁定（已定，可推翻）

> 用户未在选项问答中作答，以下按"推荐项 + 最小改动"原则由我裁定。**开工前说一声即可推翻任一条。**

| # | 议题 | **裁定** | 依据 |
|---|---|---|---|
| 1 | Hero 修到哪一层 | **只做第一层**：落地页改调现有 `heroImageForLine()` + 补 `sku_code asc` tie-break | 钢线门面从 ring(0.7%) → 手链，与首页同图；合金线不变、**首页零牵动**。第二层（代表性优先）在钢线上零效果，只影响合金线那一张图，收益 < 牵动首页的回归成本。**第二层留作后续独立 commit** |
| 2 | 锚点导航条范围 | **只做 lg+** | 移动端已有 `MobileRfqBar`；再加浮层会与 Header 下拉(z-300) / RFQ 抽屉 / skip-link(z-600) 抢 z 轴。已验证 `z-[150]` + `top-16` 是安全空位 |
| 3 | RFQ 空篮「去逛逛」 | **改指 `/products/`** | 买家空篮时我们不知道他要钢线还是合金线，替他选合金线本身是错的决策；全站目录自带线筛选 = 把选择权还给买家，且改完连 Props 都不用加 |
| 4 | 面包屑中间层 | **`Home / All products / 线名`** | 不存在 `/product-lines/` 索引页，写上去就是 404；且落地页是 `/products/` 的子集视图（`?line=`），层级语义正确，UI 与 `BreadcrumbList` 第二层同源 |
| 5 | 款式 chip 阈值 | **沿用 `STYLE_MIN_COUNT = 5`** | 已由数据定案（见上表） |
| 6 | 钢线 rail 张数 | **4 张，不凑 6** | 已由数据定案（见上表） |
| 7 | 面包屑 44px | **豁免** | 文字链接，沿用 PDP 现状，行高 ≥32px |
| 8 | rail 卡宽 | **封顶 ≈336px（wrapper 限宽），不减列数** | `grid-cols-2` 在 1440 下会把 1:1 卡撑到 688px 高；减列数是错的修法 |
| 9 | 假控件 / MOQ 文案的批次归属 | **独立 commit（批次 0），但属本次范围、不延后** | 与产品线页同根因（MOQ 0% 填充），却跨首页 / FAQ / shipping / JSON-LD，回归面不同 → 不混进产品线页 commit；又不延后，否则出现"落地页修好了、点进去还是假筛选器"的中间态。**独立 commit ≠ 延后** |
| 10 | 12-120 档位本身 | **保留数字**（三处代码证据），待用户最终确认 | 见 §8。这是唯一不能由代码证据闭环的业务事实 |
| 11 | 页面内"发起询价"按钮 | **`/rfq/?note=Interested in the {line} line — `** | `rfq-client.ts:29` 只读 `sku` / `note`，`?line=` 会静默失效；`?note=` 零代码复用既有能力，且买家可删（安全阀）。`RfqPanel` 空篮"去逛逛"则是裸 `/products/`——两者语义不同：一个"来询价"、一个"去找货" |
| 12 | `ProductCard` 的 hover 揭示（Add to RFQ 默认隐藏） | **本次不全局删** | hover 揭示是全站既有交互语言（`/products/` + PDP 已上线），本次只在落地页 rail 传 `ctaMode='always'` 解决探索场景。要全局改单开一次改动 + 回归，不并进本次 |

### 开工前还需要你点头的一件事

**批次划分是否照 §5 执行**（P0 诚实性+结构 → P1 转化+SEO → P2 收尾，每批一个独立 commit）。确认后我即刻派架构师与设计师开工，先跑批次 1。

---

## 8. 附：审计中新发现的**全站级 P0**（比 alloy.fact.3 更严重）

架构师在核对 i18n 时炸出一个不在原诊断清单里的问题：

> **`MOQ 12-120 pcs, stated per style` 出现在全站约 10 处，但 `moq_min` / `moq_max` 字段在 1012 款产品上填充率是 0%。**

位置（已核实）：`meta.description`（站点总描述，进每个页面的 og/twitter）、`trust.1.label`（首页信任条第一项）、`line.stats.moq`（两条产品线页）、`Organization.description`（JSON-LD，全站）、`en.json` 内 `faq.*`（≥2 处）、`home.stats` 区块、`rfq.empty` 周边文案、`compliance` 页、PDP "MOQ 12-120" 相关文案。

**为什么比 alloy.fact.3 严重**：后者只是两条线的事实贴错（影响 2 个页面）；前者是**全站对外的核心承诺**——出现在 `<meta description>` 和 `Organization` 结构化数据里，Google 抓取时会当成公司能力。买家点进来发现**没有一款标了 MOQ**，等于我们自己在首页写了一句无法兑现的话。而本站的全部差异化恰恰建立在"不编造未核实数字"上——这一条是自相矛盾。

**我核了证据链，推翻"A/B 二选一"的提法——这不是二选一，是两件事**：

**① 数字本身站得住。** 三处独立代码证据指向 12-120 是**政策档位**：`content.config.ts` 的 `moq_min: z.number().int().min(12).max(120)`；`MOQ_BANDS = ['12-30','31-60','61-120']` 三档并集恰好 12-120；`RFQ_DEFAULT_QTY = 12` 注释明写"与「MOQ 12-120 pcs per style」这一**已确认口径**的下沿一致"。**12-120 是真的，不需要撤。**

**② 错的是动词。** 把"政策档位"说成了"逐款已标"：`stated per style` / `stated on every product page` / `Product pages show the reference range`。PDP 自己显示的是 `MOQ confirmed per style`——**FAQ 和产品页互相打脸**。

**③ 还有一处比文案更糟：FAQ 指着一个不存在的筛选器。** `faq.json:7` 原话：

> "MOQ is 12-120 pcs per style, **stated on every product page**. **The band filter in the catalog lets you shop by the MOQ band** that fits your order size."

实测：`bands.length === 0`（1012 款 `moq_min` 全空 → `moqBand()` 全返回 null），目录页 MOQ 组只剩一个"MOQ on request"降级档，而 `catalog.ts:76` 的判定是 `bands.has('on_request') ? it.band == null : ...` —— 勾上它等于**选中全部 1012 款**，是个纯 no-op。买家按 FAQ 去点，什么都不会发生。

顺带两个同类：
- **排序 `moqAsc`**：`catalog.ts:78` 在 `moqMin` 全空时退化成 `sku.localeCompare` —— 点了"按 MOQ 升序"，实际得到的是**按 SKU 升序**，静默且无提示
- **排序 `priceAsc`**：同理，价格 0% 填充 → 也是退化成 SKU 序

### 裁定（P0，全部是内容/文案改动，零 UI 重构）

| # | 议题 | **裁定** |
|---|---|---|
| C1 | 12-120 是不是真的 | **保留数字**。它是政策档位，不是造假。改的是动词 |
| C2 | FAQ 那三句 | **全改**。`faq.json` 是内容集合，改内容零代码 |
| C3 | `moqAsc` / `priceAsc` 排序 | **隐藏**，数据驱动：`moqAsc` 仅在 `index.some(it => it.moqMin != null)` 时渲染，`priceAsc` 仅在 `priceLow != null` 时渲染。今天 4 个排序项有 **3 个产出完全相同的顺序**（都退化成 sku 升序），只有 `newest` 不同。**补充规则**：隐藏后若排序只剩 1 个选项，**连排序控件整体隐藏**——别留一个只有一个选项的 select |
| C6 | 假控件是否并入本次 | **并入批次 0（改判）**。原判"单开/延后"被推翻，理由见下 |
| C4 | MOQ 筛选组（**功能空操作**） | **整组隐藏**：组条件去掉 `\|\| hasUnconfirmedMoq`；`on_request` 选项改为 `bands.length > 0 && hasUnconfirmedMoq`。**该选项只在"已确认/未确认"分裂存在时才有意义**，100% 未确认时它选中全集，勾与不勾都是 1012 条。空组买家会忽略，**假筛选器买家会以为自己筛过了**——比空组更伤 |
| C5 | `Organization.description` 与 `meta.description` 双份手写 | **做单一真源**：`organizationJsonld()` 直接取 `t('meta.description')`（构建期执行，零运行时成本），并加 vitest 断言两处相等。现状是 TS 字面量 + 另一处手写字符串，**没有任何机制防漂移**——正是 `alloy.fact.3` 那类漂移的温床。**并入批次 0，不再拆 P2** |

**统一措辞**（全站替换，数字保留、动词改掉）：

```
MOQ 12-120 pcs per style — the exact figure for each style is
confirmed with your quotation. Nothing is published before it is checked.
```

**FAQ 三段改写**：
1. "stated on every product page" → 改为"the figure for each style is confirmed with your quotation"
2. **删掉** "The band filter in the catalog lets you shop by the MOQ band"（那个筛选器今天不存在）
3. "Product pages show the reference range for the style's MOQ band" → "Where a style's tiered pricing is confirmed, the reference range is shown on its page; otherwise your quotation carries the full tier table."

**落点**：`faq.json`(3 条) + `en.json`(约 6 条) + `shipping-payment.md`(1 条) + `jsonld.ts`(P2) —— **全部是内容文件，一个组件都不用动。**

**建议**：拆**批次 0**独立 commit（排在产品线页改动之前）。它只有文案、没有结构改动，风险最低、收益最高（修的是全站对外的核心承诺，且进了 Google 会抓的 meta 与 JSON-LD）。

**唯一需要你确认的一件事**：**12-120 这个档位本身是否成立？**

实测：`moq_min` / `moq_max` 这两个键在 1012 款产品里**一次都没出现过**（0/1012，不是空值，是键不存在）。所以"成立"与否**无法从数据侧验证**，只能由你给业务口径。

- **若成立**（三处代码证据倾向这个）→ 按上表改动词，改完收工
- **若不成立** → 数字一起撤，且连带要动这四处（比改文案大得多）：

| 依赖点 | 位置 | 现状 |
|---|---|---|
| 内容 schema 下沿/上沿 | `content.config.ts` `moq_min: z.number().int().min(12).max(120)` | 约束了可填范围 |
| MOQ 分档 | `shared/format.ts` `MOQ_BANDS = ['12-30','31-60','61-120']` | 三档并集恰为 12-120 |
| RFQ 默认数量 | `shared/format.ts` `RFQ_DEFAULT_QTY = 12` | 注释明写"与已确认口径下沿一致" |
| 全站文案 | `en.json` 约 6 条 + `faq.json` 3 条 + `shipping-payment.md` 1 条 | 见上 |

这点我不能替你定，其余我已全部裁定。
