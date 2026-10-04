# ADR-008: 全项目图标库锁定为 Lucide（P0 团队规则落地）

## Status

Accepted (2026-10-01)

## Background

团队级 P0 绝对规则第 1 条要求：Spec 中必须锁定一套 SVG 图标库，全项目统一，**禁止混用**。第 2 条要求禁止使用 emoji 充当功能图标。本 ADR 负责把这条规则从「要求」落实为「可执行的技术约束」。

选型由架构师决定（本项目我这边的权限），但每个选择必须给出理由与对比矩阵。

## Decision

> **全项目唯一图标源：Lucide。通过 `astro-icon` 消费 `@iconify-json/lucide` 数据源。**
> **禁止引入任何其他图标包；禁止内联手写 `<svg>` 图标；禁止使用 emoji 充当功能图标。**

| 项 | 值 |
|---|---|
| 图标集 | **Lucide** |
| 消费组件包 | `astro-icon@1.2.0`（npm latest，2026-10-01 核实） |
| 数据源包 | `@iconify-json/lucide@1.2.138`（npm latest，2026-10-01 核实） |
| 用法 | `<Icon name="lucide:shopping-bag" />` |

### 对比矩阵

| 候选 | 图标数量级 | 风格一致性 | tree-shaking | 结论 |
|---|---|---|---|---|
| **Lucide** | 1600+ | **极高**（统一 24px 网格、2px 描边） | 好（按需内联单个 path） | **采用** |
| Phosphor | 9000+ | 中（6 种权重混用易乱） | 好 | 否决：多权重反而诱发全项目风格不一致 |
| Heroicons | 300+（solid / outline） | 高 | 好 | 否决：数量偏少，本站高频的物流/合规/工业类图标缺失较多 |
| Tabler | 5900+ | 高 | 好 | 合格次选。落选理由是 Lucide 在本项目的**语义适配度**更高 |

### 决定性理由：语义适配度而非图标数量

本项目是饰品 B2B 外贸站，以下图标会在项目中高频出现且 Lucide 的语义刻画最精确：

| 图标名 | 用途 |
|---|---|
| `lucide:gem` | 天然石 / 人造宝石产品线 |
| `lucide:package` | MOQ / 起订量、混款 |
| `lucide:shield-check` | 合规、镍释放测试通过（本站信任体系核心） |
| `lucide:file-check` | 第三方检测报告可核验 |
| `lucide:ship` | FOB / CIF / DDP 物流条款 |
| `lucide:flask-conical` | EN 12472 镀层磨损测试 |

这一脉zhěngtĭ适配是 Tabler 具备相近数量时仍落选的原因。

### 为什么用 `astro-icon` 而不是 `lucide-react`

`lucide-react`（已核实最新版本为 1.49.0）是 React 组件形式，引入它需要 React 运行时参与 hydration。而 `astro-icon@1.2.0` 在**构建期**把单个图标的 path 内联进 HTML，不产生运行时 JS、不产生额外网络请求。这与 ADR-001「默认 0 KB 框架 JS」的预算直接相关，在这个项目里是硬性理由而非偏好。

## Consequences

### 正面

- 单一图标源，视觉风格零漂移风险，P0 规则得到技术层面的强制保障。
- 构建期内联，零运行时开销、零额外网络请求。
- tree-shaking 有效，只打包实际用到的图标 path。
- 违规**可被 grep 拦截**（见 ARCHITECTURE.md §12.10），可自动化检查而非靠自觉。

### 负面

- Lucide 图标数量少于 Phosphor / Tabler，极个别需求（如特定工业认证图标）可能无对应项。
- 若未来需要多权重（regular / bold）表达层级，Lucide 不提供，需要通过尺寸与颜色区分——这与 design tokens 的用法一致，可接受。

### 硬约束（违反即退回）

1. 禁止 emoji 作为功能图标（`🛒 加入询价篮` 属违规）。
2. 禁止手写 `<svg>` 图标。
3. 禁止引入第二个图标包（含 Heroicons、Phosphor、FontAwesome 及任何 `@ lucide-react` 形式的 React 图标组件）。
4. 图标尺寸一律走 Tailwind `size-*`，**不准**在 `<Icon>` 上硬编码 `width` / `height`（会绕过 design tokens）。
5. 每张交互性图标必须配 `aria-hidden="true"` + `.sr-only` 文本，或 `aria-label`。

## Alternatives Considered

见上文对比矩阵。补充一点：曾考虑「全项目手写 SVG symbol sprite」，但那会把维护成本转移给无技术背景的客户，且无法保证风格一致，直接否决。

## Related ADRs

ADR-001（采用 Astro）、ADR-010（Tailwind 样式方案）
