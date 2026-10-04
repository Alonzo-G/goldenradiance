# ADR-001: 使用 Astro 7.3.5 静态优先作为本站渲染框架

## Status

Accepted (2026-10-01)

## Background

本项目是一个面向全球市场的饰品 B2B 外贸官网，首要目标是通过 SEO / 自然流量获取海外批发买家的 RFQ 询盘，而非在线交易。客户为纯贸易公司 / SOHO 起步，无专业技术团队、无专职后端约束下的长期演进需求。

由此产生三条互相强化的硬约束：

1. **SEO 是生死线**。产品页必须被搜索引擎完整抓取到标题、规格、结构化数据，且不能依赖客户端 JS 执行。
2. **图片密集 + 首屏性能**。千级 SKU × 每 SKU 多图，图片既是转化核心也是 Core Web Vitals 的头号杀手。
3. **零运维**。客户无法承担服务器维护、数据库运维、插件安全更新等长期成本，但项目需要能演进到 v2 的会员批发价 + 下单形态。

候选评估范围：Astro 7.3.5（静态优先）、Next.js 16.3.8 App Router（SSG+ISR）、WordPress + WooCommerce + WPML、Shopify B2B、Nuxt 4 / SvelteKit。对比矩阵与加权评分见 `docs/ARCHITECTURE.md` §3。

## Decision

采用 **Astro 7.3.5** 作为渲染框架，以**静态优先（`output: 'static'`）**为默认渲染策略：

- 全站（含全部语言版本）在 `astro build` 时预渲染为静态 HTML。
- 仅 RFQ 抽屉、搜索对话框两处交互使用 island 局部 hydration，其余部分向浏览器发送零框架 JS。
- 唯一的服务端逻辑（RFQ / newsletter 提交）放在同源的 Cloudflare Worker 上，不由 Astro 承担。

关键理由：

1. **SEO 层面无短板**：产物为带完整 `<title>`/`<meta>`/JSON-LD 的静态 HTML，`grep` 即可验证内容存在，不依赖 hydration。
2. **性能天花板最高**：默认 0 KB 框架 JS，LCP/INP 预算的压力全部留给图片优化这一真正瓶颈。
3. **内建 i18n 路径前缀路由**，与 hreflang、Pagefind 分语言索引天然对齐（见 ADR-004）。
4. **构建期图片管线**（`<Picture>` + sharp）产出 WebP/AVIF + srcset + 显式宽高，直接兑现设计侧「CLS < 0.1」的预算（见 ARCHITECTURE.md §6.1）。
5. **Content Layer 抽 Loader**，使未来更换内容源（CMS / API）不必触碰页面代码（见 ADR-003、ADR-011）。

被否决的主要候选见 ADR-002（Next.js）。

## Consequences

### 正面

- 部署形态简单：静态产物 + 边缘 Worker，无需管理操作系统、进程、数据库主机。
- 攻击面极小：无服务端会话、无 CMS 后台、无插件生态，安全维护成本接近零。
- 内容有版本历史与回滚能力（内容在 Git 中），这是 CMS 方案难以提供的。
- Cloudflare 免费额度足以覆盖 MVP 阶段，月度持有成本接近零。

### 负面

- **内容上线有 3-8 分钟延迟**（需 CI 构建）。这是静态站固有代价，必须在客户预期管理材料中写清楚（ARCHITECTURE.md §10.3 W-1）。
- **构建时长随 SKU 数与图片量线性增长**。超过约 15 分钟需切换到按需图片 transform 方案。建议 V1 首批 SKU ≤ 300。
- **Astro 7 有若干破坏性变更**，与 2026 年前教程的常见写法不符（`astro/zod` 导入、集合 loader 化、`src/content.config.ts` 位置、`entry.id` 取代 `entry.slug`、`render(entry)` 取代 `entry.render()`）。已全部提炼为 `ARCHITECTURE.md` §11 硬约束表，防止按印象写 API 导致幻觉签名。
- Astro 生态小于 Next.js，遇到冷门问题时可参考的资料更少。

### 中性

- 团队需要接受「先损失一点动态能力，换取 SEO 与运维的确定性」这一取舍。若后续 Phase 2 有大量交互需求，可仅把需要的路由改为 SSR，其余保持静态——混合模式在 Astro 7 中由单页 `export const prerender = false` 支持。

## Alternatives Considered

| 候选 | 否决理由摘要 | 详见 |
|---|---|---|
| Next.js 16.3.8 | 为 5% 的服务端需求背负 100% 的 Node 运行时与部署运维；自托管 SSG/ISR 存在已知缓存投毒面 | ADR-002 |
| WordPress + WooCommerce + WPML | 性能债务靠插件堆隔离 Bad husbands 安全 CVE 面；WooCommerce 在本项目语境下是纯负债 | ARCHITECTURE.md §3.2 C |
| Shopify B2B | 月费与交易抽成错配；URL 结构强制 `/collections/`、`/products/`，无法兑现 PRD §12.3 的 `/product-lines/` 分层 SEO 结构 | ARCHITECTURE.md §3.2 D |
| Nuxt 4 / SvelteKit | 合格替代，但在 Astro 得满分的维度上无法超过，且无 studio25 场景收益 | ARCHITECTURE.md §3.2 E |

## Related ADRs

ADR-002（否决 Next.js）、ADR-003（内容源）、ADR-004（多语言）、ADR-005（部署）、ADR-007（搜索）、ADR-011（v2 演进边界）
