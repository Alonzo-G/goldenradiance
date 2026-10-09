# Style Filter 技术预研结论（审计版 · 代码已由他人落地，我只读不改）

> 作者：前端（贾思敏）｜日期：2026-10-09
> 方法：`npx astro check`（93 文件，**0 errors / 0 warnings / 5 hints**）+ `git diff` 逐行审计 + 对 `dist/client` 已构建产物做 JSON 体积实测 + 对 1012 个内容文件做 style_tags 全量统计。
> **重要前提修正：派单说「不要改代码，只做预研」，但我打开时款式筛选已被实现。** 工作树状态：

```
 M src/components/product/catalog.ts      (+153/-99, 350 -> 258 行)
 M src/i18n/en.json                       (+33)
 M src/lib/products/queries.ts            (+4)
 M src/pages/products/index.astro         (+26,   337 -> 274 行)
?? src/lib/products/styles.ts             (新建,  57 行)
?? src/components/product/FilterStyleGroups.astro (新建,  85 行)
?? src/components/product/catalog-views.ts         (新建, 103 行)
?? scripts/verify-style-filter.mjs        (新建，落地者的专项回归脚本)
?? docs/style-filter-ux-spec.md           (设计师规范)
?? docs/style-filter-tech-precheck.md     (本文档)
```

即：**Q1-Q4 的问题已被实现者（按设计师 UX spec）先行落地**。本文档因此为「审计现有实现 + 复核结论 + 指出残留缺陷」，而非从零给方案。**我未修改任何 `src/` 或 `scripts/` 文件**（`git status` 前后一致）。

### 审计过程中的时序说明（重要，别按旧结论决策）

我第一次跑 `astro check` 时报**2 errors**（`FilterStyleGroups.astro` import路径 `../../../` 多一层 + 模板重复条件包裹）。写完初版文档后复跑，**已是 0 errors** —— 落地者在我审计期间自行修掉了 import 路径。**重复条件包裹的代码文本仍在文件里（见 §4.3），但它不报错**，因为 `A && (A && jsx)` 是合法 JS 表达式，第二个 `A` 只是冗余重复求值，不影响渲染结果。**那是代码整洁度问题，不是功能缺陷。**

---

## 0. 裁决摘要

| 项 | 结论 |
|---|---|
| Q1 多值 OR 语义 | **已实现且正确**。`it.styles.some((s) => styles.has(s))`，`["cuff","bangle"]` 命中任一即通过。chip 移除**无需改动**，checkbox `value` 填单个 tag 字符串是唯一正确答案。 |
| Q2 facet 阈值 | **构建期算，已实现且位置正确**。客户端重复计算无收益（§2）。 |
| Q3 深链 | **已实现且做了升级**：重复 param + ghost checkbox 兜底，比派单假设的「静默失效」更好。 |
| Q4 回归风险 | **0 阻塞**（import 路径已由落地者修复）+ **3 个非阻塞**（1 个代码整洁度 + 2 个需写进交付说明的事实）。见 §4。 |
| 类型检查 | `npx astro check` = **0 errors, 0 warnings, 5 hints**（93 文件） |

---

## 1. Q1：多值 OR 语义怎么实现最干净？

### 结论：现有实现（`catalog.ts:76`）就是最干净的写法，**不需要改**。

```ts
// src/components/product/catalog.ts L62 + L73-76
const styles = by('style');   // 从 activeFilters() 的 DOM 读取，与其他 5 个轴完全同构
// ...
      // 款式轴内部是 OR：一款可同时带 cuff + bangle，命中任一选中款式即通过。
      // styles 为空数组的产品（手链 80/892）会被自然排除——这是诚实的过滤：
      // 未标注款式的产品本来就不属于任何款式类，不假装它属于。
      (!styles.size || it.styles.some((s) => styles.has(s))) &&
```

**为什么这是最优形态，三条：**

