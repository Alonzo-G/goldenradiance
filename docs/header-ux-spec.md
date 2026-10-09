# Header UX 修复规范（增量优化）

> 范围：`src/components/layout/Header.astro` 桌面端导航 + 搜索入口 + active 态。
> 移动端仅做确认，不改设计。
> 本文档只出规范，不含代码改动；由前端落地。
>
> **状态：前端已并行落地一版（2026-10-09）。§G 为对该已落地版本的复核，含 3 个待修项。**
> §A–§F 为原始规范，结论保留；行号已按落地后文件重新校准。
>
> 依据文件（均已实读）：
> - `src/components/layout/Header.astro`（原始 180 行 => 落地后 240 行）
> - `src/components/layout/Wordmark.astro`
> - `src/components/layout/UtilityBar.astro`
> - `src/styles/global.css`（`@theme` Token + `.container-page` + 断点）
> - `src/i18n/en.json` L8–L31（`nav` 段）
> - `src/components/search/SearchDialog.astro`（搜索入口的真实落点）
> - `src/components/layout/Footer.astro` L17–L46（页脚已有全量入口）
> - `docs/UIUX.md` L925–L927（Header 设计稿基线：h=64px，6 项导航）

---

## 0. 诊断结论（含量化证据）

用户截图的三处硬伤，根因是**同一个**：桌面 nav 的固有宽度总和超过了容器可用宽度，flex 收缩把文字压成两行。

按 `global.css` L132–L148，`.container-page` 在 ≥1024px 时 `max-width:1280px` + `padding-inline:24px`，故内容区可用宽度 = **1232px**（1024视口时为 976px）。

按现有类名实测累加（`text-sm`=14px，`px-3`=24px/项，`gap-1`=4px，`size-5` 图标=20px，`size-4` chevron=16px）：

| 元素 | 估算宽度 |
|---|---|
| Wordmark（`sm:size-9` 36px 字标 + `gap-2` + `text-lg` 文字） | ~200px |
| Product Lines（含 16px chevron + 4px gap） | ~135px |
| All products | ~108px |
| Compliance | ~94px |
| Sourcing | ~80px |
| Blog | ~52px |
| Contact | ~73px |
| nav 合计（含 5 个 `gap-1`） | **~562px** |
| 搜索按钮（20px icon + 8px gap + 47字符占位文案 ~329px + 24px padding） | **~381px** |
| RFQ 按钮（icon + "RFQ" + 徽标） | ~105px |
| 容器 `gap-4` × 2 + `ml-auto` 侧gap | ~40px |
| **总计** | **~1288px** |

结论：
- 在 **1280px** 视口下溢出约 **56px** => 这正是截图里 header 被撑到 ~88px、`h-16` 失效的原因（`Header.astro` L53 的 `h-16` 只是容器高度，flex 子项换行会溢出而非撑高容器，但 nav 链接 `h-11` 内部换行 2 行后总高 88px，观感上就是 header 变高）。
- 在 **1024px** 视口下溢出约 **312px** => 因此把断点从 `lg:flex`（1024）改到 `xl:flex`（1280）**只能推迟问题、不能根治**：1280px 视口仍溢出 56px，而 1440px 视口因 `max-width:1280px` 封顶，可用宽度依然是 1232px，**溢出量完全相同**。截图在 1280 容器下已复现，正是这个原因。

**所以：只改断点 = 修不好。必须同时减 nav 项数 + 收窄搜索入口。** 这是本次规范的核心判断。

---

## A. 信息架构决策（IA）

### 决策：桌面一级 nav 从 6 项砍到 **4 项**

**保留 4 项**（按B2B 采购决策链排序）：

1. `Product Lines`（下拉，两条线）
2. `All products`
3. `Compliance`
4. `Contact`

**移出一级导航（3 项）**：

