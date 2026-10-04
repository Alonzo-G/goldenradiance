# ADR-010: 样式采用 Tailwind CSS v4 + design tokens 双层消费

## Status

Accepted (2026-10-01)

## Background

设计侧已产出 `docs/design-tokens.json`（符合 W3C DTCG 格式，含 `$meta` / `color` / `font` / `space` / `radius` / `elevation` / `motion` / `zIndex` / `container` / `sectionY` / `icon` / `touchTarget` / `breakpoint`），并在 `docs/UIUX.md` §9.3 给出了一份 `:root` CSS 变量写法、在 §4.3 给出了可直接粘贴的 Tailwind theme 扩展片段。

设计侧建议的交付形态是：**`import tokens from './design-tokens.json'` + CSS 变量双层消费**。本 ADR 采纳该建议，并确定具体的技术落地方式与硬约束。

## Decision

采用 **Tailwind CSS 4.3.3**（npm latest，2026-10-01 核实）作为样式方案，按以下**双层消费**结构对接 tokens：

```
docs/design-tokens.json        （DTCG，设计侧单一真源，不改）
        │
        ├─► CSS 变量层          src/styles/tokens.css
        │     :root { --color-brand-600: #...; }
        │     价值：运行时可覆盖、可做暗色模式、design tokens 语义可被 devtools 检视
        │
        └─► Tailwind theme 层    src/styles/global.css，用 @theme 消费上述变量
              @theme inline { --color-brand-600: var(--color-brand-600); }
              价值：获得 bg-brand-600 / text-brand-600 等工具类
```

### 为什么采纳 Tailwind 而不是纯 CSS Modules / vanilla CSS

1. **设计侧已备好 theme 片段**：UIUX §4.3 的 theme 扩展可直接粘贴，省一层转换成本。
2. **约束内嵌**：Tailwind 的 `space-*`、`size-*`、`text-*` 天然把取值限制在 tokens 提供的刻度上，从机制上防止「凭手感写 `#3a7bd5`」这类 token 漂移。这对无专职设计维护的 SOHO 项目价值很高。
3. **产物体积小**：v4 的 Oxide 引擎按需生成，未使用的类不进产物，契合本站的性能预算。
4. **与 Lucide 图标的 `size-*` 用法一致**（ADR-008 已要求图标尺寸走 `size-*`）。

### Tailwind v4 的关键用法

v4 采用 **CSS-first 配置**，不再需要 `tailwind.config.js`。推荐形式：

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme inline {
  --color-brand-50:  var(--color-brand-50);
  --color-brand-600: var(--color-brand-600);
  --font-sans:       var(--font-sans);
  --radius-md:       var(--radius-md);
  /* 其余按 UIUX §4.3 粘贴 */
}
```

::: warning（给实现者的硬约束，不是提示）
所有我在文档里见到的 Tailwind 配置文件 (`tailwind.config.js`) 写法都**不适用于 v4**。如果生成式实现试图创建 `tailwind.config.js`，那是幻觉——v4 的配置写在 CSS 里。这一点在本次调研中确认。
:::

## Consequences

### 正面

- 设计 tokens 与实现之间只有一处转换（JSON → CSS 变量），人工维护面最小。
- 运行时可通过覆盖 CSS 变量实现主题切换，为未来的暗色模式留了口子（虽然 Phase 1 明确不做，见 ARCHITECTURE.md §10.1 NO-12）。
- 工具类刻度受 tokens 约束，视觉一致性由机制保障而非靠自觉。

### 负面

- 存在一层「tokens.json → CSS 变量」的同步成本。token 变更后需重新生成 `tokens.css`。**缓解**：用一个小的生成脚本 (`scripts/gen-tokens.mjs`) 从 `design-tokens.json` 产出 `tokens.css`，纳入 CI 并检查产物 diff，禁止手工编辑 `tokens.css`。
- HTML 类名较长，可读性不如语义化 class name。这是 Tailwind 的固有取舍。
- v4 相对 v3 有破坏性变更（`tailwind.config.js` 被 CSS-first 配置取代），大量既有教程与 LLM 记忆停留在 v3，存在较高的幻觉风险。

### 硬约束

1. **`tokens.css` 由脚本生成，禁止手工编辑**，CI 检查 diff。
2. 实现必须使用 **Tailwind v4 的 CSS-first 配置**，禁止创建 `tailwind.config.js`。
3. 颜色、间距、圆角、字号一律走 tokens 暴露的工具类，**禁止硬编码色值**（包括 `bg-[#xxxxxx]` 任意值语法，除非设计师明确书面同意）。
4. 中文字体引用受 ADR-004 / ARCHITECTURE.md §10.2 的路由级加载约束管辖，不得在 `global.css` 中全量 `@font-face`。

## Alternatives Considered

| 方案 | 否决理由 |
|---|---|
| 纯 vanilla CSS + CSS Modules | 失去 tokens 刻度的机制性约束；无设计维护者的项目更容易产生视觉漂移 |
| CSS-in-JS（Panda / stitches） | 引入运行时或额外构建步骤，与「0 KB JS」预算冲突 |
| UnoCSS | 能力相近，但与设计侧已备好的 Tailwind theme 片段不直接兼容，多一层转换 |
| Tailwind v3 | 落后一个大版本；配置方式不同，与设计侧的 v4 片段不兼容 |

## Related ADRs

ADR-001（采用 Astro）、ADR-004（多语言与字体加载）、ADR-008（图标尺寸用 `size-*`）