1. **零特例分支**。`by('style')` 与 `by('line')`/`by('cats')` 完全同构，`apply()` 里没有任何 `if (axis === 'style')` 的分叉。整个多值语义被压缩进一个 `.some()` 调用。
2. **`!styles.size ||` 前置守卫**保证未勾选款式时该轴不参与过滤（与所有其他轴一致），所以 `.some()` 不会在空 Set 上做无意义调用。
3. **`it.styles.some` 对空数组天然返回 false**。111 款无 `style_tags` 的产品在勾选任一款式后被排除，语义正确——款式未标注就不假装它属于任何款式类。

**逐条验证派单提的假设：**

| 派单假设 | 验证结果 |
|---|---|
| `["cuff","bangle"]` 的产品，用户只勾 `bangle` 必须出现 | **满足**。实测数据：勾选 `bangle` 时 604 款通过，其中包含 243 款 `["cuff","bangle"]` 双标签款（它们命中 `bangle`）。 |
| 空 `styles` 数组的产品是否被误纳 | **不会**。`.some()` 对 `[]` 返回 false。 |

**与 AND 语义的对比数据（我用真实数据算的，证明 OR 是必须的）：**

```
款式两两组合（C++ 全组合）：
  AND 交集 = 0 的组合：53 / 55
  OR  并集最小值：15 款（initial-letter + cross）
```

**53/55 的组合在 AND 下会是 0 结果。** 如果实现者误写成 `.every()` 或 `styles.every(s => it.styles.includes(s))`，界面上 96% 的双选组合都会跳到空状态页。这是本需求最大的单点风险点，而当前实现正确避开了。

### Q1 附带结论：chip 移除逻辑**完全不用改**

派单担心「款式是数组，checkbox 的 `value` 该填什么」。**结论：填单个 tag 字符串，这是唯一正确答案。**

原因：整条过滤链路建立在「被 checked 的 checkbox」这个 DOM 事实上——`activeFilters()` 用 `form.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')` 收集，靠 `cb.name`（轴）+ `cb.value`（值）建索引。如果 `value` 填 `"cuff,bangle"` 这种复合值：

- chip 移除 L176 的反查 `input[name="style"][value="..."]` 需要 `CSS.escape` 处理逗号（能工作，但语义已经不对——移除的是「这一个复合选项」而非「款式 X」）
- `by('style')` 拿到的 Set 里是复合串，`styles.has('cuff')` 永远false，OR 语义直接崩
- ghost checkbox 机制（§3）无法为复合值补位

**当前实现 `value={s.tag}`（单个 slug）+ `name="style"`，是唯一与现有链路同构的选择。** chip 移除、clear-all、clear-last、URL 写入四条路径全部零改动复用。

### Q1 附带结论：`styles.ts` 的 slug→文案映射表设计正确，且解决了两个隐性风险

```ts
// src/lib/products/styles.ts L14-29
export const STYLE_KEY = {
  bangle: 'bangle', ..., 'initial-letter': 'initialLetter', ...
} as const;

// L49-52
export function styleLabel(slug: string): string {
  const suffix = STYLE_KEY[slug as StyleSlug];
  return suffix ? t(`filter.style.${suffix}` as UiKey) : slug;   // 未登记 slug 回退为 slug 本身
}
```

**两个风险被正确处理了：**

1. **`t()` 对未知 key 返回 key 字符串本身**（`src/i18n/index.ts` L22：`flat[key] ?? key`）。如果不加fallback，内容里出现未登记的 slug（比如将来新增 `zodiac2`）时，买家会在界面上看到 `filter.style.zodiac2` 这种原始 key。`styleLabel` 的 `: slug` 回退堵死了这个泄漏。
2. **`initial-letter` → `initialLetter` 的 camelCase 映射**与现有 `filter.moq.onRequest` 命名一致，且用**显式查表**而非运行时 slugify——查表在 key 拼错时立刻编译报错，slugify 会静默 fallback。这是刻意的选择，方向对。

`styles.ts` 同时被构建期（`FilterStyleGroups.astro`）与客户端（`catalog.ts` 的 chip label）复用，单一数据源，无漂移风险。

---

