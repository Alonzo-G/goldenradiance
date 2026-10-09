# Style Filter UX Spec — 款式（style_tags）筛选维度

- 范围：产品列表页 `/products/` 筛选侧栏（`src/pages/products/index.astro` L84-195 + `src/components/product/catalog.ts`）
- 输入事实：`style_tags` 填充率 901/1012（89%），手链 812/892 有值，13 个枚举值，数组多值
- 交付对象：`team-lead` + 前端落地者。本文档**不含任何 src/ 代码改动**，只给设计决策与可复制结构。
- 现有能力确认：`SkuIndexItem.styles: string[]` 已在 `src/lib/products/queries.ts:128` 存在，注释已写明"命中任一选中款式即通过（OR）"。数据层无需改动。

---

## 1. 现有模式认可（先说我同意什么）

**认可 material / plating 两组的隐藏处理是对的**，理由三条，款式组照此模式执行：

1. **填充率 0% 的 facet 不渲染**——渲染一个只有标题没有选项的 fieldset，比不渲染更糟：视觉上占据侧栏高度、给买家"这里有筛选但坏了"的错误暗示。款式组的门槛逻辑（见 §3）是同一条原则的参数化版本，不是例外。
2. **多值 facet 必须 OR**——`cuff+bangle` 243 款、`cable+bangle` 122 款都同时带两个 tag，证明这不是互斥分类。用 checkbox 不用 radio，语义 OR。这条已在数据层注释里定好，前端 `apply()` 只需 `it.styles?.some(s => styles.has(s))`。
3. **派生轴不独立成组的判断也成立**——Scenario 由 product line 映射派生，所以它是"产品线的商业化说法"而不是独立属性。当前保留它是对的（买家确实按"Daily wear / Fashion volume"下单），但它证明了一件事：**legend 的语义纯度比fieldset 的数量重要**。这一点直接决定了 §2 的方案。

---

## 2. Q1：Form / Motif 拆不拆？

### 决策：拆，但**不是两个平级顶层 fieldset**，而是「一个 Style 顶层 fieldset + 两个嵌套子 fieldset」，Motif 子组默认折叠。

```
Style                ← 顶层 fieldset，legend "Style"
├─ Form              ← 嵌套 fieldset，legend 次级样式，默认展开
│   bangle / cuff / cable / tennis / station
└─ Motif             ← 嵌套 fieldset，包在 <details> 里，默认折叠
    clover / flower / leaf / heart / cross / initial-letter
```

**理由 1 — 采购商的检索词单位就是这两层。** "我要麻绳手链" = Form:cable，"我要四叶草手链" = Form:任意 + Motif:clover。13 项平铺时，买家看到 `cuff` 和 `bangle` 并列根本不知道该点哪个（这正是 B2B 买家真实困惑点），必须先在心里做一次我们没帮他做的分类。分组把这个认知工作前置到 UI 层，且分组维度是**行业通用的**（Form / Motif 是欧美 jewellery 买手沟通里的标准词），不是我们发明的。

**理由 2 — 两组在数据上确实正交，UI 上就该正交。** 手链里 clover 56 + 项链 clover 45 = 101，但 clover 可以是 bangle 也可以是 cuff。如果做成一个 13 项的互斥单选组，就等于宣称"款式只能选一个"，直接和 `["cuff","bangle"]` 243 款的事实冲突。两组各自 checkbox、组内 OR、组间独立，是唯一和数据一致的建模。

**理由 3 — 拆成嵌套而不是平级，是为了省垂直空间。** 侧栏宽 240px，纵向是稀缺资源（§4 会算）。平级方案 = 2 个 legend + 2 组 gap-6；嵌套方案 = 1 个 legend + 1 个 helper + 2 个次级 legend。省下约 90px，且视觉上"款式"仍然是一个可被一眼扫到的模块。

**理由 4 — 折叠 Motif 而不是折叠 Form，有数据支撑。**

| | 命中产品数 | 占手链 892 的比例 |
|---|---|---|
| Form 五项合计（去重） | ~880 | ~99% |
| Motif 六项合计（去重） | ~206（手链） | ~23% |

Form 组是**必答题**（几乎每款手链都有 form），Motif 组是**选答题**（近八成手链没有 motif）。默认状态应该反映这个分布：Form 永远可见，Motif 需要时展开。