| 移出项 | 去向 | 理由 |
|---|---|---|
| `Sourcing` | 页脚 `footer.col.company`（Footer.astro L40 **已存在**） | 信任状，不是采购动作。买家在"我认不认识这家供应商"阶段看它，不在"我要找货"阶段。占一级导航位挤掉真实采购入口，不值。 |
| `Blog` | 页脚 `footer.col.company`（Footer.astro L41 **已存在**） | 对采购决策是**最弱**的一项。采购商搜的是 SKU 号和材质（`en.json` L467 `searchHint` 原文："Or search the catalog by SKU code — e.g. SZTX268"），不是读博客。博客是获客/SEO 资产，不是导航资产。 |
| `Samples` | 保持现状（当前桌面 nav 本来就没有） | 见下方「为什么不把 Samples 提上来」。 |

**明确取舍说明（不模棱两可）**：
- `Compliance` **保留一级**，因为它是 B2B 珠宝出口的**准入条件**而非信任装饰：欧盟/英国买家 import 925 饰品必须看 nickel release（EN 1811），站点已有专门页面 `pages/compliance/nickel-release-en-1811.astro`。且 `UtilityBar.astro` L30–L45 已经提供 "Compliance for [market]" 选择器 —— nav 里的 `Compliance` 与 utility bar 的市场选择器形成"选市场 => 看该市场合规"闭环，是真实高频动线，不是凑数。
- `Sourcing` 与 `Compliance` **不合并**。两者受众不同：Compliance 是买家自己的准入义务，Sourcing 是供应商资质。合并成 "Trust" 之类抽象词会丢掉可搜索性（`/compliance/` 与 `/sourcing-partners/` 是两个已有 URL，改名会伤 SEO 与既有外链）。分开处理：Compliance 留一级，Sourcing 降页脚。

**为什么不把 `Samples` 提到一级 nav？**
`Samples`（`/samples/`）在采购链上优先级很高，但它当前**不在**桌面 nav（只在移动端 `groups` L35 和页脚 L33）。提它上来需要新增一个一级项，而 §0 已证明宽度预算只剩约 165px 余量（方案二）。加"Samples"（约 80px）后余量降到 88px —— 能放下，但没有容错余量，且会让一级 nav 变成 5 项、破坏"导航项 ≤5 且每项都是采购动作"的克制原则。
**结论：本次不动Samples 的位置。** 它的转化入口已由 PDP 购买面板下方的信任出口承担（`UIUX.md` L912 明确："`/compliance/` 与 `/samples/` 是 PDP 购买面板下方的两个信任出口"）。保持设计一致性，不在本次增量优化里扩大改动面。

**净收益**：nav 从 562px => 约 380px，释放约 180px。这不是"砍内容"，是把一级导航还原成"买家动作"而非"站点地图"。

---

## B. 搜索入口形态决策

### 决策：**改为纯图标按钮（44×44）+ `/` 快捷键提示，移除 header 内的占位文案**

不选另外两个方案，理由如下：

- **不选「保留输入框 + 压到 ≤20 字符」**：算过账——20 字符占位约 140px，搜索按钮总宽约 190px，加回 4 项 nav（380px）后总计约 1099px。1024 视口（可用 976px）**仍溢出 123px**。也就是说这个方案在 1024–1279px 区间依然是坏的，而这段区间在 B2B 场景（采购商用 1366×768 笔记本）非常常见。要救回来还得再砍 nav 或再改断点，代价更大、收益更小。
- **不选「hover/focus 展开」**：B2B 采购的核心动作是**直接搜 SKU 号**（`en.json` L467 明确 "search the catalog by SKU code"）。hover 展开是一种"浏览式"交互，逼迫鼠标悬停、对键盘用户不友好（需 focus 才展开，但 focus 展开又会导致布局抖动 shift）。采购商要的是"敲一下就跳到能输入的地方"。

### 为什么图标按钮对 SKU 搜索体验**更好**，而不是更差

关键事实：`Header.astro` L82 的按钮带 `data-search-open`，而 `SearchDialog.astro` L66 监听它——**点击后打开的是一个真正的搜索弹窗**（L19–L25：`type="search"` 输入框，`h-14`，`w-full`，自动 `input?.focus()` L57）。

也就是说：
- header 里的按钮**从来不是一个输入框**，它是一个 **trigger**。一个 trigger 伪装成输入框（长占位文案 + 边框），本身就是一个**语义谎言**——用户会以为能直接在那里打字。
- SKU 精确匹配逻辑在 `SearchDialog.astro` L88 `exactMatch(index, query)`，且构建期已内联完整 SKU 索引（L36 `data-sku-index`），**SKU 直达能力完全在弹窗里**，不依赖 header 显示什么文案。

