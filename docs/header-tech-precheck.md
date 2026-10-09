# Header 技术预研结论（阶段一 · 只读，不含代码改动）

> 作者：前端（贾思敏）｜日期：2026-10-09
> 方法：**Playwright 实测已构建产物**（`dist/client` + 静态服务器），非估算。所有宽高数字均为 `getBoundingClientRect()` / `getComputedStyle()` 实测值。
> 阶段一铁律遵守情况：**未修改任何 `src/` 代码**。测量脚本写在 `.dev/`（已被 `.gitignore` L100 忽略），不污染仓库。

---

## 0. 重要前提修正：代码已被他人改动，`git status` 非干净

派单时描述 Header.astro 为 181 行；**我打开时已是 240 行**。开工前先做了 `git status`：

```
 M src/components/layout/Header.astro        (+100 行)
 M src/components/search/SearchDialog.astro  (+9 行)
?? docs/header-ux-spec.md                    设计师规范已落盘
?? scripts/verify-header-nav.mjs             设计师回归脚本已落盘
```

即：**设计师的规范已出，且已有人按规范改完了代码**。本预研因此调整为「审计现有实现 + 量化复核规范结论」，而非从零设计。下方所有结论基于**当前 HEAD 工作区代码**，并已 `npm run build` 验证通过（`astro check` + `astro build` + pagefind 索引 1032 页，1m48s，无报错）。

---

## Q1：active 态怎么实现最干净？

### 结论：推荐 **(a) frontmatter 读 `Astro.url.pathname` 做前缀匹配**，且**当前实现已经是对的**，但有 2 处需修。

### 为什么不选 (b) / (c)

| 方案 | 否决理由 |
|---|---|
| (b) 纯 CSS `aria-current` | `aria-current` **本身不含视觉样式**，CSS 无法「检测属性值」来上色（`:has([aria-current])` 只能选祖先，不能选自身）。最终仍需每页手动传属性 = 21 个页面全改，且漏一个就静默失效。 |
| (c) 客户端 script 监听 pathname | 本项目 `output: 'static'`（`astro.config.mjs` L11），**没有客户端路由**， pathname 永不变化。为一个编译期已知的信息引入运行时 JS + FOUC（先渲染无高亮再补高亮），是纯负债。 |

### 为什么 (a) 正确

`Header.astro` 是静态渲染组件，但 `Astro.url.pathname` 在**构建期**就是确定的 —— 每页构建时该组件被单独渲染一次，天然拿到该页的 pathname。**零运行时成本、零 FOUC、无 21 页重复劳动**，且 SSR 输出即最终输出（对 SEO 抓取也友好）。

项目内已有先例：`AdminLayout.astro` L100-101 正是这个写法（`Astro.url.pathname === '/admin/'`）。

### 前缀冲突：规范担心的 `/products/` vs `/product-lines/` 问题不存在

规范 §C3 担心「`/product-lines/xxx/` 被 `/products` 误伤」。**实测证伪**：

当前实现（Header.astro L37-41）：
```ts
const isActive = (href: string): boolean => {
  const target = href.replace(/\/+$/, '') || '/';
  if (target === '/') return pathname === '/';
  return pathname === target || pathname.startsWith(`${target}/`);
};
```

关键在 `startsWith(\`${target}/\`)` —— **匹配时补了斜杠**。所以 `/products` 不会命中 `/product-lines/xxx/`（后者不以 `/products/` 开头）。这是比规范 L139 建议的裸 `path.startsWith(href)` **更严谨**的写法，规避了 `/product` 误命中 `/products` 这类经典 bug。

**8 条路由实测 active 态（1440px）全部正确**：

| pathname | active 项 | 数量 | 正确 |
|---|---|---|---|
| `/` | 无 | 0 | ✅ |
| `/products/` | All products | 1 | ✅ |
| `/products/gr001/`（PDP） | All products | 1 | ✅ 前缀生效 |
| `/product-lines/stainless-titanium-steel/` | Product Lines | 1 | ✅ **未被 /products 误伤** |
| `/compliance/` | Compliance | 1 | ✅ |
| `/blog/` | Blog | 1 | ✅ |
| `/contact/` | Contact | 1 | ✅ |
| `/sourcing-partners/` | Sourcing | 1 | ✅ |

### ⛔ Q1 待修 2 项（阻塞级）

**Q1-a｜桌面端 active 链接缺 `aria-current="page"`（无障碍缺陷）**