### 折叠的交互规范

用**原生 `<details>` / `<summary>`**，不用自造 accordion（不用 button + aria-expanded）。理由：原生自带键盘可达（Enter/Space 切换）、自带 `open` 属性可被 CSS 和 JS 直接读写、自带展开收起的内容可被无障碍树识别、不需要额外 ARIA 维护，也不会在 JS 未加载时变成打不开的死盒子。

| 项 | 规定 |
|---|---|
| 元素 | `<details class="group">` + `<summary>`内放标签文字 + 一个 `lucide:chevron-down` 图标 |
| 默认态 | **桌面**：Motif 折叠；**移动端**：全部展开（见 §6） |
| 触控目标 | `<summary>` 加 `min-h-11`，整行可点 |
| 箭头 | `lucide:chevron-down`，`size-4`，`text-meta`，`transition-transform duration-150 group-open:rotate-180` |
| 默认 marker | 必须隐藏：`list-none` + `[&::-webkit-details-marker]:hidden` + `[&::-marker]:hidden` |
| 焦点 | `<summary>` 是原生可聚焦元素，`:focus-visible` 走全局焦点环，不额外处理 |
| 语义 | `<summary>` 不得放交互元素（不放 checkbox），只放文字 + 图标 |
| **深链联动** | 若 URL 带 `?style=clover`（即该组内有 checked 项），**JS 必须强制 `details.open = true`**，否则会出现"chip 显示已选 Motif:clover，但侧栏里看不到该项"的矛盾 |
| 无 JS 降级 | `<details>` 原生可开可合，不降级 |

**次级 legend 样式**：`legend class="mb-2 text-xs font-medium text-fg-2"`（比顶层 legend 更实、更小），顶层保持现状 `legend class="caps mb-2 text-xs text-muted"`。这样两组在同一fieldset 内仍有清晰主次，不靠额外边框（禁止侧条纹边框 / 分隔线色块）。

---

## 3. Q2：数量门槛

### 决策：阈值 **≥ 5 个产品（跨全部品类统计）**。低于阈值不渲染 checkbox，但**深链仍然生效**。

按此阈值：

| 值 | 命中数 | 渲染？ |
|---|---|---|
| bangle | 604 | 是 |
| cuff | 365 | 是 |
| cable | 122 | 是 |
| tennis | 33 | 是 |
| station | 22 | 是 |
| **chain** | **3** | **否** |
| clover | 101 | 是 |
| flower | 50 | 是 |
| leaf | 28 | 是 |
| heart | 24 | 是 |
| **cross** | **7** | **是**（刚好过线） |
| initial-letter | 8 | 是 |
| **zodiac** | **1** | **否** |
| **number** | **1** | **否** |

渲染 11 项（Form 5 + Motif 6），砍掉 3 项。

### 理由：为什么是 5，以及为什么"隐藏"不等于"删除"

**门槛存在的理由 — 1 到 3 个产品的选项是负资产，不是长尾福利：**

1. **它会消耗一个 44px 的黄金触控位**，而侧栏纵向空间已经紧张（§4）。花一整行显示一个 1 款的结果，不如把这行给 `station`（22 款）。
2. **它会拉低整个侧栏的可信度。** 买家点开 Style 组看到 11 项里有 3 项点进去只出 1 个结果，会怀疑计数是不是坏的、"Only 1 style" 到底是不是库存限制。**一个筛选器的可信度是最小值决定的，不是最大值。**
3. **1 款的结果页几乎必然跳出。** 单卡网格页 + 无可比对象 + 无next step（无法做"同系列凑单"），买家要么关掉，要么直接发 RFQ 走人工——而 RFQ 场景里"只有星座款"这种信息本来就该写进询盘备注，不需要靠筛选器来发现。
4. **但 5 不是 10。** `cross` 只有 7 款（项链 6 + 手链 1），仍然过线——因为十字架是欧美批发商明确会下单的品类（复活节/圣诞季），7 款足够他确认"这个 motif 我们有在产"。反过来 `zodiac`/`number` 各 1 款，做成筛选入口不成立。

**阈值为什么必须写成常量而不是硬编码：**

```
STYLE_MIN_COUNT = 5
```