所以把长占位文案从 trigger 上拿掉，**不损失任何 SKU 可发现性**，反而消除了"长得像输入框却不能输入"的误导。文案不删——**下移**到弹窗里（那里它才是正确的位置）。

### 落地要求

1. header 按钮：纯 `lucide:search` 图标，`size-11`（44×44），保留 `data-search-open`。
2. **可访问名称不能丢**：加 `aria-label={t('nav.search')}`（`en.json` L20 = "Search"）。禁止只留图标无标签。
3. 视觉发现性：按钮右侧加一个 `/` 键帽提示（`<kbd>`），仅在 `xl:` 及以上显示（宽度充裕时才放）。用 `border-border` + `text-meta`... **注意：`--color-meta` 对比度 3.89:1，未达 WCAG AA 正文 4.5:1**（见 §0 校验），因此kbd 提示文字**必须用 `text-muted`**（6.00:1 PASS），不用 `text-meta`。
4. **弹窗内的占位文案同步收短**：`SearchDialog.astro` L22 复用 `t('nav.searchPlaceholder')`（47 字符）。在 `max-w-xl`（576px）弹窗里 47 字符会挤占输入区且易被截断。建议 `i18n/en.json` 新增一个弹窗专用 key（如 `nav.searchPlaceholderOverlay`，≤24 字符，例如 `"SKU, material, style"`），并把 `SZTX268` 示例移入弹窗内的 helper 文本（保留真实业务语义，不违反占位文案禁令）。
5. `/` 快捷键：在 `SearchDialog.astro` 现有 `document.addEventListener('keydown', ...)`（L70）里加一条 —— 目标元素不是 `input`/`textarea`/`select` 且未按修饰键时，`e.key === '/'` 则 `e.preventDefault(); open();`。**必须做输入框排除判断**，否则用户在其他页面的输入框里打 `/` 会被劫持。

---

## C. 精确到类名的样式规范

### C1. 防换行（根因修复，最高优先级）

`whitespace-nowrap` 必须加在**所有导航链接与 trigger 文字**上。缺任何一处都会复发。

| 位置 | 现状（Header.astro） | 加类 |
|---|---|---|
| L60 `<summary>` | `flex h-11 cursor-pointer list-none items-center gap-1 rounded-sm px-3 text-sm font-medium text-fg hover:bg-surface-sunken` | 追加 `whitespace-nowrap shrink-0` |
| L72–L76 `<a>` × 5 | `flex h-11 items-center rounded-sm px-3 text-sm font-medium text-fg hover:bg-surface-sunken` | 追加 `whitespace-nowrap shrink-0` |
| L86 搜索占位 `<span>` | `hidden md:inline` | **整段删除**（改图标按钮，见 §B） |
| L53 容器 | `container-page flex h-16 items-center gap-2 lg:gap-4` | 追加 `min-w-0`（允许 flex 子项在收缩时不被 min-content 顶开） |

`shrink-0` 与 `whitespace-nowrap` **必须成对**：`whitespace-nowrap` 阻止换行，`shrink-0` 阻止 flex 压缩元素宽度。只有前者，元素仍会被压到比文字更窄而溢出；只有后者，容器宽度不足时直接横向溢出。

### C2. 高度锁死 h-16

- 容器保持 `h-16`（=64px，与 `UIUX.md` L925 设计稿基线一致）。
- nav 链接保持 `h-11`（=44px），**不要改成 h-full**，否则 `h-11` 的 44px 触控目标语义丢失。
- 额外给 nav 容器加 `shrink-0`：`Header.astro` L58 `hidden items-center gap-1 lg:flex` => `hidden shrink-0 items-center gap-1 lg:flex`。
- **不要**给 header 加 `overflow-hidden`：会裁掉 L64 的下拉面板（`absolute top-full`，需溢出父级才能显示）。
- 若前端担心极端窄视口，兜底用 `min-h-16` 而非 `h-16`——但正常情况下 `h-16` 足够，因为 §0 已算出方案二在 1024px 有 165px 余量。

