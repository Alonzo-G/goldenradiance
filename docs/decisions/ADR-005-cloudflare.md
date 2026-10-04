# ADR-005: 部署与运行时选择 Cloudflare（Workers + Assets + D1 + Turnstile）

## Status

Accepted (2026-10-01)

## Background

客户的硬前提是「无专业技术团队、无专职后端、长期持有成本要低」。因此运行时层的选择标准不是「能力最强」，而是：

1. 是否需要客户提供/how to maintain 服务器（OS、进程、补丁、监控）。
2. 月度持有成本在 MVP 量级下是否为零或接近零。
3. 能否在同一个平台内承接 v2 的会员批发价 + 下单需求，避免届时整体迁移。
4. 全球边缘分布（买家在美国、英国、德国及中东）。

## Decision

采用 **Cloudflare** 作为唯一部署与运行时平台：

| 能力 | 组件 | 版本 / 事实 |
|---|---|---|
| 静态资源托管 | Cloudflare Workers（静态 Assets） | 通过 `@astrojs/cloudflare@14.3.3` 部署 |
| 服务端逻辑 | Cloudflare Worker | 挂载 `/api/v1/*` |
| 可靠存储 | Cloudflare D1（SQLite @ edge） | 免费额度 500 万行读/日、10 万行写/日、5 GB 存 |
| 图片归档 | Cloudflare R2 | 免费 10 GB，出水带宽零费用 |
| 反垃圾 | Cloudflare Turnstile | **免费且无使用上限** |
| 邮件发送 | Resend（第三方 API） | `resend@6.31.0` |
| 部署 CLI | wrangler | `^4.125.0`（adapter peer 要求） |

关键选型事实（2026-10-01 核实）：

- **Workers Free**：10 万请求/日（UTC 00:00 重置，超限返 429）、单次 10ms CPU、128 MB 内存。
- **D1 Free**：500 万行读/日、10 万行写/日、单库上限 500 MB、总计 5 GB、10 个数据库、7 天 Time Travel。
- **Turnstile Free**：无任何使用上限。对照 reCAPTCHA，其免费额度已降至 **10,000 次/月**（Google Cloud 组织内跨所有站点累计），Premium 档为 10,001-100,000 次收费 $8 起步。**对一个面向欧盟的市场而言，Turnstile 的隐私姿态更好（不向 Google 传输用户数据）且成本更低**，这一项是压倒性的。
- **R2 Free**：10 GB 存储，出水带宽永久零费用。

## Consequences

### 正面

- **零服务器运维**：无 OS、无进程管理、无安全补丁、无容量规划。
- **MVP 月度成本接近零**：RFQ 提交量远低于 Workers 10 万/日；静态资产带宽免费。
- **全球边缘分发**：Cloudflare 覆盖 330+ 城市，对分散在美英德中东的买家而言 TTFB 一致性好。
- **v2 路径清晰**：会员鉴权、会话、订单表可以全部在同一账户同一平台上补齐，无需换栈（见 ADR-011）。
- **Turnstile 与 WAF、速率限制同账户联动**，无需额外的 Bot 防护采购。

### 负面

- **免费额度有硬边界，且超限是静默失败的**：Workers 超限直接返 429，D1 超限操作报错。**不配置用量告警的话，超额会表现为「询盘静默丢失」——这是本项目最危险的一类故障。**已在 ARCHITECTURE.md §10.3 W-5 列为必需的配置项。
- 供应商锁定：D1 是 SQLite 方言，迁移到 Postgres 需改写 DDL 与部分查询。缓解措施是业务逻辑（worker/lib）与数据访问（worker/lib/db.ts）分离。
- Workers 环境不是完整 Node：部分 npm 包依赖 Node 内建模块会失败。选依赖时需验证 workerd 兼容性。
- 单次 10ms CPU 预算较紧，不能在同一请求里串行做重活（RFQ 流程已把邮件发送放入 `ctx.waitUntil()` 异步执行以规避）。

### 必需的运维动作（不能省）

1. 配置 Workers / D1 用量告警（80% 阈值）。
2. 为 `production` 与 `preview` 配置独立 D1 数据库，避免预览环境污染真实询盘数据。
3. Turnstile widget 需显式注册**每一个** hostname（含 localhost、预览域名、生产域名），漏注册会导致 widget 静默不渲染。

## Alternatives Considered

| 方案 | 否决理由 |
|---|---|
| Vercel | Next.js 最佳宿主，但本站不用 Next.js；且把 Cloudflare 静态站的边际收益让给一个月费平台缺乏理由（见 ADR-002） |
| Netlify（`@astrojs/netlify@8.2.6`） | 合格替代，Forms 功能开箱即用。否决理由：Netlify 构建额度（免费 100 GB-hours 量级）与带宽限制在图片密集站上更早触顶；且站点表象之外的 D1 类同源存储能力弱，v2 演进时会走到 Cloudflare 或 Supabase，多一次迁移 |
| Supabase（作为主平台） | Postgres 能力强，是 v2 的合格候选。但 Phase 1 只有 RFQ 一个对象，引入完整 Postgres + RLS 学习面是过度设计 |
| Docker + 云服务器（¥50-200/月） | 违反「无技术团队」前提，需客户维护 OS/补丁/备份 |
| Cloudflare Pages（旧形态） | 已被 Workers 静态 Assets 形态吸收，新项目应直接用 Workers |

## Related ADRs

ADR-001（采用 Astro）、ADR-006（RFQ 后端）、ADR-011（v2 演进边界）