未来 `zodiac` 涨到 6 款时，选项**自动出现**，不需要改任何代码、不需要提新需求。这是把当前决策变成长期机制，而不是一次性判断。

**隐藏 ≠ 失效（重要）：**

`?style=zodiac` 这种 URL **必须仍然返回那1 个结果**，chips 区仍然显示 `Zodiac sign ×` 可移除。理由：

- 深链可能来自搜索引擎收录、买家收藏、或者同事转发。返回空页是"功能坏了"的观感，比"侧栏里没这个选项"严重得多。
- 侧栏没有 checkbox ≠ 这个值非法。数据在前端`__SKU_INDEX__` 里，过滤逻辑与 UI 渲染是两回事。
- 实现成本≈0：前端过滤读 URL values，checkbox 渲染读 `STYLE_MIN_COUNT`。两者本来就不该耦合。

### 计数显示：静态、显示在选项右侧

```html
<span class="tnum ml-auto shrink-0 text-xs text-meta">604</span>
```

- **静态计数，不随其他筛选联动。** 理由：动态 facet 计数需要前端每次全表重算，且会造成"选 Necklaces 后 tennis 变 0 → 选项突然消失"的抖动，反而让买家以为自己选错了。**保持计数稳定，让买家自己判断组合。** 这是明确的取舍，不是省事。
- 右侧数字用 `tnum`（等宽数字，与 `data-bulk-count` 一致）+ `text-meta`（三级信息，不与标签争夺注意力）+ `ml-auto`（推右对齐）。
- 屏幕阅读器读作 "Bangle 604"，无需额外 `aria-label`。

---

## 4. Q1/Q2 的高度账（为什么必须折叠）

现有侧栏实测高度（`<aside>` 已带 `lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto`，本来就是溢出滚动兜底）：

```
Product line   legend 22 + 2×44  = 110
Use case       legend 22 + 2×44  = 110
Product type   legend 22 + 4×44  = 198
MOQ band       legend 22 + 4×44  = 198
Compliance     legend 22 + 1×44  =  66
两个按钮                ≈         100
gap-6 间隙              6×24  =   144
                            小计 ≈ 926px
```

加 Style 组（顶层 legend 22 + helper 36 + Form 次级 legend 20 + 5×44 + Motif 折叠行 44 + 分隔 16）≈ **+362px → 约 1288px**。

1366×768 笔记本的可用高度 = `100vh - 6rem` = 672px。**结论：光靠 `overflow-y-auto` 兜底会让 Style 组落在首屏之外，等于白做。**

三个处置动作，按优先级：

1. **Motif 默认折叠**（已定）——省 6×44 + legend ≈ 284px。→ 约 1004px
2. **Style 组插在 Product type 之后、MOQ 之前**（品类"是什么" → 款式"什么样" → 起订量"怎么买" → 合规）。款式紧贴品类，买家视线从上往下走正好命中。→ 首屏可见 line / use case / product type / Style 的 Form
3. **推荐（强烈建议）：侧栏顶部加一个 Collapse all / Expand all 文本按钮**

   ```
   <button type="button" data-filters-collapse class="flex min-h-11 items-center text-xs text-accent hover:text-accent-hover">
   ```

   这是对"侧栏过长"的根本解法：把收起的权力交给买家自己（他们知道自己是来找麻绳的还是来看花的）。若前端不做，侧栏仍可用 `overflow-y-auto` 兜底，只是需要滚动 —— **不阻塞，但建议做**。折叠目标只含 Motif 子组；Compliance / MOQ 组维持展开（它们本来就短）。

**不采用**的做法：把 Form / Motif 整体做成折叠（等于把本次改动的核心藏起来）；把标签改成两列网格（240px 宽下每列约 110px，"initial-letter" 会折行，且触控目标间距掉到 8px 以下）。

---

## 5. Q3：13 个标签的最终英文文案

### 文案规则（三条，写下来供后续增补沿用）