### C3. active 态

**判定逻辑**（写在 frontmatter，复用 `Astro.url.pathname`）：

```js
const path = Astro.url.pathname;
const isActive = (href: string) => href === '/' ? path === '/' : path.startsWith(href);
```

`startsWith` 而非 `===`：站点是目录式 URL（`products/index.astro` => `/products/`，`products/[sku].astro` => `/products/<sku>/`），用 `===` 会导致在 PDP 页时"All products"不高亮。`/product-lines/<line>/` 同理。

| nav 项 | href | 何时 active |
|---|---|---|
| Product Lines（下拉） | `/product-lines/<id>/` | `path.startsWith('/product-lines/')` |
| All products | `/products/` | `path.startsWith('/products')` |
| Compliance | `/compliance/` | `path.startsWith('/compliance')` |
| Contact | `/contact/` | `path === '/contact/'` |

**视觉表现（严格按此，不要自创）**：
- active：文字 `text-fg` + 底部 **2px `accent-metal` 描边** + `aria-current="page"`。
- inactive：文字 `text-fg`（保持现状，**不要**降级成 `text-muted`——`docs/UIUX.md` L211 规定 active 态才用 accent，且当前全站 nav 文字为 `text-fg`，降级会造成不必要的视觉噪音）。
- **禁止**背景色块（`bg-surface-sunken`）作为 active 表达——B2B 站要克制，底色块与 `hover:bg-surface-sunken` 撞车，hover 时无法分辨。

实现方式（用伪元素，避免 `border-b` 撑高元素导致 `h-11` 变形）：

```html
<!-- active -->
<a aria-current="page"
   class="relative flex h-11 shrink-0 items-center whitespace-nowrap rounded-sm px-3 text-sm font-medium text-fg after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-pill after:bg-accent-metal hover:bg-surface-sunken">
```

- `after:h-0.5` = 2px（Tailwind 4 `h-0.5` = `0.125rem` = 2px）。已用 `global.css` L65–L68 的 radius 体系核过：`after:h-0.5` 不改变元素盒模型高度（伪元素不影响布局流），`h-11` 与 44px 触控目标不受破坏。
- `after:bottom-0` + `after:inset-x-3`：描边宽度与文字对齐（跟随 `px-3` 内缩），不贴到 `rounded-sm` 圆角边缘。
- `after:rounded-pill`（=9999px，`global.css` L68）让 2px 细线两端为半圆，与站点 radius 体系一致。
- 颜色只用 `after:bg-accent-metal`（`#7d6330`）。**不要** `after:bg-accent`（`#123a38` 墨玉绿）——`accent-metal` 是黄铜色，与 RFQ 主 CTA 同色，语义上是"你在这里"，且对白底 5.68:1 通过 WCAG 1.4.11 非文本对比度要求。
- 下拉 `<summary>` 的 active 态用同一套 `after:` 伪元素类，逻辑同 `isActive('/product-lines/')`。
- 移动端 `groups` 里若也要 active，同一函数复用。

### C4. 断点：保持 `lg:flex`（1024px），**不要**改成 `xl:flex`

**明确结论：不改断点。**

理由（基于 §0 与方案二实测）：改为 `xl:flex` 是**错误处方**。
- 1440px 及以上视口，`.container-page` 被 `max-width:1280px` 封顶，可用宽度恒为 1232px。现状在 1232px 就已溢出 56px —— 所以 `xl:flex` 在宽屏上**依然会换行**，问题原封不动。
- `xl:flex` 的唯一实际效果是「1024–1279px 改用汉堡菜单」。但 §0 实测方案二在 1024px 有 **165px 余量**，1024px 视口本来就装得下，没必要剥夺这一段区间的桌面导航。
- 采购商常用 1366×768 笔记本（可用 1318px，但受 `max-width:1280px` 封顶为 1232px）——这段区间用 `xl:flex` 恰好躲过，但 1280–1366 之间又是临界，而 1920 宽屏必然溢出。`xl:flex` 修的是一个不存在的窄区间，放着真实缺陷不管。