- 现状：`aria-current` **只出现在移动端**（Header.astro L179），桌面 6 个 nav 项**一个都没有**。
- 实测：`/compliance/` 页面上 `a.border-accent-metal.hasAttribute('aria-current')` = **false**。
- 违反：规范 §C3 与 §C9 明确要求「active 链接必须带 `aria-current="page"`」，且项目内 `AdminLayout.astro` L100、`products/[sku].astro` L100 均有先例。
- 影响：屏幕阅读器用户无法获知当前位置；WCAG 1.3.1（信息与关系）不达标。**B2B 站的可访问性是验收项，必须补。**
- 修法：`navLinkClass()` 同时返回 `aria-current`（或改用一个 `navAttrs(href)` 返回 `{ class, 'aria-current': ... }`）。

**Q1-b｜active 态用 `border-b-2` 而非规范的 `after:` 伪元素（视觉微缺陷）**

- 规范 §C3 L156-166 明确要求用 `after:` 伪元素，理由是「避免 `border-b` 撑高元素导致 `h-11` 变形」。
- 现状用了 `border-b-2 border-accent-metal`。因为 `box-sizing: border-box`（Tailwind preflight），**`h-11`(44px) 盒高未变**，实测 6 项 `offsetHeight` 全部 = 44，**统一无变形** → 规范担心的失败模式没发生。
- 但仍有一处真实差异：`clientHeight` 从 42px（无边框）降为 42px（含 2px 边框），**active 项的文字垂直可用空间少 2px**。当前 14px/21px 行高下不可见，但属于脆弱设计 —— 一旦将来行高调大或换字体就会出现文字上移跳动。
- 判定：**非阻塞**。`after:` 方案更干净，但 `border-b-2` 当前无可见缺陷。建议改，但不卡发布。

---

## Q2：断点怎么定？

### 结论：**规范 §C4 是对的，当前实现的 `xl:flex` 是错的，必须回退到 `lg:flex`。**

这是本次预研**最重要的发现**，且与已落地的代码相反。

### 实测推算（三档 + 补测）

各视口下 `.container-page` 内容区可用宽度 = `min(视口, 1280) - 2×24px`（`global.css` L146-148 在 ≥1024 时 `padding-inline: 24px`）：

| 视口 | 内容区可用 | 现状总需求 | 余量 | 结果 |
|---|---|---|---|---|
| 1024 | 976px | 1020.8px | **−44.8px** | ❌ 溢出 21px，header 视觉高 95px |
| 1100 | 1052px | 1052px | 0 | ⚠️ 刚好卡死 |
| 1280 | 1232px | 1232px | 0 | ⚠️ 刚好卡死 |
| 1440 | 1232px（`max-width` 封顶） | 1232px | 0 | ⚠️ 刚好卡死 |

**这就是「1280 和 1440 一样挤」的根因**：`container-page` 的 `max-width:1280px`（`global.css` L133）意味着**超过 1280 的视口可用宽度恒为 1232px，一根像素都不多给**。规范 §0 与 §C4 对此的判断完全正确。

### 决定性实验：把 `xl:flex` 改回 `lg:flex` 装得下吗？

我在真实页面上强制 `nav.style.display='flex'` + 隐藏汉堡（模拟 `lg` 断点），实测：

| 视口 | 内容区 | 实际占用 | **余量** | 折行 | 横向溢出 | header 高 |
|---|---|---|---|---|---|---|
| 1024 | 976px | 938.1px | **+37.9px** | 无 | 0 | 65px |
| 1100 | 1052px | 938.1px | **+113.9px** | 无 | 0 | 65px |
| 1200 | 1152px | 938.1px | +213.9px | 无 | 0 | 65px |
| 1279 | 1231px | 938.1px | +292.9px | 无 | 0 | 65px |

**结论：`lg` 断点下 1024px 起就有 +37.9px 余量，且零折行、零溢出。改回 `lg` 完全可行，且更宽裕。**

连最坏情况（`kbd` `/` 提示也在 `lg` 显示，+20px）在 1024px 仍剩 **+11.9px** 余量、不溢出。

### 当前 `xl:flex` 的代价（为什么必须改）

实测 @1024 与 @1100：`desktopNav=false`、`burger=true` —— **1024–1279px 整段区间全部降级成汉堡菜单**。