1. **Sentence case，不是 Title Case。**首字母大写、其余小写。理由：与现有 `filter.scenario.daily = "Daily wear"`、`filter.moq.onRequest = "MOQ on request"` 一致；Title Case（"Bangle"" Open Cuff"）在批发目录里显得营销腔重，且 240px 侧栏里 Title Case 更占宽。例外：全大写缩写（MOQ）。
2. **slug 连字符不自动继承。** 判定规则：*slug 里的连字符只有在英文标准拼写中确实需要时才显示。* `initial-letter` → `Initial letter`（slug 产物，连字符无语义）；`four-leaf` → `Four-leaf clover`（英文标准写法就是带连字符的复合形容词）。这条规则解决了"内部值长什么样和买家看到什么"必须解耦的问题。
3. **checkbox 文案要短（≤ 16 字符），完整定义放helper / `aria-describedby`。** 理由：同一份文案会在 chips（`h-9 rounded-pill`）里复用，短文案在 pill 里不会溢出；`Personalised letter` 这类长文案只适合做定义不适合做标签。

### Form 组（结构 / 形态）

| slug | Checkbox 文案 | 一句话品类定义（helper / `aria-describedby`） |
|---|---|---|
| `bangle` | **Bangle** | "Closed rigid ring with no clasp — our highest-volume shape." |
| `cuff` | **Open cuff** | "Open-ended ring that slips straight on; usually a wider band." |
| `cable` | **Cable / rope** | "Braided steel cable or rope texture; reads casual and sporty." |
| `tennis` | **Tennis** | "A line of prong-set stones in a flexible band — the wedding line." |
| `station` | **Multi-station** | "Two or more motifs spaced along one chain; layered look in a single piece." |
| `chain` | **Chain** | "Interlocking oval links; the plainest base style."（阈值下不渲染，仅供 chip / 深链复用） |

**关于 `cuff` vs `bangle` —— 这是 Form 组唯一的真实歧义，必须解决。** 欧美买手日常口头区分是"closed bangle"和"open cuff"，所以 `Open cuff` 是对的（比裸 `Cuff` 信息量大，且不生造词）。同时在 Style 组 legend 下方放一行常驻 helper，只解释这一对：

```
Bangle is a closed ring; a cuff is open-ended and slips on without a clasp.
```

12px / `text-meta` / 约 3 行 / 240px 宽。这 8 个词是本次改动里性价比最高的一句文案 —— 它直接消解了 243 款 `cuff+bangle` 双标签产品的认知冲突。

### Motif 组（图案 / 母题）

| slug | Checkbox 文案 | 一句话品类定义 |
|---|---|---|
| `clover` | **Four-leaf clover** | "The motif we ship most across bracelets and necklaces." |
| `flower` | **Floral** | "Petal and bloom shapes; strong for ladies' and gift-basket programmes." |
| `leaf` | **Leaf** | "Botanical veins and blades; the understated unisex option." |
| `heart` | **Heart** | "The classic gifting motif; peaks before Valentine's Day." |
| `cross` | **Cross** | "Faith-led motif; demand is seasonal around Easter and December." |
| `initial-letter` | **Initial letter** | "Single letter charm or stamped initial — personalisation programmes." |
| `zodiac` | **Zodiac sign** | "Zodiac glyph charms for astrology collections."（不渲染，仅 chip / 深链复用） |
| `number` | **Number** | "Stamped numerals for birthday and milestone gifting."（不渲染，仅 chip / 深链复用） |

**关于 `initial-letter` —— 明确不选 "Personalised letter"。** 三个理由：
1. 标签要能对上数据值。采购商和我们在 RFQ 邮件里都会写 "initial letter bracelet"，用同一措辞减少沟通损耗。
2. "Personalised" 在欧美 B2B 里含义更宽（可指刻字、定制包装、定制配色），用在只表示"单字母"的标签上是**过度承诺**。
3. 长度。`Initial letter` = 14 字符，在 chip 里稳定；`Personalised letter` = 20 字符，移动端 chips 行会多占一行。
   → 折中：`Initial letter` 做标签，`personalisation programmes` 放定义里，语义信息不丢。

**关于用词来源**：以上全部采用欧美 jewellery 批发语境里的既有词（bangle / cuff / cable bracelet / tennis bracelet / multi-station / four-leaf clover / initial charm），**没有一个生造词**。`Floral` 用形容词而非 `Flower`——因为它涵盖 rose / lotus / daisy 等多种花型，写成 `Flower` 会让买家以为只有某一种花。

---

## 6. Q4：URL 深链