**保持 `lg:flex` + `lg:hidden`**，靠 §C1（nowrap + shrink-0）+ §C5（减项 + 收窄搜索）把总宽压到 1024px 可容纳。这是唯一覆盖全宽度区间的解法。

### C5. 宽度策略

| 元素 | 规范 |
|---|---|
| 容器 `.container-page` | 不动（`max-width:1280px` + `padding-inline:24px` @1024） |
| Wordmark `<a>` L54 | 已有 `shrink-0`，**保留**。不要加 `w-` 固定宽度 |
| nav L58 | 加 `shrink-0`，**不要**加 `w-` 或 `max-w-` |
| nav 链接 L60/L72–76 | 加 `shrink-0 whitespace-nowrap`，**不要**加 `w-` |
| 搜索按钮 L80 | 改 `size-11 shrink-0`（44×44 固定方形）。**不要**给 `w-`/`max-w-`/`flex-1` |
| 搜索按钮内 `<span>` L86/L87 | L86 删除；L87 `sr-only md:hidden` 改为常驻 `sr-only`（配合 `aria-label` 二选一，不要同时留两个无名来源） |
| 右侧动作组 L79 | `ml-auto flex items-center gap-2` 保留；追加 `shrink-0` |

**不要给 nav 加 `flex-1`**：`ml-auto`（L79）已承担"贴右对齐"职责，再加 `flex-1` 会让 nav 抢走搜索按钮的空间，把问题从"文字换行"换成"图标被挤"。

### C6. 触控目标（硬性，不得破坏）

- 现有 `h-11`（=44px）已满足 WCAG 2.5.5 / Apple HIG 44×44。**保持 `h-11` 不变。**
- 搜索按钮从 `h-11`（高）× auto（宽）改 `size-11` —— 宽高都变成 44px，触控面积不降反升。
- 图标尺寸：继续用 `size-5`（20px，按钮内图标规范）。`lucide:chevron-down` 保持 `size-4`（16px，行内小图标规范）。**图标库锁定 `lucide:*`（astro-icon），禁止引入其他库或 emoji。**
- 移动端汉堡按钮 L106 `size-11` 不动；`mobile-nav` 链接 L125 `min-h-11` 不动。

### C7. 颜色与 Token 引用（禁止硬编码）

active / hover 涉及的全部颜色，只能用 `global.css` L4–L37 已定义的 token：

| 用途 | Token | 值 |
|---|---|---|
| nav 文字 | `text-fg` | `#14181c` |
| active 描边 | `after:bg-accent-metal` | `#7d6330` |
| hover 底色 | `hover:bg-surface-sunken` | `#f0f2f3` |
| 容器底/边框 | `bg-surface` / `border-border` | `#ffffff` / `#e3e6ea` |
| RFQ 按钮 | `bg-accent-metal` + `hover:bg-accent-metal-hover` + `text-metal-on` | 保持现状不动 |

**禁用 `text-meta`（`#79828e`）承载任何正文/导航文字** —— 实测对比度 3.89:1，未达 WCAG AA 4.5:1。`text-muted`（`#5b6470`，6.00:1）才是合格的最浅文字色。（唯一例外纯装饰性图形，但导航文字不是装饰。）

### C8. 圆角 / 字号 / 字体（保持不动，避免回归）

`rounded-sm`（4px，链接）· `rounded-md`（6px，下拉面板 L64）· `text-sm`（0.875rem，nav L45）· `font-medium` · 字体 `Public Sans`（`--font-sans`，前台英文站**不加载 CJK 字体**，`global.css` L40 注释）。这些都符合 `docs/UIUX.md` 体系，**本次不动**。

### C9. 无障碍（必须同步做）

- `:focus-visible` 已有全局实现（`global.css` L120–L123，`box-shadow: var(--focus-ring)` = `rgb(125 99 48 / 0.4)` 黄铜色 3px 环）。**不要**用 `outline: none` 覆盖它，也不要给 nav 链接加自定义 `focus:ring` 造成双重焦点环。
- active 链接必须带 `aria-current="page"`（`AdminLayout.astro` L100 已有同款先例，风格一致）。
- 纯图标搜索按钮必须有无障碍名称：`aria-label={t('nav.search')}`。
- `prefers-reduced-motion` 已有全局归零（`global.css` L161–L171）。L62 的 `group-open:rotate-180` 与 `transition-transform` 会被自动归零，**无需**额外处理，也不要为此加 `motion-safe:` 前缀。