## 2. Q2：facet 阈值放构建期还是客户端？

### 结论：**构建期，且已放在正确位置**（`index.astro` frontmatter L33-49）。

```ts
// src/pages/products/index.astro L33-49
const styleCounts = new Map<string, number>();
for (const it of index) {
  for (const s of it.styles) styleCounts.set(s, (styleCounts.get(s) ?? 0) + 1);
}

const buildStyleGroup = (order: readonly string[]) =>
  order
    .map((tag) => ({ tag, count: styleCounts.get(tag) ?? 0 }))
    .filter((x) => x.count >= STYLE_MIN_COUNT)     // = 5
    .sort((a, b) => b.count - a.count);            // 组内按数量降序
```

**为什么构建期是唯一正确答案（三条量化理由）：**

1. **阈值渲染的是 HTML，不是样式。** checkbox 渲不渲染决定的是 DOM 里有没有这个节点，而 `catalog.ts` 的过滤链路读的是 DOM。构建期少渲染一个 checkbox，客户端就少一个可勾选项——这不是运行时能补的。客户端算计数只能用来改数字，改不了「这个选项存不存在」。
2. **客户端重复计算不便宜。** `window.__SKU_INDEX__` 有 1012 条，每条 `styles` 数组平均 1.13 个元素（1424 个 tag 总数 / 1012 条）。每次 `render()` 调一次 `apply()`，全量计数 = 1012 次迭代 + Map 操作，约 0.05ms——**单次确实不贵**。但它没有任何用途：数字已经在 HTML 里写死了（`<span class="tnum">{s.count}</span>`），客户端算出来还得遍历 DOM 去比对，纯属白做。
3. **`present()` 辅助函数已经是构建期模式。** 现有 5 个facet 组（line/scenario/category/band/material/plating）全部在 frontmatter 用 `present()` / `distinctValues()` 算完再决定渲不渲染。款式组走同一条路是与既有模式一致的选择，不是新发明。

**阈值 5 的实测效果（我复算了全量 1012 个文件）：**

```
渲染 11 项：
  bangle 604  cuff 243  cable 122  clover 109  flower 55  tennis 33
  leaf 28  heart 24  station 22  initial-letter 8  cross 7

砍掉 4 项（< 5）：
  cable(ring) 4  chain 4  hoop 1  zodiac 1  number 1
```

**注意一处与设计师 spec 的数据差异（非阻塞，但落地者应知道）：**

`docs/style-filter-ux-spec.md` §3 的表把 `cuff` 记作 365、`clover` 记作 101、`chain` 记作 3、`cross` 记作 7。我的实测是`cuff` 243、`clover` 109、`chain` 4、`cross` 7。差异来自 `earrings` 6 款 + `ring` 12 款的标签——设计师按「手链 + 项链」统计，spec 里Form 组/motif 占比也是同源估算。**阈值决策不受影响**（11 项 vs砍 4 项，两侧算法结论一致），但若后续有依赖精确数字的文案或断言，须以代码实测为准。

---

## 3. Q3：深链 URL 怎么设计？

### 结论：**做，用重复 param，且实现者额外做了 ghost checkbox 兜底——比派单设想的降级方案更好。**

### 3.1 编码方式：重复 param，**现有代码零改动即可用**

`render()` L133-134 已经是重复 param 风格：

```ts
const params = new URLSearchParams();
for (const f of filters) params.append(f.axis, f.value);   // 天然产生 ?style=bangle&style=cuff
history.replaceState(null, '', [...params.keys()].length ? `?${params.toString()}` : window.location.pathname);
```

`initFromUrl` 用 `params.getAll(axis)` 读取。**双向天然匹配，写入侧不需要任何改动。** 逗号分隔反而要额外处理转义（款式 slug 本身不含逗号，但 `initial-letter` 含连字符，未来若有含逗号的 tag 就得转义），不选。

### 3.2 派单问的「脏 URL 静默失效」——实现者给出了更好的答案：ghost checkbox