- 这是 B2B 买家最主流的笔记本区间（1366×768 笔记本在浏览器未最大化时 CSS 宽度常落在 1024–1279）。
- 规范 §C4 的原话「`xl:flex` 修的是一个不存在的窄区间，放着真实缺陷不管」——**现在缺陷被 `xl` 掩盖了，反而变成了「1024–1279 白白丢导航」的主动退化**。
- 当前 `xl` 下 1280px 起余量仅 **+267.9px**（用了 964.1/1232），1280–1366 区间因 `max-width` 封顶余量恒定，是安全的 —— 所以**改回 `lg` 的风险极低，收益是 256px 宽的区间恢复桌面导航**。

### 附带建议

`kbd` 提示（`/` 键帽）的 `xl:flex` 应同步回退到 `lg:flex`，与导航同一断点 —— 实测最坏情况仍不溢出，且能提前告诉用户「按 `/` 可搜索」，可发现性收益实在。

---

## Q3：搜索框改造：方案 (a) vs (b)

### 结论：**(b) 图标按钮 + 点击展开全宽 overlay。规范 §B 的判断成立，且当前实现方向正确。**

### 先答「SearchDialog 是不是已经承担了搜索功能」——**是，完全承担**

我读了 `SearchDialog.astro`（135 行）。它是一个**功能完整的检索弹窗**，不是占位壳：

| 能力 | 位置 | 实现 |
|---|---|---|
| L1 SKU 精确匹配 | L90 `exactMatch(index, query)` | 构建期内联完整 SKU 索引（L36 `data-sku-index`） |
| L2 相似 SKU 建议 | L95 `suggestSku(...)` | "Did you mean" 兜底 |
| L3 Pagefind 全文 | L101-105 | 懒加载，搜正文（`data-pagefind-body`） |
| 输入框 | L19-25 | `type="search"`，`h-14`(56px)，`w-full`，`text-base` |
| 自动聚焦 | L57 | `input?.focus()` |
| Esc 关闭 + 焦点归还 | L70-72 / L61 | `lastTrigger?.focus()` |
| 无结果态 | L104-107 | 有 |

**而 header 里那个「假输入框」（改动前 L80-88）只是个 `<button data-search-open>`** —— 它连 `<input>` 都没有，不可能接收任何输入。SearchDialog L66 监听点击后弹窗。

### 所以 (b) 更合理的硬证据

1. **它本来就不是输入框。** 带边框、带长占位文案的 `<button>` 在用户认知里就是「可以在这里打字」。这是**语义谎言**，不是信息缺失。采购商点进去发现要再点一次才能打字 —— 这是纯粹的摩擦。
2. **SKU 可发现性零损失。** SKU 直达能力 100% 在弹窗内（`exactMatch` + 内联索引）。header 显示什么文案，**不影响任何检索能力**。规范 §B L98 的这个论证我核实成立。
3. **宽度上 (a) 数学上不成立。** 我按 14px Public Sans 实测字符宽 ≈7.2px 推算，1024px 视口下右侧簇总预算仅 **155.8px**：扣掉 RFQ 按钮 80px + 内 gap 8px → 搜索按钮只剩 **≤67.8px**；再扣 icon 20px + `px-3`×2 24px + border 2px = 46px 固定开销 → **占位文案可用宽度仅 21.8px ≈ 3 个字符**。
   实测验证方案 (a)（压到 20 字符 "Search SKU or style" + `max-w-240`）：

   | 视口 | 内容区 | 占用 | 余量 | 横向溢出 |
   |---|---|---|---|---|
   | 1024 | 976px | 1091.6px | **−115.6px** | **溢出 92px** ❌ |
   | 1100 | 1052px | 1091.6px | **−39.6px** | **溢出 16px** ❌ |
   | 1280 | 1232px | 1091.6px | +140.4px | 0 ✅ |

   **(a) 在 1024–1119px 区间是坏的**，而这正是采购商主力区间 —— 与规范 §B L87 的判断一致。

4. **方案 (b) 实测零成本**：图标化后整行占用从 1020.8px 降到 **952.1px**（省 68.7px），1024px 起就有 +23.9px 余量，且 nav 回到 576px 自然宽、**零折行**。

### 当前实现：方向对，但有 3 处待修

已做（实测确认）：
- ✅ 占位文案 47 字符已移除，按钮 = 图标 + `kbd` `/`，实测 **66×44px**（≥44px 触控达标）
- ✅ `<kbd>/</kbd>` 用 `text-muted`（规范 §C7 要求，因 `text-meta` 3.89:1 未过 AA）—— 符合
- ✅ `/` 快捷键已实现（SearchDialog L70-81），实测：按 `/` 弹窗打开 + 输入框自动聚焦；**输入态下不劫持**（实测 `overlayOpen=false`）；`Escape` 关闭正常