---

## D. 移动端确认（<1024px）

**结论：移动端整体没问题，不需要改设计。** 已确认的正面项：

| 检查项 | 现状 | 结论 |
|---|---|---|
| 触控目标 | `mobile-nav` 链接 `min-h-11`（L125）、汉堡 `size-11`（L106）、关闭按钮 `size-11`（SearchDialog L26） | 全部 ≥44px，PASS |
| 分组结构 | `groups` 四组（产品线 / Catalog / Support / Company，L19–L49），带 `size-4` lucide 图标 + `caps` 微标签 | 清晰，且**比桌面 nav 更完整**（含 Samples / Shipping & payment / FAQ） |
| 断点一致性 | `mobile-nav` 用 `lg:hidden`，与桌面 `lg:flex` 严格互斥 | 无重叠、无空窗，PASS |
| 图标 | 全部 `lucide:*` + `.icon` 类（`global.css` L112 统一 `stroke-width:1.5`） | 无 emoji、无混用库，PASS |
| 下滑关闭手势 | L156–L170 `touchmove` 阈值 60px，`{passive:true}` | 符合移动端习惯，不阻塞滚动 |
| 无障碍 | 链接为原生 `<a>`；汉堡有 `aria-expanded` / `aria-controls`（L104–105）+ `sr-only` 文案 | PASS |

**仅有的 3 个小问题（属实现细节，不构成设计返工）**：

1. **移动端缺少 active 态**（`Header.astro` L116–L133）。当前所有链接样式完全一致（`text-fg` + `hover:bg-surface-sunken`），买家在 `/faq/` 页面打开菜单时看不出自己在哪。建议：复用 §C3 的 `isActive()`，active 项加 `aria-current="page"` + `text-fg` + `bg-surface-sunken`（移动端在折叠面板里没有 hover 态，用**静态底色**是合理的，且不违反 §C3 "桌面禁背景块"的约束——桌面有 hover 底色会撞车，移动端没有）。
2. **汉堡按钮缺 `aria-label`**：L109 只有视觉隐藏的 `sr-only` 文本（L109 `{t('nav.openMenu')}`），实际这个是有的 —— 更正：**此项无问题**，L109 已有 `sr-only` "Open menu"。真正的点是：**菜单展开后按钮图标不变**（始终 `lucide:menu`），没有 `lucide:x` 切换，建议加 `group-open` 态换图标或至少让 `aria-expanded`（已有）承担语义。
3. **菜单打开时缺 Escape 关闭 / 焦点管理**：L143 `setMenu` 未监听 `keydown:Escape`，也未在打开后把焦点移入菜单。键盘用户开菜单后无法用 Escape 退出。建议补：`Escape` 关闭 + 关闭时 `toggle?.focus()`（SearchDialog 已有这个范式，见 L61 `lastTrigger?.focus()`，照抄即可）。

以上 3 点均为**加分项**，不阻塞本次 header 修复落地。

---

## E. 落地清单（给前端，按顺序执行）

1. frontmatter 增加 `isActive()`（§C3），用 `Astro.url.pathname`。
2. 删除 L86 占位 `<span>`，搜索按钮改 `size-11 shrink-0` + `aria-label={t('nav.search')}`（§B、§C5）。
3. L87 `sr-only md:hidden` 改常驻 `sr-only`（或由 `aria-label` 取代，二选一）。
4. nav 容器 L58 加 `shrink-0`；L60 `summary` 与 L72–76 各 `<a>` 加 `whitespace-nowrap shrink-0`（§C1）。
5. 删除桌面 `Sourcing`、`Blog` 两个 `<a>`（L74、L75）；`Compliance`、`Contact` 保留并加 active 态（§A）。**页脚已有这两个入口，不要动Footer.astro。**
6. active 链接加 `aria-current="page"` + `after:` 伪元素（§C3）。
7. 容器 L53 加 `min-w-0`（§C1）。
8. **断点保持 `lg:flex` 不变**（§C4）。
9. `i18n/en.json` 新增弹窗专用占位 key；`SearchDialog.astro` L22 改用新 key；补 `/` 快捷键（排除输入框）（§B）。
10. 验收：在 **1024 / 1280 / 1366 / 1440 / 1920** 五个宽度下，nav 必须全部单行、header实测高度 = 64px、搜索按钮 = 44×44。