### 决策：**做。** `name="style"`，值用原始 slug，多选重复参数：`?category=bracelets&style=cable&style=clover`

**理由：**

1. **它满足数据层已定的前置条件。** 现有注释说 material/plating（自由文本）、band/scenario（值不稳定）不进深链——`style` 是**枚举、值稳定**，与已被放行的 `category`/`line` 同属一类。不需要新的例外论证。
2. **B2B 采购是多人协作，这是真实工作流不是想象。** 买家把"钢线 + 四叶草 + 项链"的筛选结果发给同事确认、或直接发给自己客户的销售页面——这是这个站点的核心使用场景之一。不可分享的筛选器等于把买家推回"逐个翻 892 张卡片"，也就是我们要解决的问题本身。
3. **改动量最小。** `initFromUrl()` 的白名单是数组 `['category', 'line']`，加一个 `'style'` 字符串；`apply()` 加一个条件；URL 写入侧`history.replaceState` 逻辑（L216-218）已存在且按 `params.append(f.axis, f.value)` 循环所有轴，**零改动**。
4. **chip 的label复用同一文案。** 加了深链就必须让 chip 显示得出来，`activeFilters()` 里加一个 `axis === 'style'` 分支走 `filter.style.*` i18n key（与现有 band / category / line / scenario 分支完全同构）。

**已知风险与对策（一并给出，不留隐患）：**

| 风险 | 对策 |
|---|---|
| 11 个 checkbox 组合产生大量低价值 URL，消耗 crawl budget | 筛选态 URL 加 `<meta name="robots" content="noindex,follow">`。纯一行、纯收益。**建议采纳（非阻塞）**。现有 category/line 深链也有同样问题，一并覆盖 |
| URL 值低于 `STYLE_MIN_COUNT`（`?style=zodiac`） | **仍然生效并出结果**，chip 可移除，只是不在侧栏渲染 checkbox。见 §3 |
| 恶意/手输的未知值（`?style=foobar`） | 前端过滤时对 `STYLE_MIN_COUNT` 无关，直接用 `styles.has()` 判定——未知值不匹配任何 `it.styles`，自然返回 0 结果 + 现有空状态。不需要额外校验代码 |
| 与 `?sku=` RFQ 深链共存 | 无冲突，两套参数互不干扰（`collectUtmParams` 只读 `utm_*`） |

---

## 7. 可直接落地的结构

### 7.1 Astro 侧：插在 Product type 之后（`index.astro` L148-159 之后、L160 之前）

```astro
{
  (styleForms.length > 0 || styleMotifs.length > 0) && (
    <fieldset class="border-0 p-0">
      <legend class="caps mb-2 text-xs text-muted">{t('filter.style')}</legend>

      {/* B2B 歧义消解：cuff vs bangle 是 Form 组唯一的真实困惑点，8 个词解决 243 款双标签产品的认知冲突 */}
      <p class="mb-3 text-xs text-meta">{t('filter.style.help')}</p>

      {/* Form（结构 / 形态）——默认展开，几乎每款手链都有 */}
      {styleForms.length > 0 && (
        <fieldset class="mb-4 border-0 p-0">
          <legend class="mb-2 text-xs font-medium text-fg-2">{t('filter.style.form')}</legend>
          {styleForms.map((s) => (
            <label class="flex min-h-11 items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                name="style"
                value={s.value}
                checked={preCheckedStyles.includes(s.value)}
                class="size-4 accent-[var(--color-accent)]"
                aria-describedby={`style-help-${s.value}`}
              />
              {t(`filter.style.${s.key}` as 'filter.style.bangle')}
              <span class="tnum ml-auto shrink-0 text-xs text-meta">{s.count}</span>
              <span id={`style-help-${s.value}`} class="sr-only">
                {t(`filter.style.${s.key}.help` as 'filter.style.bangle.help')}
              </span>
            </label>
          ))}
        </fieldset>
      )}

      {/* Motif（图案 / 母题）——默认折叠，仅约 23% 手链带 motif */}
      {styleMotifs.length > 0 && (
        <details class="group border-0 p-0" data-style-motif>
          <summary class="flex min-h-11 cursor-pointer list-none items-center justify-between text-xs font-medium text-fg-2 [&::-webkit-details-marker]:hidden [&::-marker]:hidden">
            <span>
              {t('filter.style.motif')}
              <span class="ml-1 font-normal text-meta">{styleMotifs.length}</span>
            </span>
            <Icon name="lucide:chevron-down" class="icon size-4 shrink-0 text-meta transition-transform duration-150 group-open:rotate-180" aria-hidden="true" />
          </summary>
          <fieldset class="mt-2 border-0 p-0">
            {styleMotifs.map((s) => (
              <label class="flex min-h-11 items-center gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  name="style"
                  value={s.value}
                  checked={preCheckedStyles.includes(s.value)}
                  class="size-4 accent-[var(--color-accent)]"
                  aria-describedby={`style-help-${s.value}`}
                />
                {t(`filter.style.${s.key}` as 'filter.style.bangle')}
                <span class="tnum ml-auto shrink-0 text-xs text-meta">{s.count}</span>
                <span id={`style-help-${s.value}`} class="sr-only">
                  {t(`filter.style.${s.key}.help` as 'filter.style.bangle.help')}
                </span>
              </label>
            ))}
          </fieldset>
        </details>
      )}
    </fieldset>
  )
}
```