**⛔ Q3-a（阻塞）｜缺 `aria-label`，当前靠 `title` + `sr-only` 兜**

- 现状：按钮**无 `aria-label`**（实测 `hasAriaLabel=false`），靠 `title="Search"` + `<span class="sr-only">Search</span>`。
- 违反：规范 §B L103 明确「加 `aria-label={t('nav.search')}`。**禁止只留图标无标签**」，§C9 L225 重申。
- 判定：`sr-only` 文本**技术上也能提供可访问名称**，所以不是「无标签」那么严重；但规范点名要 `aria-label`，且 `title` 在鼠标悬停时还会冒出原生 tooltip（视觉噪音，与 `kbd` 提示并存显得啰嗦）。**按规范补 `aria-label` 一行即可。**
- 建议：`aria-label={t('nav.search')}` + 移除 `title`（避免 tooltip 与 kbd 提示双份提示）。

**⚠️ Q3-b（非阻塞）｜弹窗占位文案仍是 47 字符，规范 §B 第 4 条未做**

- 实测弹窗输入框 `placeholder` = `"Search by SKU, material or style — e.g. SZTX268"`，**len=47**。
- `en.json` 中 `nav.searchPlaceholderOverlay` **不存在**（我用 node 查过，输出 `(NOT ADDED)`）。
- 规范 §B L105 要求新增 ≤24 字符的弹窗专用 key，并把 `SZTX268` 示例移入 helper 文本。
- 影响：`max-w-xl`(576px) 弹窗内 47 字符确实占满输入区。**属既有状态，非本次回归**，但既然规范提了就顺手做掉。

**⚠️ Q3-c（非阻塞）｜`/` 快捷键的边界**

实测通过，但建议补一条：现有判断排除了 `INPUT/TEXTAREA/SELECT/contentEditable` 与修饰键，**但没排除「弹窗已打开时再按 `/`」** —— 代码里用 `overlay?.hidden === false` early-return 挡住了，逻辑正确。仅提示：若日后有人重构这段，需保住这个 guard。

---

## Q4：回归风险

### 4.1 `lg:top-20`（80px）会不会因 header 变高而失效？→ **不会，无需改**

- 实测（1280px，滚动 1200px 后）：`header.position=sticky`、`header.top=0px`、`header.height=65px`（64px `h-16` + 1px `border-b`）、`aside.top=80px`。
- header **高度未变**：现状实现下 6 档视口（1024/1100/1280/1366/1440/1920）实测 `headerBox` **恒为 65px**，无一处被撑高。
- 规范 §C2 要求「容器保持 `h-16`」，当前实现**已达标**（设计师脚本实测 64px，PASS）。
- **结论：`lg:top-20` 保持 80px，不需要动。** 唯一要留意的是：**若将来把 `h-16` 改成更高，必须同步改 `top-*`**。建议在 `products/index.astro` L87 加一行注释锁定这个耦合关系（规范 §C2 也提了这个风险，但没落到代码注释）。

### 4.2 `UtilityBar` sticky 基准 / 会不会改出缝隙？→ **不会，但发现一个规范未提的点**

- 实测：`UtilityBar` 是 **`position: static`**（不在 sticky 上下文里），`h-9` = 36px；`Header` 是独立的 `sticky top-0 z-[200]`。
- 所以**两者不是叠加的 sticky**：滚动后 `UtilityBar.top = -1200px`（随文档滚走），只有 `header` 钉在 0。所以团队 lead 猜的「36 + 64 = 100px」**不成立** —— 实际 sticky 基准就是 **65px 单层**。
- **无缝隙风险**：两者都是普通块级流，`UtilityBar` 在 `BaseLayout.astro` L89、`Header` 在 L90 紧邻排列，中间无 `position` 冲突。且 `UtilityBar` 的 `z-[200]` 与 `header` 的 `z-[200]` 同值但不在同一层叠上下文竞争（static 元素不参与 sticky 定位）。
- 顺带修正团队 lead 的一个前提：**`lg:top-20` = 80px 与 header 65px 之间有 15px 间隙**，这是设计刻意留的呼吸位，不是 bug。

### 4.3 移动端 `MobileRfqBar` / `MobileContactBar` 冲突？→ **不冲突**