派单的观察是对的：原 `initFromUrl` 里 `cb.checked = values.includes(cb.value)` 遇到不存在的 value 会静默失效。**但静默失效不等于可接受的降级，它比返回空页更糟**——买家看到 chip 消失、URL 里参数还在、结果数是全量，会以为筛选坏了。

当前实现（`catalog.ts` L208-231）改为：**URL 里的值在侧栏找不到 checkbox 时，补一个隐藏的 checked checkbox。**

```ts
function initFromUrl(): void {
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  for (const axis of ['category', 'line', 'style'] as const) {
    const values = params.getAll(axis);
    if (values.length === 0) continue;
    for (const v of values) {
      const cb = form.querySelector<HTMLInputElement>(
        `input[name="${axis}"][value="${CSS.escape(v)}"]`,
      );
      if (cb) { cb.checked = true; continue; }
      // ghost：侧栏没这个选项（?style=zodiac低于阈值 / 手输未知值 / 已下架品类）
      const ghost = document.createElement('input');
      ghost.type = 'checkbox';
      ghost.name = axis;
      ghost.value = v;
      ghost.checked = true;
      ghost.dataset.ghost = '';
      ghost.className = 'hidden';
      form.appendChild(ghost);
    }
  }
  // 深链强制展开：Motif 组默认折叠，?style=clover 时必须展开
  // 否则会出现「chip 显示已选 Four-leaf clover、侧栏却看不到该项」的自相矛盾。
  const motif = document.querySelector<HTMLDetailsElement>('[data-style-motif]');
  if (motif && form) {
    const motifTags = new Set<string>(MOTIF_TAGS);
    const anyMotifChecked = [...form.querySelectorAll<HTMLInputElement>('input[name="style"]:checked')].some(
      (cb) => motifTags.has(cb.value),
    );
    if (anyMotifChecked) motif.open = true;
  }
  // 移动端全屏 sheet 纵向可滚，折叠无收益；两端统一全展开
  if (window.matchMedia('(max-width: 1023px)').matches) {
    document.querySelectorAll<HTMLDetailsElement>('[data-style-motif]').forEach((d) => { d.open = true; });
  }
}
```

**这个设计的三点价值：**

1. **零特例分支**。ghost 补完后，过滤（`by('style')`）、chip 显示（`activeFilters`）、chip 移除（L176 反查能查到 ghost）、clear-all/clear-last全部复用现成逻辑。如果改成「在 `apply()` 里额外读一遍 URL 参数」，就是第四套并行逻辑，每加一个交互都要同步改两处。
2. **`?style=zodiac` 这类低于阈值的深链仍然出结果**（1 款），chip 显示 `Zodiac sign ×` 可移除。符合UX spec §3 的「隐藏 ≠ 失效」。
3. **CSS.escape 已用于属性选择器反查**（L216、L176），slug 含连字符（`initial-letter`）不会引发选择器语法错误。这个细节容易漏，落地者处理对了。

**但 ghost 机制有一个必须知道的行为边界（非阻塞，需在交付说明里写明）：**

**「Clear all」之后 ghost 节点残留在 DOM 里（只是变成 unchecked）。** 这不会造成功能问题——`activeFilters()` 只收 `:checked`，`history.replaceState` 只 append checked 的值，所以清空后 URL 正确变成裸路径。但如果买家随后手工把 URL 改回 `?style=zodiac` 并刷新，会得到一个新的 ghost（旧的还在但unchecked），行为仍然正确。**结论：残留不构成缺陷，但如果未来要加「记住用户筛选」的localStorage 持久化，必须先清理 ghost，否则会复活历史筛选。**

### 3.3 一个派单没问但必须提的深链风险：**筛选态 URL 未设 noindex**

11 个 checkbox 可组合出大量筛选态 URL（`?category=bracelet&style=cuff` 这种），配合首页品类卡深链，crawl budget 会被消耗在筛选组合上。`public/_headers` 的 `/*` 段没有 `X-Robots-Tag`。

