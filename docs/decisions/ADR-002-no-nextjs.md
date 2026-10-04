# ADR-002: 否决 Next.js 16 App Router，尽管它是最接近的次优选项

## Status

Accepted (2026-10-01)

## Background

Next.js 是本项目最有力的竞争候选。它在 MVP 技术选型基线矩阵中列为内容站首选，社区资源最丰富，团队最可能熟悉。因此否决它需要比否决其他候选更强的论证，而不应止于「Astro 更适合内容站」这类模糊判断。

调研时核实到的版本事实（2026-10-01，npm registry）：

- **Next.js 16.3.8** 为 Active LTS（`latest` dist-tag）
- **Next.js 15.5.27** 为 Maintenance LTS（`backport` dist-tag）
- 团队初始调研简报假设主线为 15.x，**该假设已过时**；若选 Next.js，必须按 16.x 的 App Router API 编写。

## Decision

**不采用 Next.js。** 理由如下，按重要性递减。

### 1. 为 5% 的需求购买 100% 的复杂度

Next.js 的核心优势区是全栈能力：Server Actions、中间件、Route Handlers、PPR、`use cache`。本站 Phase 1 唯一的服务端逻辑是一个 RFQ 提交接口和一个 newsletter 订阅接口。

而本站明确**不做**在线支付、不做会员商城、不做实时库存、不做服务端个性化定价（见 PRD §1 与 ARCHITECTURE.md §10.1）。也就是说，Next.js 最有价值的那部分能力，在本项目中全部处于封冻状态。

结论：为一个 Cloudflare Worker 就能承担的职责，引入一个常驻 Node 运行时及其部署运维面，是过度设计。

### 2. 自托管 SSG / ISR 存在已知安全面（与客户处境直接冲突）

Next.js 2026 年 9 月安全公告（2026-09-30）披露的多条中危漏洞，命中「低成本、可能自托管」这一客户画像：

| CVE / GHSA | 内容 | 命中条件 |
|---|---|---|
| CVE-2026-94543 | 自托管 SSG / ISR 页面缓存投毒，一个路由的内容可被替换到另一个路由，直到 revalidate 前所有访问者都看到错误页面 | 自托管 + Pages Router；**部署在 Vercel 上不受影响** |
| CVE-2026-94484 | 根级 catch-all 页面叠加静态 / ISR 路由时，单个未认证请求可污染共享响应缓存 | 自托管静态 / ISR |
| GHSA-h694-7cp9-m8p3 | `use cache` 函数调用另一个读取 root param 的 `use cache` 函数时，外层缓存键遗漏该 param，导致跨 param 值内容泄漏 | 启用 Cache Components |
| CVE-2026-94485 | webpack 构建的 App Router metadata image 路由忽略 `dynamicParams`，攻击者可为 `generateStaticParams()` 排除的动态段请求 OG 图 | webpack 构建；**Turbopack 构建不受影响** |

这些都不是「未来可能的假设风险」，而是当前真实存在的、且专门针对**自托管静态 / ISR 部署形态**的漏洞面。本项目的客户是无人维护技术栈的 SOHO，让其在「升级 Next.js 补丁」这条路上长期承担风险，是不负责任的架构建议。

补充事实：该次公告原计划修复 9 条，实际发布 7 条，另有 1 条 critical 与 1 条 high 仍待上游依赖协调、无预计日期。这意味着未来还有强制升级动作。

### 3. 图片优化器 SSRF 面

CVE-2026-94483（High）：Image Optimization 中的 SSRF——若配置了 `images.remotePatterns`，攻击者控制的、匹配白名单的远端 URL 可诱导服务器访问私有 IP 段。

本站大量使用外源或半受管的产品图，属于该配置容易被启用的场景。虽然可以通过不配置 `remotePatterns` 规避，但那意味着放弃远端图片优化，与本站图片密集的现实相悖。

### 4. 成本结构

Next.js 在 Vercel 上体验最佳，但那把客户锁定为一个有月费上限平台的依赖；自托管则把 Node 进程、反向代理、缓存层的运维交还给客户。两条路与客户「无专业技术团队」的前提都有摩擦。

### 5. SEO 与静态性：Next.js 不占优，只是打平

必须公平指出：Next.js 的 App Router 在 SSG 模式下可以达到与 Astro 同等的静态 HTML 输出，本矩阵中 SEO 一项给 4 分而非更低，是考虑到其配置复杂度更高、更容易被误配成动态渲染。**否决 Next.js 的理由不是它做不好 SEO，而是它在不占优的前提下带来了更高的复杂度与安全面。**

同理，Nuxt 4 / SvelteKit 在 SEO 维度同样得 5 分，是合格替代；它们未被选中的理由见 ARCHITECTURE.md §3.2 E。

## Consequences

### 正面

- 避免了 Node 运行时、evergreen 安全补丁、自托管缓存正确性的长期负担。
- 团队成员若后续接触 Next.js 项目，需要区分「本项目不用 Next.js」与「Next.js 不好」——后者不成立。

### 负面

- 放弃了 Next.js 生态中最丰富的参考实现与第三方库积累。
- 若 v2 明确要做会员体系 + 购物车 + 服务端个性化定价，Next.js 16 会成为有力候选，届时需要一次迁移。该成本已由 ADR-011 的边界设计（特别是价格展示层与数据源解耦）主动压低。

### 触发重新评估的条件

以下任一成立时，应重新评估 Next.js 16：

1. v2 确认为会员批发价 + 在线下单，且需要大量服务端渲染的个性化内容。
2. 客户明确接受 Vercel 平台依赖与其月费结构。
3. 出现明确的 Полноценный full-stack 需求（Server Actions 驱动的复杂后台管理系统）。

## Alternatives Considered

| 替代 | 结果 |
|---|---|
| Next.js 15.5.27（Maintenance LTS） | 否决。仅剩维护支持，新项目不应从 Maintenance LTS 起步 |
| Next.js 全站 SSR（放弃静态） | 否决。与 SEO 生死线直接冲突 |
| Astro 静态 + 独立 Next.js 服务 | 否决。为了一个 Worker 能做的事维护两套框架，是最坏的组合 |

## Related ADRs

ADR-001（采用 Astro）、ADR-005（Cloudflare 部署）、ADR-006（RFQ 后端）、ADR-011（v2 演进边界）
