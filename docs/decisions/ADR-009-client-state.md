# ADR-009: 客户端状态采用 Nanostores（含 persistent），非 React 自带状态

## Status

Accepted (2026-10-01)

## Background

设计侧提出两条必须支撑的运行时状态需求（docs/UIUX.md）：

1. **`ComplianceContext`**：Ship-to / Compliance-for 选择器（`eu_uk` / `us` / `middle_east`），选定后产品卡、目录筛选、PDP 的合规标签要联动。需要一个**跨页面的全局状态 + 持久化**。
2. **RFQ 询价篮**：必须**未登录可用**（localStorage key 严格为 `rfq_v1`）+ **跨标签页同步** + 未来登录后与后台合并。抽屉形态需要 focus trap + Esc + 焦点归还。

这两条叠加后有三个技术特征决定了选型：
- 状态要跨 island 边界共享（Header 的篮数量角标 与 PDP 的「加入询价篮」按钮是两个独立 island）。
- 状态要跨页面存活（静态站每次导航都是整页加载）。
- 状态要在 SSR/预渲染阶段有确定行为（Astro 默认 `output: 'static'`，没有服务端会话）。

## Decision

采用 **Nanostores** + **`@nanostores/persistent`**，作为全站唯一客户端状态方案。

```ts
// src/lib/rfq/store.ts
import { computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export const rfqItems = persistentAtom<RfqItem[]>('rfq_v1', [], {
  encode: JSON.stringify,
  decode: parseAndValidate,   // 必须校验，不能裸 JSON.parse（见下文约束）
  listen: true,               // 跨标签页同步，必开
});

export const rfqCount = computed(rfqItems, (items) =>
  items.reduce((n, i) => n + i.qty, 0),
);
```

```ts
// src/lib/compliance/store.ts
export const complianceContext = persistentAtom<ComplianceTarget>(
  'compliance_v1',
  'eu_uk',   // 默认值必须显式且确定，不得依赖 navigator.language（见约束）
  { encode: JSON.stringify, decode: parseAndValidate, listen: true },
);
```

### 版本

- `@nanostores/persistent@1.3.5`（npm latest，2026-10-01 核实）
- `nanostores`：由 persistent 的 peer 区间 `^0.9.0 || ^0.10.0 || ^0.11.0 || ^1.0.0` 确定，取区间内最新具体版本（建议 `^1.0.0`），安装时 `npm view nanostores version` 核实并写回 ARCHITECTURE.md §2。

### 为什么不是 Redux / Zustand / Jotai

1. **体积**：Nanostores 约 250 字节量级，其余方案在 x10~x40 区间。对一个以「默认 0 KB JS」为核心竞争力的站，这是第一考量。
2. **框架无关**：当前 island 用 React，但 Nanostores 的灵魂 across React / Preact / Vue / Svelte / vanilla。static 站不想把 island 实现锁在某个框架上。
3. **原生跨标签页同步**：`@nanostores/persistent` 的 `listen: true` 直接解决设计要求 #3 的「跨标签页同步」，无需自己写 `storage` 事件监听器——这类自写代码是典型的易漏分支区域。

## Consequences

### 正面

- 极小的体积开销，且只在真正有 island 的页面加载。
- 跨标签页同步由库原生提供，减少自写代码面。
- 与 Astro islands 模型契合：store 可以在 islands 之间共享，不需要 React Context provider 包裹整棵树。

### 负面

- 生态与调试工具不如 Redux DevTools 完善。
- 只有极低级别的抽象，复杂派生逻辑要自己写 `computed`。本站状态极其简单（两个 atom），可接受。
- localStorage 内容可被用户手工篡改，服务端**不得**信任来自客户端的 RFQ 数据——这也是 ADR-006 中要求服务端做完整 Zod 校验的原因之一。

### 硬约束（违反会产生水合失配或安全缺陷）

1. **`persistentAtom` 在 SSR / 预渲染阶段读不到 localStorage**。首次渲染必须使用默认值，**严禁**在 SSR 阶段触碰 `window` / `localStorage`。这是 Astro 静态渲染 + 客户端持久化最常见的水合失配来源。
2. **`ComplianceContext` 的默认值必须是确定值**（`eu_uk`），不得依赖 `navigator.language` 或 `Accept-Language`。理由是同一份静态 HTML 会被多个locale 的用户共享 CDN 缓存，服务端无法区分；把 locale 判断放进 SSR 会导致 CDN 缓存串,9859 语言互相污染。正确做法是由**路由**决定（`/zh/` 路由给 zh 默认值），这是确定的。
3. **`decode` 必须做 schema 校验，不能裸 `JSON.parse`**。localStorage 是用户可写的，一旦被污染（或被旧版本遗留的脏数据污染），`.get()` 返回形状错误的对象会一路向下崩溃且难以定位。这是典型的沉默失效点。
4. **localStorage key 严格使用 `rfq_v1`**（设计稿约定），未来若结构升级则升到 `rfq_v2` 并写迁移逻辑，不改同一个 key 的结构。
5. RFQ 抽屉必须实现 focus trap + Esc 关闭 + 关闭后焦点归还触发元素。这是无障碍硬约束，不由状态方案自动提供。

## Alternatives Considered

| 方案 | 否决理由 |
|---|---|
| React Context + useState | 无法跨 island 边界共享，也无法跨页面存活 |
| Redux Toolkit | 体积偏大、boilerplate 重，且锁定 React；本站需求远未到需要它的量级 |
| Zustand | 体积与 API 都不错，但仍是 React 专属，且跨标签页同步需自行实现 persist 中间件 |
| Cookie 存储 | 会随每个请求回传，增大静态资产请求头；且 4KB 上限对 RFQ 篮偏紧 |
| 服务端会话 | Phase 1 无登录，与 ADR-001 的静态优先冲突 |

## Related ADRs

ADR-001（采用 Astro）、ADR-006（RFQ 后端）、ADR-011（v2 演进边界）