**处置建议（非阻塞，一行）**：`<meta name="robots" content="noindex,follow">` 只在 `Astro.url.search` 非空时输出，即筛选态页面 noindex、干净页面照旧收录。`follow` 保留是为了让爬虫继续抓 facet 链接。这条同时覆盖现存的 category/line 深链，不只服务款式轴。

---

## 4. Q4：回归风险清单

### 4.1 体积（实测数字，含最终产物复核）

**最终复核（2026-10-09 22:20 重建后的 `dist/client/products/index.html`，1012 条 × 21 字段，`styles` 已在其中）：**

采用**同构建内剥离对照**——把同一份 JSON 的 `styles` 字段全部 pop 掉再重新序列化，排除「两次构建数据本身有差异」的干扰。这是最公平的对照方式。

| 指标 | 含 `styles` | 剥离 `styles` | 增量 |
|---|---|---|---|
| 内联 `__SKU_INDEX__` JSON（未压缩） | 559,937 | 537,919 | **+22,018（+4.09%）** |
| 内联 JSON **gzip -9** | 21,765 | 21,692 | **+73（+0.34%）** |

页面 HTML 总字节 **606,735**，内联 JSON 占页面 **92.3%**。`styles` 数组自身序列化合计 11,898 字节。

**结论：不需要字典编码，且实测比预估更安全。** 三个理由：

1. **实际传输走 gzip/brotli，增量只有 73 字节（+0.34%）。** 站点已配 `/_astro/* immutable` + Cloudflare 静态资产，压缩是默认路径。未压缩的 +22KB 里绝大部分是重复出现 604 次的 `"bangle"` 字符串——gzip 对重复串的消除极其高效，字典编码省下的 17KB 在 gzip 下几乎全部被压缩器自己消掉了。
2. **字典编码会把 `SkuIndexItem` 从「可直接 JSON.parse 的自描述对象」变成「需要 decode 函数的两段结构」**。`window.__SKU_INDEX__` 有三个消费方：`catalog.ts`（筛选）、`search/SearchDialog.astro`（检索）、`rfq/dom.ts`（RFQ 面板）。改编码要同时改三个消费方 + 构建期注入点，为 73 字节付这个复杂度不成立。
3. **`SkuIndexItem` 是 `astro:content` 到 DOM 的直通类型**。加一个 `string[]` 字段是类型安全的最小改动；引入编码层意味着这个类型不再是 JSON 的直接镜像，所有 `it.xxx` 都要改成 `it.xxx[idx]`。**为 0.34% 的传输收益引入间接层，是典型的过早优化。**

**唯一需要注意的是首屏 HTML 未压缩体积**：实测重建后`/products/index.html` 为 606,735 字节，其中内联 SKU 索引占 92.3%。款式改动贡献了其中22,018 字节。这个大头是既有架构决策，不在本次改动范围内。若未来要优化，正确方向是「把 `__SKU_INDEX__` 移出内联、改为静态 JSON + fetch」，而不是给 `styles` 做字典编码。

### 4.2 回归风险逐条