---

## F. 验收标准（可自测）

- [ ] 五档视口宽度（1024/1280/1366/1440/1920）下，6 个 nav 链接与下拉 summary **全部单行**，无一处换行
- [ ] header 实测高度恒为 **64px**（浏览器 devtools 量 `header` 盒高）
- [ ] 每个导航文字的 `getBoundingClientRect().height` ≤ 44px（单行证明）
- [ ] 搜索按钮 `getBoundingClientRect()` = 44×44
- [ ] 所有 active 链接 `document.activeElement` 无关时仍可见 2px `accent-metal` 底部描边，且带 `aria-current="page"`
- [ ] Tab 键遍历 nav，每个链接有可见焦点环（`--focus-ring` 黄铜 3px），无焦点丢失
- [ ] 图标全部来自 `lucide:*`，站内零 emoji
- [ ] 无任何硬编码色值，全部走 `text-fg` / `accent-metal` / `surface-sunken` / `border-border`
- [ ] 移动端（375px）菜单分组与 44px 触控目标未受影响

---

## G. 对已落地版本的复核（2026-10-09，重要）

前端在本人出规范期间**并行落地了一版改动**（`git diff`：`Header.astro` +100行、`SearchDialog.astro` +9 行）。该版本**正确解决了三处硬伤的主体**，但有 3 个待修项。

### G1. 已正确落地的部分（确认通过）

| 项 | 落地位置 | 复核结论 |
|---|---|---|
| 防折行 | `Header.astro` L98 `whitespace-nowrap`、L115–119 `navLinkClass()` 含 `whitespace-nowrap shrink-0` | PASS。`shrink-0` 与 `whitespace-nowrap` 成对，正确 |
| 搜索收敛为图标按钮 | L128–140，`data-search-open` + `lucide:search` + `<kbd>/</kbd>`（`xl:flex` 才显示） | PASS。与 §B 决策一致 |
| `/` 快捷键 | `SearchDialog.astro` L72–80 | PASS **且优于我的规范**。除我要求的输入框排除外，还额外排除了修饰键（`metaKey/ctrlKey/altKey`）与 `isContentEditable`，且用 `overlay?.hidden === false` 做了"已打开则不重复触发"的守卫。实现正确，无劫持风险 |
| active 判定 | L29–L41 `isActive()` | PASS **且优于我的规范**。做了去尾斜杠 + 前缀匹配，正确解决了 `/products/<sku>/` 应高亮 "All products"、且 `/product-lines/` 不被 `/products` 误伤的问题（我在规范里只写了 `startsWith`，未处理前缀歧义，他们补上了） |
| 移动端 active | L177–187 `aria-current` + 左侧 2px `accent-metal` 竖条 | PASS。折叠面板无 hover 态，用静态竖条合理，与 §D 建议一致 |
| P0 合规 | 两个文件 | PASS。零 emoji、零紫粉渐变、零硬编码 hex、图标全 `lucide:*` |
| 触控目标 | 全程 `h-11` / `size-11` | PASS，44px 未被破坏 |

### G2. 待修项 1（阻塞级）：active 下划线不贴header 底边，浮空 9px

`navLinkClass()` 用的是 `border-b-2 border-accent-metal`。实测几何：

- header `h-16` = 64px，`border-b` 1px => 内容底边 y=63
- nav 链接 `h-11` = 44px，`items-center` 垂直居中 => 链接底边 y=54
- **结果：2px accent 下划线浮在 y=52–54，距header 自身的 `border-border` 还有 9px 间隙。**

视觉后果：active 指示线与 header 底边之间出现一道明显空隙，看起来像"悬浮的短横线没贴住"，而不是"这一项被选中了"。这正是 Linear / Vercel 类header active 态要避免的廉价感。

**修法（二选一，推荐前者）**：