**类名约定说明（全部沿用现有 token，无硬编码色值）：**
- `border-0 p-0` —嵌套 fieldset 默认有 UA 预设的border/padding，必须显式清零，否则出现双层框
- `text-fg` 标签正文 / `text-fg-2` 次级 legend / `text-meta` 计数与 helper / `text-xs text-xs` 12px
- `text-fg-2` 用于次级 legend 而非 `text-muted`——`text-muted` 已被顶层 legend 占用，两者需要主次分明
- `tnum` —等宽数字计数
- `size-4 accent-[var(--color-accent)]` —与现有 4 组 checkbox 完全一致
- `min-h-11` —44px 触控目标，5 组全部遵守
- 无 emoji、无渐变、无自造颜色

### 7.2 数据侧：Astro frontmatter 里的构建逻辑

```js
// 与 material/plating 同一模式：数据驱动 + 阈值过滤 + 无值不渲染空组
const STYLE_MIN_COUNT = 5;

// slug → i18n key 后缀：把连字符 slug 映射为 camelCase key
// （initial-letter → initialLetter），与 bandLabel/scenarioLabel 同构
const STYLE_KEY = {
  bangle: 'bangle',
  cuff: 'cuff',
  cable: 'cable',
  tennis: 'tennis',
  station: 'station',
  chain: 'chain',
  clover: 'clover',
  flower: 'flower',
  leaf: 'leaf',
  heart: 'heart',
  cross: 'cross',
  'initial-letter': 'initialLetter',
  zodiac: 'zodiac',
  number: 'number',
};

const FORM_TAGS = ['bangle', 'cuff', 'cable', 'tennis', 'station', 'chain'];
const MOTIF_TAGS = ['clover', 'flower', 'leaf', 'heart', 'cross', 'initial-letter', 'zodiac', 'number'];

// 跨全部品类统计（不是按品类），跨品类 motif 如 clover = 56 + 45 = 101
const styleCounts = new Map();
for (const it of allItems) {
  for (const s of it.styles ?? []) {
    styleCounts.set(s, (styleCounts.get(s) ?? 0) + 1);
  }
}

const buildGroup = (order) =>
  order
    .filter((tag) => (styleCounts.get(tag) ?? 0) >= STYLE_MIN_COUNT)
    .sort((a, b) => styleCounts.get(b) - styleCounts.get(a)) // 组内按数量降序，与 buyer 心智一致
    .map((value) => ({ value, key: STYLE_KEY[value], count: styleCounts.get(value) }));

const styleForms = buildGroup(FORM_TAGS);
const styleMotifs = buildGroup(MOTIF_TAGS);
```

**两条规则：**
- **组内按数量降序**（不按字母序）。买家从上往下扫，第一个是最主流的选择。`bangle` 604 应该排第一而不是被 `cable` 挤下去。
- **Form 组顺序保留业务优先序**而非纯数量序——因为 `bangle` 和 `cuff` 是最高频且最容易混淆的一对，必须相邻出现，`sort` 保持它们领先即可（604 / 365 本身就是前两位）。

### 7.3 前端过滤：`catalog.ts`