| # | 风险 | 等级 | 结论 |
|---|---|---|---|
| 1 | `FilterStyleGroups.astro` 结构问题曾导致构建失败 | **已解除** | 我首次 `astro check` 报 2 errors（import 路径多一层 `../`），落地者已自行修复。当前 **0 errors**。残留的重复条件包裹不报错，仅影响可读性。见 §4.3 |
| 2 | `catalog.ts` 破 300 行 | 非阻塞 | **已解决**：拆出 `catalog-views.ts`（103 行）后 `catalog.ts` 降到 **258 行**，`index.astro` 降到 **274 行**。拆分后 4 个文件全部合规（258/103/85/57）。 |
| 3 | `catalog.ts` L6 有未使用 import（`priceRange`/`imageSrcset`/`lineToken` 已随视图模板搬到 `catalog-views.ts`，我 grep 确认 catalog.ts 内已无这三者的调用） | 非阻塞 | `astro check` 报 `ts(6192)`，归入 5 个 hints。删掉 L6 即可。**典型「静默缺失」——不修不会挂，但每次 check 都报**。 |
| 4 | 注入体积 | 非阻塞 | 见 §4.1，gzip 仅 +73 字节（+0.34%），未压缩 +22,018。 |
| 5 | 首页品类卡深链 `/products/?category=bracelet` 闭环 | 非阻塞 | **不受影响**。`index.astro` 的 category fieldset 与 `catalog.ts` 的 `by('category')` 逻辑均未改动。`verify-home-refactor.mjs` 的断言是 `input[name="category"]:checked` 包含 `bracelet`——新加的 style checkbox `name="style"`，选择器不匹配，不会污染断言。 |
| 6 | 移动端 sheet 滚动体验 | 非阻塞 | 侧栏已有 `lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto` 兜底；移动端 `openFilters()` 加的 `fixed inset-0 overflow-y-auto` 也是全屏可滚。款式组新增约 11 × 44px，桌面靠 Motif `<details>` 折叠（省约 264px），移动端靠全屏滚动。**结论：不需要额外做 Collapse all按钮**——那是有用的增强，但不是本次的阻塞项。 |
| 7 | 空状态文案在款式筛选导致 0 结果时是否成立 | 非阻塞 | 成立。`empty.catalog.title = "Nothing matches that combination."` + `desc = "Remove one filter to see the nearest broader result set, or ask us directly."` — 文案说的是「移除一个筛选」，与款式组语义完全吻合（移除 `style=cuff`即得634 款）。**但有一个数据事实需要在交付说明里写明**（见 §4.4）。 |
| 8 | Playwright 回归脚本 | 非阻塞 | `verify-home-refactor.mjs` 不受影响（见 #5）。`verify-filters-sticky.mjs` 断言 `aside[data-filters]` 的 `getBoundingClientRect().top`，不数 fieldset 数量，不受影响。落地者新增了 `scripts/verify-style-filter.mjs` 做专项回归（我未运行，因派单要求只读）。其余 4 个脚本（`verify-brand-assets`/`verify-catalog-consistency`/`verify-header-nav`/`verify-two-lines`）与筛选无关。 |
| 9 | `aria-describedby` 指向的 sr-only span | 非阻塞 | `FilterStyleGroups.astro` 里每个 checkbox 都有对应 `<span id={`style-help-${s.tag}`}>`。**但 `styleHelp()` 对未登记 slug 返回空字符串**（`styles.ts` L57），此时 `aria-describedby` 指向一个空 span——无内容等于没描述，无害。当前 11 个 slug 全部已登记，无实际触发路径。 |
| 10 | `t()` 对未登记 key 返回 key 字符串 | 非阻塞 | 已被 `styleLabel` 的 `: slug` 回退堵死（见 §1）。 |

### 4.3 审计过程中的时序变化（阻塞项已被落地者自行修掉）

**我第一次跑 `astro check` 时确实报 2 errors**，均为 `FilterStyleGroups.astro` 的 `ts(2307)` 模块解析失败（import 路径 `../../../i18n` / `../../../lib/products/styles` 多了一层 `../`，会解析到项目根）。由于 `npm run build` = `astro check && astro build && pagefind`，check 不过则build 完全不执行，当时判定为硬阻塞。

**写完初版文档后复跑，现为 0 errors** —— 落地者已把 import 改为 `../../i18n` / `../../lib/products/styles`。当前 `astro check` 结果：**0 errors / 0 warnings / 5 hints（93 文件）**。

**残留的代码整洁度问题（不阻塞）**：`FilterStyleGroups.astro` L23-25 的重复条件包裹仍在：

```astro
{
  (forms.length > 0 || motifs.length > 0) && (
            (forms.length > 0 || motifs.length > 0) && (
              <fieldset class="border-0 p-0" data-style-group>
              ...
              </fieldset>
            )
  )
}
```