- `MobileRfqBar` 是 `fixed inset-x-0 bottom-0 z-[205]`，`MobileContactBar` 同为底部 fixed。
- 二者与 header 的 `sticky top-0 z-[200]` **在垂直方向完全分离**（一个 top、一个 bottom），且本次 header 改动**不触碰**它们。
- `BaseLayout.astro` L85 的 `pb-[calc(env(safe-area-inset-bottom)+3.5rem)] lg:pb-0` 给底部条留了空间，未受影响。
- 实测 375px（iPhone 13）：移动端横向溢出 **0px**，菜单可开可收，active 态标记存在，**零回归**。

### 4.4 触控目标复核 → **2 处 <44px（非本次引入，但需知晓）**

实测 iPhone 13（375px）header 内所有可见交互元素：

| 元素 | 尺寸 | 判定 |
|---|---|---|
| RFQ 按钮 | 44×44 | ✅ |
| 汉堡按钮 | 44×44 | ✅ |
| **搜索按钮** | **40×44** | ❌ 宽 40 < 44 |
| **Wordmark 链接** | **174.5×32** | ❌ 高 32 < 44 |

- **搜索按钮 40×44**：规范 §C5 L190 要求改 `size-11`（44×44 固定方形），实际是 `h-11 + px-2.5` 自适应宽度 → 窄屏下只有 40px 宽。规范 §C6 L199 说「宽高都变成 44px，触控面积不降反升」，**实现没做到方形**。桌面端因为有 `kbd` 是 66×44（宽 >44 反而更糟 —— 宽而扁，竖直方向仍只有 44 但横向长条形状不符合方形触控建议）。
  - 修法：给搜索按钮 `min-w-11`（或直接 `size-11` 并把 `kbd` 移出按钮）。
- **Wordmark 174.5×32**：`Wordmark.astro` L35 的 `size-8`(32px) 图标决定了链接高 32px。**这是本次改动之前就存在的**，不算回归；但既然规范 §C6 在讲触控目标，建议顺手加 `py-1.5` 补到 44px 高。
- 其余 `mobile-nav` 链接 `min-h-11`、关闭按钮 `size-11` 均达标。

### 4.5 其他回归扫描

- `npm run build`（含 `astro check` 类型检查）：**通过**，无 TS/astro 报错。
- `npm test`：**57 passed / 6 files**，全绿。
- `node scripts/emoji-scan.mjs`：`Header.astro` / `Wordmark.astro` / `MobileRfqBar.astro` / `products/index.astro` 全部 **OK**，零 emoji。
- 硬编码颜色扫描：新增样式全部走 token（`accent-metal` / `surface-sunken` / `border-border` / `muted`），无裸 hex。
- 文件行数：`Header.astro` 240 行，**未超 300 行上限**（余量 60 行）。
- 动态拼接 Tailwind 类：`navLinkClass()` 用 `.join(' ')` 拼**完整字面量类名**（不是 `bg-${x}` 模板插值），Tailwind 4 静态扫描能命中 → **安全**。这点项目踩过坑，当前写法正确。

### 4.6 设计师回归脚本 `verify-header-nav.mjs` 的 2 项 FAIL → **均为误报，但断言需修**

我跑了该脚本（29 项，27 PASS / 2 FAIL），逐项溯源：

**FAIL 1：`搜索按钮无长占位文案 — 可见文本="Search"`**

- 脚本 L93-94 断言 `searchBtn.innerText().trim().length <= 2`。
- 实测 `innerText` = `"/\nSearch"` —— 它把 `<span class="sr-only">Search</span>`（实测宽度 **1px**，`clip: rect(0,0,0,0)`，视觉完全隐藏）读了出来，另有 `kbd` 的 `/`。
- **真实可见文本为空**（sr-only 宽 1px），长占位文案**确已移除**。功能目标已达成。
- 修法：断言改为只看「视觉可见文本」—— 过滤掉 `.sr-only` 后的 `textContent`，或直接断言 `[data-search-open]` 内**不含** `t('nav.searchPlaceholder')` 的 47 字符串。

**FAIL 2：`1024px 视口横向溢出清零 — 溢出 62px`**

- 我做了严格溯源：直接以 1024 打开任何页面，**溢出恒为 0px**；只有「1440 → 1280 → 1024 连续 `setViewportSize`」这条路径才出现 62px。
- 进一步定位：62px 来自**首页产品卡的横向滚动 carousel**（`w-48 shrink-0 snap-start` 卡片，祖先 `overflow-x-auto`），**与 header 无关** —— 实测 `header` 内部越界元素数 = **0**，`header.scrollWidth == clientWidth == 1024`。
- 且该 carousel 位于 `container-wide`（max-width 1440）内，resize 后 Chromium 对 `overflow-x:auto` 容器的 scrollWidth 重算有残留，属于**既有的 resize 瞬态**，不是本次 header 改动引入。
- 佐证：脚本自己在 1280/1440 都 PASS，且我直接 goto 1024 时 `overflow=0`。
- 修法：脚本改为**每个宽度都重新 `goto`**（而不是 `setViewportSize` 复用同一页面），或把断言范围限定在 `header` 内（`header.scrollWidth <= header.clientWidth`），避免被页面其他区域污染。

