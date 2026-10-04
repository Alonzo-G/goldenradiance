# ADR-011: v2 演进边界设计 —— 保护选型的四个解耦点

## Status

Accepted (2026-10-01)

## Background

Phase 1 明确不做会员体系、不做在线支付、不做下单商城（PRD §1，ARCHITECTURE.md §10.1）。但客户要求产品能「长期演进」到 v2 的「会员批发价 + 下单」形态。

静态优先架构的一个常见批评是「将来要动态化会很痛」。本 ADR 的目的就是把这个批评量化并主动消除：通过四个具体的解耦点设计，让 v2 需要的变更落在局部而非全局。

## Decision

在 Phase 1 实现中**现在就**建立以下四个解耦点。它们的共同特征是：不增加 MVP 的功能范围，但约束了代码的组织方式。

### 解耦点 1：内容源与渲染层（Content Layer Loader）

产品数据的读取统一走 `src/lib/products/queries.ts` 暴露的查询函数，**页面组件不直接 import 单个 `.md` 文件路径，也不直接调用 `getRawData`**。

价值：v2 若接 Headless CMS 或引入数据库，**只需替换 loader 与 `queries.ts` 的实现，页面代码完全不动**。这是 Content Layer 抽 Loader 的最大价值，必须在 Phase 1 就兑现，否则后期会有几十个页面要改。

### 解耦点 2：价格展示层与价格数据源

产品页的**展示层不得硬编码任何价格数字**，一律通过 `src/lib/products/pricing.ts` 的纯函数从内容数据推导。

理由：v2 的会员批发价意味着「同一 SKU 对不同用户显示不同价格」。这是唯一一处会迫使 SKU 页从静态走向 SSR / 边缘个性化的变更点。把价格隔离成单一函数后，v2 的改动范围是：

```
现在:  pricing.ts → 从 content 读 PublicTier
v2:    pricing.ts → 从 content 读 PublicTier + 从请求会话读 MemberTier
       SKU 页 prerender=false（仅会员可见时）
```

**禁止**在多个地方写 `{tier[0].price}` 这类直接取用。

### 解耦点 3：数据访问与业务逻辑（Worker 侧）

Worker 的业务逻辑不得直接写 SQL。所有 D1 访问集中在 `worker/lib/db.ts`，业务函数在 `worker/routes/*.ts`。

价值：若未来 D1 不能满足需求需迁到 Postgres / Supabase，改动收敛在 `db.ts`。同时这也是 2026 年 D1 之外仍保留 Postgres 可能性的唯一成本。

### 解耦点 4：路由结构稳定性

`/product-lines/{line}/` 与 `/products/{sku}/` 的 URL 结构 **现在就按 PRD §12.3 锁定**，且语言前缀（ADR-004）现在就在位。

理由：URL 是 SEO 资产中最难迁移的一类。若 v2 才引入语言前缀或更换产品路径，所有已积累的外链与索引价值都要经历一次 301 迁移损耗。现在做是零成本，将来做是资产损失。

## Consequences

### 正面

- v2 的六类变更中，**CMS 接入、新增语言、新增产品线、会员价格**这四类都不触碰渲染层。
- 迁移成本被转化为可预测的、局部的工作量，而非推倒重来。
- 这些约束本身几乎不给 MVP 增加代码量（几个文件的组织约定而已），性价比很高。

### 负面

- 增加了少量间接层（一个 queries 模块、一个 pricing 模块），MVP 阶段看起来略有过度抽象之嫌。这是有意为之的成本前置。
- 需要把这几条写进 Spec 并对实现做审查，否则生成式实现倾向于「怎么短怎么写」，直接跳过间接层。

### 诚实披露：唯一会痛的变更

**实时库存与实时报价**是现有架构唯一无法低成本承接的需求（ARCHITECTURE.md §13 标为「高」）。它需要 SKU 页从静态改为按需渲染，且依赖工厂侧的实时数据源——而客户**没有自有工厂**，这个需求在业务上也不成立。

因此产品页 Phase 1 **不展示库存数字**，改为 "Availability confirmed with your RFQ"（见 ARCHITECTURE.md §10.3 W-7）。这是诚实设计，也恰好是符合 PRD §13.6 禁用无实证宣称的最佳表达。

## v2 承接矩阵

| v2 需求 | 承接方式 | 依赖的解耦点 | 迁移成本 |
|---|---|---|---|
| 会员登录 + 会员批发价 | Worker 加会话（Cloudflare 原生能力或第三方），替换 pricing 数据源 | 解耦点 2、3 | 中 |
| 在线下单 | D1 已有 `rfq_items`，加 `orders` / `order_items` | 解耦点 3 | 中 |
| 管理后台 | 同云同平台加 Worker + Admin SPA，不换栈 | 解耦点 3 | 中 |
| Headless CMS | 替换 Content Layer loader | 解耦点 1 | **低** |
| 新增语言至 5 种 | i18n 字典 + 按 locale 分目录 | 解耦点 4 | **低** |
| 新增产品线 | 内容目录 + 一个 token | 解耦点 1、4 | **低** |
| 实时库存 / 实时报价 | 需 SKU 页改按需渲染 + 外部实时数据源 | — | **高**（Phase 1 不需要，且客户无工厂使其业务上不成立） |

## Alternatives Considered

| 方案 | 否决理由 |
|---|---|
| Phase 1 直接按最简方式写死，v2 再重构 | 违反「规格即契约」里的澄清策略：后期 paying down url 重构几乎必然发生。已知会来的变更，就该现在留接口 |
| Phase 1 直接上全动态架构（SSR），省去后期迁移 | 违反 ADR-001 的核心论证。为尚未出现的需求牺牲当前最关键的 SEO 与性能资产，是错误的时序判断 |
| Phase 1 就引入会员表的空壳 | 范围蔓延。表结构为空、无任何流量的会员体系只会增加理解成本 |

## Related ADRs

ADR-001（采用 Astro）、ADR-003（内容源）、ADR-006（RFQ 后端）、ADR-009（客户端状态）