```js
// activeFilters(): 加一个分支，与 band/category/line/scenario 同构
: axis === 'style'
  ? t(`filter.style.${STYLE_KEY[cb.value]}` as 'filter.style.bangle')
  : cb.value;

// apply(): OR 语义（数据层注释已定）
const styles = by('style');
// ...
(!styles.size || (it.styles?.length > 0 && it.styles.some((s) => styles.has(s)))) &&

// initFromUrl(): 白名单加一个
for (const axis of ['category', 'line', 'style'] as const) { /* 现有逻辑不变 */ }

// 深链强制展开：URL 带 style 且该项在 Motif 组内 → details.open = true
// 否则会出现"chip 显示已选四叶草、侧栏却看不到该项"的矛盾
```

### 7.4 Chips 区

现有 `data-chips`（`h-9 rounded-pill border`）无需改结构，只需 `activeFilters()` 能给 style 返回文案。chip 文案与 checkbox 文案**完全一致**（`Four-leaf clover`），不做缩写。

---

## 8. i18n key 建议（`src/i18n/en.json`）

新增 `filter.style.*` 系列，共 **2 组标题 + 1 helper + 13 label + 13 help = 29 个 key**（与现有 `filter.*` 扁平点分风格一致）：

```jsonc
{
  "filter": {
    "style.help": "Bangle is a closed ring; a cuff is open-ended and slips on without a clasp.",
    "style.form": "Form",
    "style.motif": "Motif",

    "style.bangle": "Bangle",
    "style.bangle.help": "Closed rigid ring with no clasp — our highest-volume shape.",
    "style.cuff": "Open cuff",
    "style.cuff.help": "Open-ended ring that slips straight on; usually a wider band.",
    "style.cable": "Cable / rope",
    "style.cable.help": "Braided steel cable or rope texture; reads casual and sporty.",
    "style.tennis": "Tennis",
    "style.tennis.help": "A line of prong-set stones in a flexible band — the wedding line.",
    "style.station": "Multi-station",
    "style.station.help": "Two or more motifs spaced along one chain; layered look in a single piece.",
    "style.chain": "Chain",
    "style.chain.help": "Interlocking oval links; the plainest base style.",

    "style.clover": "Four-leaf clover",
    "style.clover.help": "The motif we ship most across bracelets and necklaces.",
    "style.flower": "Floral",
    "style.flower.help": "Petal and bloom shapes; strong for ladies' and gift-basket programmes.",
    "style.leaf": "Leaf",
    "style.leaf.help": "Botanical veins and blades; the understated unisex option.",
    "style.heart": "Heart",
    "style.heart.help": "The classic gifting motif; peaks before Valentine's Day.",
    "style.cross": "Cross",
    "style.cross.help": "Faith-led motif; demand is seasonal around Easter and December.",
    "style.initialLetter": "Initial letter",
    "style.initialLetter.help": "Single letter charm or stamped initial — personalisation programmes.",
    "style.zodiac": "Zodiac sign",
    "style.zodiac.help": "Zodiac glyph charms for astrology collections.",
    "style.number": "Number",
    "style.number.help": "Stamped numerals for birthday and milestone gifting."
  }
}
```

**key 扁平化而非嵌套对象的理由**：现有 `en.json` 的 `filter.*` 全部是扁平点分key（`filter.moq.onRequest` / `filter.scenario.daily`），`t()` 的取值路径与之一致。保持扁平，避免为这一个维度引入第二种结构。

> 注：§7.1 代码里的 `t(\`filter.style.${s.key}\`)` 对应扁平 key `filter.style.bangle`；`STYLE_KEY` 映射把 slug `initial-letter` 转成 `initialLetter`，拼出的就是 `filter.style.initialLetter`。顶层 legend 对应 `filter.style`。
>
> Motif 折叠标题右侧的选项数直接渲染 `styleMotifs.length`（不做 `{count}` 插值 key）—— 数字是构建期已知的静态值，多一个 i18n key 只是维护负担。