---

## 交付前自检（P0 红线逐条）

| # | 红线 | 结论 |
|---|---|---|
| 1 | 禁止 emoji 作图标 | ✅ `emoji-scan.mjs` 全 OK，统一 `lucide:*` |
| 2 | 禁止紫粉渐变 | ✅ header 无任何渐变 |
| 3 | 禁止硬编码颜色 | ✅ 全部 token（`accent-metal`/`surface-sunken`/`border-border`/`muted`） |
| 4 | 禁动态拼接 Tailwind 类 | ✅ `navLinkClass()` 拼完整字面量，非模板插值 |
| 5 | 触控 ≥44px | ⚠️ **搜索按钮 40×44、Wordmark 高 32**（Wordmark 为既有问题） |
| 6 | frontmatter 纯 TS，无 JSX 字面量 | ✅ 新增 `isActive`/`navLinkClass` 为纯 TS |
| 7 | 单文件 ≤300 行 | ✅ 240 行 |

---

## 失效模式自检（6 类）

| # | 失效模式 | 检查结果 |
|---|---|---|
| 1 | Happy-path 偏差 | ✅ 8 条路由 + 6 档视口全测；Escape/快速跳转/输入态排除均测 |
| 2 | **沉默逻辑错误** | ✅ 重点核查 `/products` vs `/product-lines` 前缀冲突（实测未误伤）；曾测出 `41px vs 44px` 矛盾读数，**溯源为选择器误匹配下拉面板链接**，非真实变形，已复现 3 次确认 |
| 3 | 幻觉依赖/接口 | ✅ 未新增依赖；`astro-icon` `lucide:*` 已锁定 |
| 4 | 缺失系统上下文 | ✅ 权限/多租户不涉及；已核查 `z-[200]/[205]/[300]/[500]` 层叠关系 |
| 5 | 性能盲区 | ✅ 纯静态渲染，active 判定零运行时 JS；无 N+1、无循环 IO |
| 6 | 静默缺失 | ✅ `astro check` + 57 项测试全绿；两处 a11y 缺陷（Q1-a/Q3-a）是**语义层**，编译器无法捕获，已人工标记 |

---

## 结论摘要

| # | 事项 | 判定 |
|---|---|---|
| Q1 | active 态方案 | ✅ **(a) frontmatter 读 pathname**，实现正确（含 `/products` 与 `/product-lines` 防冲突）；⛔ 桌面缺 `aria-current` 需补 |
| Q2 | 断点 | ⛔ **必须从 `xl` 回退到 `lg`**。实测 1024 起余量 +37.9px，零折零溢出；当前 `xl` 让 1024–1279px 白白降级成汉堡 |
| Q3 | 搜索框 | ✅ **(b) 图标 + overlay**。SearchDialog 是完整检索弹窗，header 原本就只是 trigger；方案 (a) 在 1024–1119px 数学上不成立。⛔ 需补 `aria-label`；⚠️ 弹窗占位 47 字符待收短 |
| Q4 | 回归风险 | ✅ `top-20` **无需改**（header 恒 65px）；✅ 无 sticky 缝隙（UtilityBar 是 static，不叠加）；✅ 移动端零冲突；⚠️ 2 处触控 <44px；⚠️ 回归脚本 2 项断言需修（均误报） |

**净结论**：本次修复的**方向全部正确**（折行、搜索收敛、active 态三处根因都抓准了），build 与测试全绿。
落地前需处理的**阻塞项 3 个**：
1. 断点 `xl` → `lg`（Q2，影响 256px 宽区间的导航可用性）
2. 桌面 active 补 `aria-current="page"`（Q1-a，无障碍）
3. 搜索按钮补 `aria-label`（Q3-a，规范硬性要求）

**非阻塞 4 个**：active 改 `after:` 伪元素、弹窗占位收短、搜索按钮 `size-11`、Wordmark 触控高度。
**回归脚本 2 项断言修法**：过滤 `.sr-only` 后再断言文本；溢出检测改为重新 `goto` 或限定 header 范围。