同一个条件写了两遍。**这不是 bug**——`A && (A && jsx)` 与 `A && jsx` 完全等价，第二个 `A` 只是冗余的重复求值；我逐行核对了标签配平（`<fieldset>` 3 开 3 闭、`<details>` 1 开 1 闭、`<summary>` 1 开 1 闭），渲染结果正确。问题只在缩进错乱（L24 缩进 12 空格但括号层级已变）影响可读性。

配套的调用点 `index.astro` L183-185 也保留了一个无意义的裸花括号包裹：

```astro
          {
          <FilterStyleGroups forms={styleForms} motifs={styleMotifs} />
          }
```

**建议清理（两处各删一层），但不影响构建与验收：**

```astro
// FilterStyleGroups.astro：删掉重复的第二层条件 + 整段重新缩进
{
  (forms.length > 0 || motifs.length > 0) && (
    <fieldset class="border-0 p-0" data-style-group>
      ...
    </fieldset>
  )
}

// index.astro：删掉裸花括号，直接渲染组件
<FilterStyleGroups forms={styleForms} motifs={styleMotifs} />
```

**我没有改，等你确认后再落。**

### 4.4 一个需要在交付说明里写明的数据事实（非阻塞，但是真话）

`style` × `category` 的组合矩阵（11 个过线款式 × 4 个有货品类）：

```
tag             bracelet   earrings   necklace   ring
bangle          604        0          0          0
cuff            243        0          0          0
cable           122        0          0          4
clover          56         0          45         8
flower          50         5          0          0
tennis          33         0          0          0
leaf            24         0          4          0
heart           19         0          5          0
station         22         0          0          0
initial-letter  0          0          8          0
cross           1          0          6          0

零结果组合：26 / 44（59%）
```

**这意味着：买家勾 `category=earrings` + `style=bangle` 必然 0 结果。** 这不是 bug——款式是内容属性，耳环确实没有 bangle 款式。但它是**静态 facet 计数的已知代价**（UX spec §3 已明确选择「静态计数、不随其他筛选联动」以避免选项抖动）。

这个取舍我认为是对的，但**必须在交付说明里显式写一句**，否则运营或客服看到 59% 的组合会报「筛选坏了」。可选缓解（本期不做）：品类与款式不相容时把该款式 checkbox 置为 disabled + 文案说明。**不建议本期做**——它把静态 facet 变成动态 facet，引入联动计算与抖动，且 59% 是「款式确实不适用」而非「逻辑错」。

---

## 5. 建议实施顺序

代码已被落地，`astro check` 已 0 errors，**实际待办只剩收尾**。按依赖排序：

| 步骤 | 内容 | 依赖 | 阻塞性 |
|---|---|---|---|
| 1 | ~~修 `FilterStyleGroups.astro` import 路径~~ | — | **已完成**（落地者在我审计期间自行修复） |
| 2 | `npm run build` 通过（内含 `astro check`，现0 errors） | 依赖 1 | **验收门禁，未验证** |
| 3 | `npm run test`（vitest，7 个测试文件） | 依赖 2 | **验收门禁，未验证**。已核实：`tests/content-contract.test.ts` **不断言 `style_tags`**，无需改测试。 |
| 4 | 实测回归：`NO_PROXY=127.0.0.1,localhost` + `astro preview`，跑 7 个 Playwright 脚本（含落地者新增的 `verify-style-filter.mjs`；必须 `domcontentloaded + waitForTimeout(1200)`，禁 `networkidle`；`BASE_URL` 需做 URL 格式校验防PortableGit 污染） | 依赖 2 | **验收门禁，未验证** |
| 5 | 手工验证 4 个深链场景：`?style=bangle` / `?style=zodiac`（ghost，1 款）/ `?style=clover`（Motif 自动展开）/ `?style=bangle&style=cuff`（OR，604 款） | 依赖 2 | **验收门禁，未验证** |
| 6 | 删 `catalog.ts` L6 未使用 import（`priceRange`/`imageSrcset`/`lineToken`） | 无 | 非阻塞，清 ts6192 hint |
| 7 | 清理 `FilterStyleGroups.astro` L23-25 重复条件包裹 + `index.astro` L183-185 裸花括号（§4.3） | 无 | 非阻塞，纯可读性 |
| 8 | 交付说明补两条：① 静态计数导致 59% 款式×品类组合为 0 结果（§4.4）；② ghost 节点在 clear-all 后残留在 DOM，影响未来 localStorage 持久化设计（§3.2） | 依赖 4 | 非阻塞 |
| 9 | 可选：筛选态 URL 输出 `noindex,follow`（§3.3） | 依赖 2 | 非阻塞，可单独提 PR |