**key 命名注意：** `initialLetter` 用 **camelCase**，不用 `initial-letter` —— 与现有 `filter.moq.onRequest` 一致。i18n JSON 的 key 本身不该带连字符（后续若加 `de`/`fr` 翻译文件，camelCase key 与现有 `t()` 的取值路径更一致）。slug → key 的转换走 §7.2 的显式 `STYLE_KEY` 映射表，**不运行时 slugify** —— 显式表能在 key 拼错时立刻报错，运行时 slugify 会静默 fallback 到 key 字面量，把文案 bug 泄漏到线上。

---

## 9. 移动端 sheet 适配

现状：移动端是全屏筛选 sheet，与桌面**共用同一份 form**，通过 `data-filters-close` / `data-filters-open` 切换。

| 项 | 规定 |
|---|---|
| **折叠状态** | **移动端全部展开**（Motif 的 `<details>` 设 `open`）。理由：移动端 sheet 没有"侧栏滚出视口"的问题，折叠纯粹多一次无谓点击；且移动端是全屏宽度，11 项一屏放得下 |
| 实现方式 | 构建时不区分；前端按视口设一次：`matchMedia('(min-width: 1024px)').matches ? closed : open`。**不要用CSS 隐藏 checkbox** —— 那样屏幕阅读器和 Tab 顺序会与视觉不一致 |
| **布局** | **单列**，不两列。sheet 全屏宽下每项 44px + 8px 间距是可接受的，两列会让相邻触控目标间距掉到 8px 以下 |
| 滚动 | sheet 内部滚动区承载 11 + 现有 13 项。底部 `Apply filters`（`h-12`）保持常驻可见（`sticky bottom-0 bg-surface` + 顶部 `border-t border-border-soft`），不要让买家选完款还要滚到底才看得到结果数 |
| 结果数反馈 | `data-results-count`（h1 下方）在 sheet 内**不重复渲染**——sheet 打开时它在遮罩后面看不到。改由底部 Apply 按钮旁的实时计数承担：`Apply filters (37)`。已有 `filter.openFilters = "Filters ({count})"` 模式可复用 |
| **组顺序** | 与桌面完全一致（Product line → Use case → Product type → **Style** → MOQ → Compliance）。两处顺序不同会让买家在切换设备后重新定位 |
| 顶部提示 | sheet 顶部（`filter.title` 下方）加一行 `text-xs text-meta`：`11 styles · 2 groups` 或直接不加。**倾向不加**——11 项在 sheet 里一屏可见，加计数只是噪音 |
| **关闭行为** | 选中项立即反映到 chips 区但不自动关闭 sheet（现有行为不变）。**理由**：B2B 采购是多轮收敛（我要麻绳 → 再加四叶草），每选一项就关一次 sheet 是灾难性交互 |

---

## 10. 决策速查

| 问题 | 决策 |
|---|---|
| Q1分组 | 拆Form / Motif，**嵌套在单个 Style fieldset 内**；Motif 用 `<details>` 默认折叠；helper 常驻解释 cuff vs bangle |
| Q2 门槛 | **≥ 5 个产品（跨全部品类）**，砍掉 chain(3) / zodiac(1) / number(1)，保留 cross(7)。阈值写成 `STYLE_MIN_COUNT` 常量，低于阈值仍支持深链 |
| Q3 文案 | Sentence case；slug 连字符不自动继承；标签 ≤ 16 字符、定义走 `aria-describedby`；13 个最终文案见 §5 |
| Q4 深链 | **做**。`name="style"`，`?style=cable&style=clover`；白名单加 `'style'` 一处，`replaceState` 零改动 |
| 组位置 | Product type 之后、MOQ 之前 |
| 组内排序 | 按数量降序（bangle / cuff 天然领先） |
| 计数 | 静态计数，不随其他筛选联动（避免选项消失抖动） |
| 额外建议（非阻塞） | ① 侧栏 Collapse all / Expand all；② 筛选态 `noindex,follow` |

## 11. 已知不做（Out of Scope）

- 不改 `src/` 任何文件——由前端落地
- 不给低阈值选项做"按需展开显示全部"的入口。当前 11 项已在预算内，`?style=zodiac` 由深链覆盖。**若未来选项超过 16 项**，再讨论"Show all N styles"（届时用与 Motif 折叠同一套 `<details>` 模式）
- 不做款式图 preview / swatch。当前图片资产没有按 motif 归类，硬做会指向不存在的图
- 不改 Result 计数文案 `filter.results = "{count} SKUs"`