```html
<!-- 推荐：伪元素下移 10px，贴齐 header 底边 -->
class="... after:absolute after:inset-x-3 after:-bottom-2.5 after:h-0.5 after:rounded-pill after:bg-accent-metal"
<!-- 此时必须给链接加 relative -->
class="relative flex h-11 shrink-0 items-center ..."
```
注意：改用伪元素后**必须移除** `border-b-2 border-transparent` 占位类，否则会多出一条 2px 空边框把链接撑到 46px。若要保留 hover 不跳动，改用 `after:content-['']` + 无 transition 即可（当前 `duration-150` 只作用于 background-color，不影响 after）。

若坚持用 `border-b-2`，则需把链接改成 `h-16`（与 header 等高）让底边自然对齐—— **但这会破坏 §C6 的 44px 触控目标语义**，不推荐。

### G3. 待修项 2（阻塞级）：`xl:flex` 断点使1024–1279px 丢失桌面导航，且掩盖了真实问题

落地版把断点从 `lg:flex`(1024) 改成了 `xl:flex`(1280)（L94 / L158 / L166 三处）。

后果：**1280px 以下、1024px 以上的全部宽度**（典型 1366×768笔记本的实际内容区、部分 1280 屏浏览器缩放后、以及 §0 提到的采购商常用机型）**都退化为汉堡菜单**——采购商在这段区间无法直接看到 Product Lines / Compliance / Contact。这是**用牺牲可用性换取不溢出**，而溢出本身是可以靠减项根治的。

实测当前 6 项布局总宽 **963px**，而 1024px 视口可用 976px：
- 余量仅 **13px**。字体实际度量稍有偏差（Public Sans 真实 advance 与我按 0.50em 的估算可能差 ±5%）就会溢出 20–40px，届时 `shrink-0` 会让导航**横向溢出并被裁切**（比换行更糟）。
- 所以当前实现是**"窄区间用汉堡掩盖溢出"**，不是"消除溢出"。

**修法（推荐路径，按§A 执行）**：删除 `Sourcing`（L117）与 `Blog`（L118）两个一级项，页脚 `Footer.astro` L40–L41 已有同名入口，不丢内容。
- 6 项 => 4 项后总宽 **827px**，1024px 余量 **149px**（>10% 容差，安全）
- 断点即可安全地改回 `lg:flex`，恢复 1024–1279px 的桌面导航
- 三处断点需同步改回：`Header.astro` L94 `xl:flex`=>`lg:flex`、L158 `xl:hidden`=>`lg:hidden`、L166 `xl:hidden`=>`lg:hidden`；kbd 提示 L137 保留 `xl:flex` 不变（它是锦上添花，不影响布局）

若前端坚持保留 6 项，则**必须**保留 `xl:flex`，并额外把 nav 链接的 `px-3`(24px) 降到 `px-2`(16px) 以多挤出约 48px。**但我不推荐这条路径**：为保住两个本就该下沉到页脚的次要入口，而让整段笔记本区间失去桌面导航，是错误的取舍。

### G4. 待修项 3（次要）：`nav` 与容器缺 `shrink-0` / `min-w-0`

- L94 `<nav class="hidden items-center gap-0.5 xl:flex">` 缺 `shrink-0`。子项虽已 `shrink-0`，但 nav 自身作为 flex 子项仍可被压缩，压缩后子项 `shrink-0` 拒不让位，结果是**溢出 nav 盒**而非换行——这正是当前 13px 余量下最可能出现的故障形态。加 `shrink-0` 可让它更早、更可预测地溢出。
- L89 容器 `container-page flex h-16 items-center gap-2 lg:gap-4` 缺 `min-w-0`（§C1 已列）。当前不触发是因为侧边内容都不超长，但属防御性缺失。

### G5. 一处未采纳但建议保留观察

`SearchDialog.astro` L22 仍复用 `t('nav.searchPlaceholder')`（47字符）。在 `max-w-xl`(576px) 弹窗里 47 字符会占满输入区右侧，L1 SKU 精确匹配的示例（`SZTX268`）在窄屏会被截断。建议后续新增弹窗专用短 key。此项不影响 header，优先级低。