**已核实无需改动的项（省下三处工作量）：**

- `tests/content-contract.test.ts` 不涉及 `style_tags`/`SkuIndexItem`（已 grep 确认）
- `scripts/build-sku-index.mjs` 不引用 `SkuIndexItem` 字段（已 grep 确认）
- `src/components/rfq/dom.ts` 与 `search/SearchDialog.astro` 只读 `__SKU_INDEX__` 的既有字段，`styles` 是纯新增字段，不影响它们

---

## 6. 自检报告

| 检查项 | 结果 |
|---|---|
| 未修改任何 `src/` / `scripts/` 文件 | 通过（`git status` 与开工时一致，唯一新增是我自己的 docs 文件） |
| emoji 扫描（`src/components/product/`、`src/lib/products/`、`src/pages/products/`） | 0 匹配 |
| 硬编码颜色 | 0 处。新增样式全部走 `text-fg` / `text-fg-2` / `text-meta` / `accent-[var(--color-accent)]` token |
| 动态拼接 Tailwind 类 | 0 处。全为完整字面量；`group-open:rotate-180` 是既有项目模式（`Header.astro:120`、`faq/index.astro:46` 已用） |
| 单文件 ≤ 300 行 | 258 / 103 / 85 / 57，全部合规 |
| 图标源 | 仅 `astro-icon` + `lucide:chevron-down`，与既有单一图标源一致（CO-6），无第二图标源 |
| 类型检查 | **0 errors / 0 warnings / 5 hints**（93 文件）。hints 含 3 处既有 `z.string().email()` deprecated 与 1 处 `catalog.ts` L6 `ts6192` |
| 未验证 | `npm run build` / `npm run test` / Playwright 实测**均未执行**（派单要求只读+ 不改代码，且构建会写 `dist/`） |

---

## 7. 失效模式自检（6 类）

| # | 失效模式 | 检查结果 |
|---|---|---|
| 1 | Happy-path 偏差 | 已覆盖。OR / ghost / 深链强制展开 / 移动端全展开四条非happy 路径均有显式分支（§3.2、§1）。 |
| 2 | 沉默逻辑错误 | **本需求最大风险已核查**：OR vs AND（实测 53/55 双选组合在 AND 下会是0 结果，§1）、空数组 `.some()` 返回 false（111 款无款式产品被正确排除）、ghost 残留（§3.2，已记录为非缺陷）。**未发现算错。** |
| 3 | 幻觉依赖 | 无新增依赖。全部用既有 `astro-icon` / Tailwind token / 原生 `<details>`（项目已在 Header/FAQ 用了同一模式）。 |
| 4 | 缺失系统上下文 | `STYLE_MIN_COUNT = 5` 写成常量（`styles.ts` L9），款式补货到过线时选项自动出现，无需改代码。`NO_PROXY` /禁 `networkidle` / `BASE_URL` PortableGit 污染三个本地测试陷阱已在§5 步骤 4 列出。 |
| 5 | 性能盲区 | 客户端每次 `render()` 对 1012 条做 `.some()`，每条平均 1.13 个tag（约 0.05ms），可忽略。构建期计数 1012 次迭代，一次性。无 N+1、无循环内 IO。体积见 §4.1。 |
| 6 | 静默缺失 | **`catalog.ts` L6 未使用 import 是典型静默缺失**（`ts6192` 归入 hint，不阻塞 build 但持续污染 check 输出）。已列为 §5 步骤 6。其余 import 齐备，`FilterStyleGroups.astro` 标签配平已逐行核对。 |