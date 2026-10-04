# 技术架构方案 — jewelry-b2b-global

> 饰品 B2B 外贸全球官网 · Phase 1 技术架构
> 作者：高见远（首席架构师）
> 版本：v1.0
> 日期：2026-10-01
> 适用 PRD：docs/PRD.md v1.0 ｜ 适用设计稿：docs/UIUX.md、docs/design-tokens.json

---

## 0. 本文档如何使用

本文档是**契约**，不是参考读物。规则如下：

1. **§2 的版本表是硬约束**。任何实现代码必须按该版本号的 API 编写，不得按通用印象写。
2. **§11 已知坑**是从 Astro 5→7 真实迁移事故中提炼的，违反即构建失败或产生沉默逻辑错误。
3. **§12 端到端验证步骤**是完成定义。跑不通即未交付。
4. **§10 不做清单**覆盖到的一切均为 Phase 1 范围外，实现时不得顺手添加。
5. 实现与本文档冲突时，**先改本文档再改代码**（活规格原则）。

---

## 1. 决策摘要（一页看懂）

| 层 | 选型 | 版本 | 一句话理由 |
|---|---|---|---|
| 渲染框架 | **Astro** | **7.3.5** | 纯展示型站 + SEO 生死线，静态优先是唯一理性选择；默认零 JS 下发 |
| UI 运行时 | 原生 HTML/CSS + 少量 Astro island | — | Phase 1 无复杂交互，不上 React/Vue 运行时 |
| 样式 | **Tailwind CSS** | **4.3.3** | 与 design-tokens.json §4.3 theme 扩展直接对接，CSS-first 配置 |
| 图标（锁定） | **Lucide**（`@iconify-json/lucide`） | **1.2.138** | 见 §7，全项目唯一图标源 |
| 内容源 | Git 内 Content Collections + Cloudflare R2 | Astro Content Layer | 见 §6.5，客户是 SOHO，Phase 1 不接 Headless CMS |
| 多语言 | Astro i18n 路径前缀 + 本地翻译字典 | Astro 内建 | 见 §6.2 |
| 搜索 | **Pagefind** + SKU 双层索引 | **1.5.2** | 见 §6.6，静态站零后端全文检索 + 自建 did-you-mean |
| 图片管线 | 构建期 sharp 优化 + 外部 R2/CDN | sharp 0.35.x | 见 §6.1 |
| 部署 | **Cloudflare Workers**（静态资源 + Worker） | adapter **14.3.3** | 见 §4，零运维、全球 CDN、D1/邮件同源 |
| 询盘后端 | Cloudflare Worker + D1 + Turnstile + Resend | resend **6.31.0** | 见 §6.3，无自建服务器前提下的最小可信闭环 |
| 客户端状态 | **Nanostores** + persistent | persistent **1.3.5** | 见 §6.4，承接 ComplianceContext 与 RFQ 篮 |

**一句话结论**：用 Astro 7 做纯静态渲染的 SEO 站，内容走 Git 内的类型化 Content Collections，图片走构建期优化 + R2，询盘走一个 Cloudflare Worker 打在 D1 上，全文检索走 Pagefind 的静态索引。全程无专职后端、无服务器运维、月成本接近零，且有一条明确通往 v2 会员批发价的演进路径。

**为什么不是 Next.js**：这是本项目唯一值得展开的否定结论，见 §3.2 与 ADR-002。

---

## 2. 版本锚定表（钉死，不得漂移）

所有版本于 **2026-10-01** 通过 npm registry 实时核实（`registry.npmjs.org/<pkg>/latest`），非凭记忆。

| 包 | 版本 | 核实来源 / 约束 |
|---|---|---|
| `node` | `>=22.12.0` | Astro 7.3.5 `engines.node` |
| `astro` | **7.3.5** | npm latest；依赖 Vite ^8.0.13、sharp ^0.35.4 |
| `@astrojs/cloudflare` | **14.3.3** | peer `astro ^7.2.0`、`wrangler ^4.125.0` |
| `wrangler` | **^4.125.0** | adapter peer 要求 |
| `@astrojs/mdx` | **^7.x** | 与 Astro 7 主线配套（安装时 `npm view` 二次核实） |
| `@astrojs/sitemap` | **^3.7.x** | 注意：Astro 7 起输出拆分为 `sitemap-index.xml` + `sitemap-0.xml`（见 §11.6） |
| `tailwindcss` | **4.3.3** | `@tailwindcss/vite` 同版本配套 |
| `astro-icon` | **1.2.0** | peer 主版本与 Astro 7 兼容（devDeps 显示 `astro ^7.2.2`） |
| `@iconify-json/lucide` | **1.2.138** | 图标唯一数据源，见 §7 |
| `nanostores` | **^1.0.0** | 由 `@nanostores/persistent@1.3.5` 的 peer 区间确定；安装时取该区间内最新具体版本并写回本表 |
| `@nanostores/persistent` | **1.3.5** | engines `^20.0.0 \|\| >=22.0.0` |
| `pagefind` | **1.5.2** | 需用 extended release 以获得 CJK 分词（`npx pagefind` 默认即为 extended） |
| `resend` | **6.31.0** | engines `node >=20`；Cloudflare Workers 环境可用 |
| `zod` | 经 `astro/zod` 导出 | **不得**单独安装 zod 并用它替代 `astro/zod`（见 §11.2） |

**安装时的二次核验命令**（写进 CI，防依赖漂移）：

```bash
npm view astro version
npm view @astrojs/cloudflare version
npm view astro-icon version
npm view @iconify-json/lucide version
npm view pagefind version
```

存在性核验是硬门：任何代码里出现的包名、导出路径、方法签名，都必须能在这几个包的实际类型定义里找到，禁止凭印象调用。

---

## 3. 技术选型对比矩阵

### 3.1 评分表

评分区间 1-5，5 为最优。权重按本项目实际情况分配：**SEO 与自然流量为生死线**（权重最高），其次是图片密集下的首屏性能，第三是客户作为无技术团队 SOHO 的可维护性。

| 维度 | 权重 | A. Astro 7 静态优先 | B. Next.js 16 App Router (SSG+ISR) | C. WordPress + WooCommerce + WPML | D. Shopify B2B | E. Nuxt 4 / SvelteKit |
|---|---|---|---|---|---|---|
| **SEO 能力**（SSR/SSG/ISR、可控元数据、干净 HTML） | 25% | **5** | 4 | 3 | 2 | 5 |
| **首屏性能**（图片密集站） | 20% | **5** | 3 | 2 | 3 | 4 |
| **图片 CDN 与优化** | 10% | **4**（构建期 sharp + R2） | 4（内建 Image + needs 平台） | 2（插件堆） | **5**（托管） | 3 |
| **内容管理友好度**（非技术客户自维护） | 15% | **4**（MDX + 受控 GUI，见 §6.5） | 3（需 CMS） | **5**（后台可视化） | **5** | 3 |
| **多语言能力**（SEO 友好 hreflang） | 10% | **5**（静态多语言路由 + 独立索引） | 4 | 3（WPML 沉重付费） | 3 | 4 |
| **询盘后端方案成熟度** | 5% | **4**（Worker + D1） | **5**（API Routes） | 4 | 3 | 4 |
| **部署与运维成本** | 10% | **5**（静态 + 边缘，近零运维） | 3（Node 服务/Vercel 耦合） | 2（需维护 PHP/插件/安全更新） | 2（月费抽成） | 4 |
| **v2 演进至会员批发价 + 下单** | 5% | **4**（Cloudflare 全栈补齐，见 §13） | **5** | 4 | **5** | 4 |
| **加权总分** | 100% | **4.65** | **3.55** | **3.05** | **2.95** | **4.05** |

### 3.2 逐项说明（只讲关键差异，不列常识）

**A. Astro 7 静态优先（推荐）**

- SEO：默认全站预渲染为静态 HTML，每个 SKU 页自带完整 `<title>`/`<meta>`/JSON-LD，**不依赖 JS 执行**。Google 抓取所能及 vs 依赖 hydration 才有内容，在饰品这类长尾词站上差一个量级。
- 性能：默认向浏览器发送 **0 KB 框架 JS**。图片密集站真正的瓶颈不是框架体积，但 0 KB 意味着 LCP/INP 的天花板直接被抬高。
- 图片：`<Image>` / `<Picture>` 由 sharp 在**构建期**处理，产出 WebP/AVIF + 显式 width/height（防 CLS）+ 默认 `loading="lazy"`。见 §6.1。
- 多语言：内建 i18n 路由支持默认语言无前缀；V1 为单层英文站（见 §6.2 与 ADR-004），hreflang 预埋位与 Pagefind 分语言索引天然对齐。
- 成本：静态产物 + 少量 Worker 调用，Cloudflare 免费额度（Workers 10 万请求/日、D1 500 万行读/日）远超 MVP 量级。

**B. Next.js 16 App Router（否决，但为最接近的次优）**

- 版本事实：Next.js **16.3.8** 为 Active LTS，**15.5.27** 为 Maintenance LTS。团队给的调研假设为 "15.x"，实际主线已到 16.x，若选它必须按 16.x 写。
- 否决主因有两条：
  1. **不必要**。Next.js 的核心优势是全栈能力（Server Actions、中间件、Route Handlers、PPR）。本站 Phase 1 唯一的服务端逻辑是一个 RFQ 提交接口，为此背负一个 Node 运行时与它的部署运维，是典型的"为 5% 的需求买 100% 的复杂度"。
  2. **自托管 SSG/ISR 有已知安全面**。2026 年 9 月安全公告中，`CVE-2026-94543`（自托管 Pages Router SSG/ISR 缓存投毒）与 `GHSA-h694-7cp9-m8p3`（`use cache` 跨 root param 泄漏）均为中危，Vercel 部署不受前者影响但自托管受影响。对一个"要低成本、可能自托管"的客户，这是额外的长期包袱。
- 保留场景：若 v2 明确要做会员体系 + 购物车 + 服务端个性化定价，Next.js 16 会重新变成有力候选。届时迁移成本已由 ADR-011 的边界设计压低。

**C. WordPress + WooCommerce + WPML（否决）**

- 承认其优势：外贸行业常见、非技术客户最熟悉后台、生态插件多。内容管理友好度确实得 5 分。
- 否决主因：
  1. **性能债务不可控**。千级 SKU × 每 SKU 多图，在 WordPress 上要同时靠缓存插件、图片 CDN 插件、数据库优化插件把 Core Web Vitals 拉回及格线。而这每一层都是长期的运维面和安全面（插件 CVE 是 WordPress 站最主要的攻击入口）。
  2. **WooCommerce 在这里是负资产**。本站明确不做在线支付、不做会员商城。装 WooCommerce 只为产品数据建模，等于引入一整套交易模型的代码、定时任务、数据库表，然后全部禁用——这是纯负债。
  3. **WPML 昂贵且沉重**。多语言 SEO 需要干净的 hreflang 与 URL 结构，WPML 能达到，但要靠付费版本 + 持续调校。
  4. **主机成本真实存在**。不同于静态托管，WordPress 需要一台持续运行的服务器（或托管 WordPress 服务），加上备份、更新、安全监控，对一个"无技术团队"的 SOHO 是隐形长期成本。

**D. Shopify B2B（否决）**

- 承认其优势：最好的托管体验、最好的图片 CDN、批发功能成熟。
- 否决主因：
  1. **月费 + 交易抽成**，对一个"首版不做交易、只做询盘转化"的目标完全不匹配。TV 成本换来的能力 90% 用不上。
  2. **SEO 可控性最弱**（本表 2 分）。Shopify 的 URL 结构强制 `/collections/`、`/products/` 前缀，无法做到 PRD §12.3 要求的 `/product-lines/{line}/` 分层结构；`robots.txt`、模板层改动受限，对一个"SEO 是生死线"的站是硬伤。
  3. 客户需要的是自有域名上的品牌资产沉淀，而非平台内的店铺。

**E. Nuxt 4 / SvelteKit（次优，未选中）**

- Nuxt 4.x / SvelteKit 在 SEO 与静态输出上同样达到 5 分级别，是合格替代。
- 未选中理由纯粹是**边际收益**：它们在 Astro 得 5 分的维度上无法超过，而在 Not-selected 场景（需要复杂客户端状态管理）尚未出现。若团队后续判断 Phase 2 需要大量交互式 UI，迁移到 Nuxt 的政策车辆已在。

### 3.3 选型决策 Tree（给后续执行者的捷径）

```
需要 SEO + 展示为主 + 少量服务端逻辑？
├─ 是 → 静态优先
│       ├─ 团队懂 React 生态且要全栈？ → Next.js 16（本项目：否）
│       └─ 否则 → Astro 7  ← 本项目
└─ 否（重交互应用）→ 走 SPA + API 路线，不在本范围
```

---

## 4. 分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│  买家侧（浏览器，全球）                                            │
│  静态 HTML + CSS + 极少量 island JS（nanostores 驱动的抽屉/选择器）  │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare 全球边缘（唯一运行时，无自建服务器）                     │
│  ┌──────────────────┬──────────────────┬──────────────────────┐  │
│  │ Workers Assets   │ Worker /api/v1/* │ static pagefind/ 索引 │  │
│  │ 预渲染 HTML/CSS/ │ RFQ 提交端点      │ + R2 图片 gzip/brotli│  │
│  │ 图 ← 构建产物     │ newsletter 订阅  │ + hreflang sitemap    │  │
│  └──────────────────┴────────┬─────────┴──────────────────────┘  │
│                              │ binding                            │
│                    ┌─────────▼──────────┐                         │
│                    │ Cloudflare D1      │  询盘主表 / 订阅表        │
│                    │ (SQLite @ edge)    │  1 DB · 500MB（免费）     │
│                    └─────────┬──────────┘                         │
│                              │ 写成功后异步                        │
│                    ┌─────────▼──────────┐                         │
│                    │ Resend API         │  通知客户 + 自动回执买家   │
│                    └────────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  构建期（GitHub Actions CI，每次 MR / 内容提交触发）                 │
│                                                                  │
│   Git 仓库                                                        │
│   ├── src/content/products/**.md   ← 客户改这个加产品               │
│   ├── src/content/blog/**.mdx                                     │
│   └── assets/**                    ← 客户拖图进来                   │
│              │                                                    │
│              ▼  astro build                                        │
│   ┌──────────────────────────────────────────────────────────┐   │
│   │ 1. Content Layer 校验（Zod schema，字段错即刻失败）          │   │
│   │ 2. sharp 构建期图片优化 → WebP/AVIF + 多尺寸 srcset         │   │
│   │ 3. i18n 字典（V1 仅 en）注入生成静态页                      │   │
│   │ 4. JSON-LD 注入（Organization/Product/Breadcrumb/FAQ）      │   │
│   │ 5. @astrojs/sitemap 产出 sitemap-index.xml                 │   │
│   │ 6. pagefind 索引 → dist/pagefind/                          │   │
│   │ 7. SKU 索引压缩 → dist/sku-index.json（供 did-you-mean）     │   │
│   └──────────────────────────────────────────────────────────┘   │
│              │                                                    │
│              ▼  wrangler deploy                                   │
│         Cloudflare 边缘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.1 数据流（RFQ 主链路）

```
买家点击 "Add to RFQ"
  → nanostores 写入 localStorage["rfq_v1"]（跨标签页同步）
  → 打开 RFQ 抽屉 → 填表 → 提交
  → POST /api/v1/rfq  { items[], contact{}, turnstileToken }
      ├─ Worker 校验 Turnstile token（服务端 siteverify，必做）
      ├─ Worker 校验 honeypot 字段为空 + 时间阈值（<2s 提交判机器人）
      ├─ Zod 解析 body（字段不符 422，不吞异常）
      ├─ D1 写入 rfq_inquiries + rfq_items（单事务）
      └─ Resend 发两封：① 通知客户 ② 给买家的自动回执
  → 返回 201 { id, reference }
  → 前端展示 reference（如 RFQ-2026-XXXX），并把 rfq_v1 标记为 submitted
```

---

## 5. 目录结构与文件组织约束

### 5.1 结构

```
jewelry-b2b-global/
├── astro.config.mjs            # 唯一配置文件，只做装配
├── content.config.ts           # Content Layer 集合定义（必须在 src/ 下，见 §11.3）
├── wrangler.toml               # Worker + D1 binding + Assets
├── package.json
├── tsconfig.json
│
├── src/
│   ├── content/
│   │   ├── products/           # 产品 [{line}/{sku}.md]，客户主要接触点
│   │   ├── product-lines/      # 三大产品线落地页文案
│   │   ├── compliance/         # 合规专题
│   │   ├── blog/               # MDX
│   │   └── pages/              # 政策类单页
│   │
│   ├── i18n/
│   │   ├── en.json             # UI 翻译字典（V1 唯一一份，v2 按语言新增文件）
│   │   └── index.ts            # t(key) 取值入口 + UiKey 类型，单一真源
│   │
│   ├── components/
│   │   ├── layout/             # Header.astro / Footer.astro / SeoHead.astro
│   │   ├── product/            # ProductCard.astro / SpecTable.astro / Gallery.astro
│   │   ├── rfq/                # RfqDrawer.tsx（唯一 React island）
│   │   ├── search/             # SearchDialog.tsx（第二 island）
│   │   └── ui/                 # Button.astro / Badge.astro / Icon.astro
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro    # 全局壳：字体分路由加载逻辑在此（见 §10.2）
│   │   └── ProductLayout.astro
│   │
│   ├── lib/
│   │   ├── seo/                # jsonld.ts / breadcrumbs.ts / canonical.ts
│   │   ├── rfq/                # store.ts（nanostores）/ schema.ts（Zod）
│   │   ├── compliance/         # store.ts（ComplianceContext）
│   │   ├── products/           # queries.ts / sku-index.ts
│   │   └── shared/             # cn.ts / format.ts
│   │
│   ├── pages/                  # 路由，对齐 PRD §12.3
│   │   ├── index.astro
│   │   ├── product-lines/[line].astro
│   │   ├── products/[sku].astro
│   │   ├── compliance/  sourcing-partners/  samples/
│   │   ├── shipping-payment/  faq/  markets/  blog/
│   │   ├── rfq/  contact/      # 对齐 UIUX §11 页面清单（7 号 RFQ 独立页 / 15 号联系页）
│   │   └── api/                # 见 §8，由 adapter 转 Worker
│   │
│   ├── styles/
│   │   └── global.css          # @import "tailwindcss" + tokens 映射
│   │
│   └── assets/                 # 构建期处理的图片（src 相对引用）
│
├── public/                     # 原样拷贝：robots.txt、favicon、/pagefind（构建后）
├── scripts/
│   └── build-sku-index.mjs     # 生成 did-you-mean 所需索引
│
├── worker/                     # 与站点同源的 Cloudflare Worker
│   ├── index.ts                # 入口，只做路由装配
│   ├── routes/                 # rfq.ts / subscribe.ts
│   ├── lib/                    # turnstile.ts / db.ts / mail.ts / ratelimit.ts
│   └── schema/                 # Zod 校验 + TypeScript 类型（与 OpenAPI 对齐）
│
├── docs/
│   ├── ARCHITECTURE.md         # 本文
│   ├── api-spec.yaml           # OpenAPI 3.0，前后端唯一契约
│   └── decisions/              # ADR-001 ~ ADR-011
│
└── .github/workflows/
    └── deploy.yml              # build → pagefind → wrangler deploy
```

### 5.2 硬约束（违反即返工）

| 编号 | 约束 |
|---|---|
| CO-1 | **单文件 ≤ 300 行**。超出必须拆分。这不是审美问题，是可维护性问题——生成式代码最常见的退化是单文件膨胀到失去单一职责。 |
| CO-2 | **单一职责**。`abc.ts` 里既有效验又有发 mail 又有 DB 写入，必须拆。 |
| CO-3 | **入口只装配**。`worker/index.ts`、`astro.config.mjs`、`content.config.ts` 一律只做装配与配置，不含业务逻辑。 |
| CO-4 | **按资源分包，不按技术分层**。`lib/rfq/` 而不是 `lib/services/` + `lib/repositories/`。理由：MVP 阶段变更按功能维度发生，按层分包会让一次 RFQ 改款横跨 4 个目录。 |
| CO-5 | **图片不放 `public/`**（例外：`favicon`、`robots.txt`、pagefind 产物）。放 `src/assets/` 才能被 sharp 在构建期优化。 |
| CO-6 | **不得出现第二个图标源**。见 §7。 |
| CO-7 | **`.astro` 组件里禁止写业务逻辑**，只允许调用 `src/lib/**` 导出的纯函数。 |

---

## 6. 技术难点与可行性验证

### 6.1 海量产品图性能方案（千级 SKU × 多图）

**这是本站最大的技术风险，没有之一。** 饰品 B2B 的转化率高度依赖图片，但图片恰恰是 SEO 站 Core Web Vitals 的头号杀手。

**三层策略：**

**第一层：源图纪律（不可事后补救）**

| 规则 | 值 | 执行位置 |
|---|---|---|
| 源图最长边 | ≤ 2400px（输出 ≤ 1200px，留出 2x 空间） | 客户交付规范 + CI 检查脚本 |
| 输出格式 | WebP 主 + AVIF 进阶 | `Image` 组件默认；`<Picture>` 做格式协商 |
| 输出最长边 | **≤ 1200px**（对齐设计 §性能预算） | 构建期 `widths` 参数上限 |
| 文件大小 | 单张 ≤ 120KB | CI 校验，超限失败并指明文件 |
| 命名 | `{sku}-{01..08}.webp` | 约定，便于 R2 批量管理 |

**第二层：构建期 Astro 管线**

```astro
---
// src/components/product/Gallery.astro
import { Image, Picture } from 'astro:assets';
import { getImage } from 'astro:assets';
---

{/* 首屏主图：唯一一张给 priority，不得滥用 */}
<Picture
  src={cover}
  formats={['avif', 'webp']}
  widths={[400, 600, 800, 1200]}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
  alt={alt}
  loading="eager"
  decoding="sync"
  fetchpriority="high"
/>

{/* 其余图：全部懒加载 */}
{rest.map((img, i) => (
  <Picture
    src={img}
    formats={['avif', 'webp']}
    widths={[400, 600, 800, 1200]}
    sizes="(max-width: 640px) 100vw, 480px"
    alt={`${alt} view ${i + 2}`}
    loading="lazy"
    decoding="async"
  />
))}
```

要点说明：
- `<Picture>` 而非 `<Image>`：需要 AVIF/WebP 格式协商时用 Picture；`<Image>` 只出单一格式、多数场景足够，别为用而用。
- `sizes` **必须手写**。不写 `sizes` 时浏览器按 `100vw` 下载，会拉回 1200px 版本——这是 srcset 最常见的沉默失效。上面给的 sizes 值对应设计稿的产品卡/画廊实际占宽。
- `priority` 式的 `loading="eager" + fetchpriority="high"` **每页只允许一张**（封面）。滥用会阻塞渲染，反而恶化 LCP。
- Astro 自动输出 `width`/`height`，因此 CLS 天然可控（设计预算 CLS < 0.1 由此保障）。

**第三层：CDN 分发**

图片产物随部署发布到 Cloudflare 全球边缘，免费无限带宽，紧密 brothers。R2 用于存**原图归档**（避免 Git 仓库体积爆炸），不用于跑 Through CDN 的线上服务。

> **可行性结论：可行。** 千级 SKU × 平均 6 图 = 约 6000 张源图，构建期 sharp 处理约需 3-8 分钟（CI 侧可接受）。若未来 SKU 增至万级使构建超过 15 分钟，切换 Cloudflare Images 做按需 transform（届时另立 ADR）。

**给 PM 的成本提示**：CI 构建时长与图片量线性相关。建议 V1 首批上线 ≤ 300 个 SKU（约 1800 张图），构建 ~2 分钟，其余分批补充。

### 6.2 多语言与路由：V1 单层英文无前缀 + v2 最小预埋

> **裁决变更（2026-10-01）**：本节原定为 `/{lang}/` 路径前缀方案（含 `/zh/` 路由）。团队裁决推翻该方案。
> **V1 前台为单层英文站，不产出任何 `/zh/` 路由，不渲染语言切换器。** 详见 ADR-004。
> 变更理由：①目标访客为海外批发买家，中文落地页对转化零贡献，纯增生产与 review 成本；②多一层 `/en/` 会稀释 PRD §12.3 那套语义化路径本身承载的排名权重；③客户确认的是「中文**后台**」，admin UI locale 与前台 locale 是两个不同东西，不得混为一谈。

**V1 URL 结构：单层英文，无语言前缀**

```
https://example.com/product-lines/stainless-titanium-steel/
https://example.com/products/fb-2317/
https://example.com/compliance/nickel-release-en-1811/
```

即 PRD §12.3 的路由原样落地，**不套任何 locale 前缀**。这是本次裁决最有价值的部分：`/product-lines/{line}/`、`/compliance/{topic}/` 这类语义化路径本身就是排名资产，加一层 `/en/` 是净损失。

**v2 预埋最小清单（只做这三条，不多做）**

| 预埋项 | V1 做法 | v2 启用时的工作量 |
|---|---|---|
| 文案字典外置 | 所有 UI 文案走 `src/i18n/en.json`（键值结构），**组件里不出现硬编码英文串**，统一经 `t(key)` 取值。V1 只产出 `en` 一个字典 | 加一个 `{lang}.json` + 一层路由前缀，组件零返工 |
| hreflang 注解预留位 | 每页保留一处 `<link rel="alternate">` 注入位，V1 只注入 **1 条** `x-default` 指向页面自身 | 加语言时在该位追加其余 `hreflang` 条目 |
| Pagefind 语言锚 | 每个 layout 输出 `<html lang="en">` | v2 分语言索引可直接复用 |

**V1 明确禁止（违反即退回）**

| 禁止项 | 原因 |
|---|---|
| 产出任何 `/zh/` 路由或页面 | 本次裁决核心：低质量/未审校的中文页会反噬核心 SEO 资产 |
| **渲染语言切换器，包括禁用态下拉** | **禁用态等于暗示即将上线，是虚假承诺**，违反 PRD §13.6 的「无实证不宣称」原则 |
| 引入运行时 i18n 中间件 / locale 重定向层 | YAGNI。V1 只有一种语言，无任何东西需要协商或重定向；且重定向层会引入 Vary 头与 CDN 缓存正确性问题 |
| 引入 `@formatjs/intl-localematcher` / `negotiator` 等语言协商依赖 | 同上，且是幻觉依赖与安全问题高发区 |
| 为 i18n 引入 `astro-i18next` 等集成 | 预埋只到「字典外置」这一层，其余是 v2 的事（对齐 ADR-011） |

**翻译成本影响（本次裁决的直接收益）**：原本 SKU 标题/描述翻译这一最大成本项在 V1 被完全移除。UI 字典只需 `en` 一份。

**字典结构（v2 友好，v1 只有一份）**

```json
// src/i18n/en.json —— V1 唯一字典。组件禁止硬编码文案，一律 t('...')
{
  "rfq.title": "Request a quote",
  "product.moq": "MOQ",
  "product.referenceRange": "Reference range",
  "nav.products": "Product lines"
}
```

```ts
// src/i18n/index.ts —— 取值入口。V1 lang 恒为 'en'，但入口形状已是 v2 形态
import en from './en.json';
const dict = { en } as const;
export type UiKey = keyof typeof en;
export const t = (key: UiKey): string => dict.en[key];
```

用 `UiKey` 类型约束，写错 key 编译期即报错——这是比运行时 i18n 库更便宜的一致性防线，也为 v2 保留了同样的类型安全。

### 6.3 询盘后端（无自建服务器）

**架构：Cloudflare Worker + D1 + Cloudflare Turnstile + Resend**

| 候选 | 结论 | 理由 |
|---|---|---|
| Cloudflare Worker + D1 | **采用** | 与静态站同账户、同 Deploy 流水线；D1 免费额度（500 万行读/日、10 万行写/日）远超 MVP；以后 Memories 演进可直接同栈加 Auth |
| 第三方表单服务（Formspree 等） | 否决 | 免费额度有封顶且品牌水印；RFQ 是核心资产，数据不能寄存在第三方且导出麻烦 |
| Supabase | 备选 | 能力强，但为 RFQ 这一个对象引入一整套 Postgres + Row Level Security 学习面，过度设计。v2 若做会员体系会重新评估 |
| Next.js API Routes | 不适用 | 已否决 Next（§3.2） |
| 纯邮件 API 不落库 | **否决** | **询盘是唯一业务资产**。只发邮件不落库 = 无历史、无统计、无回溯、无法做 v2 的客户分层。这条是硬性的 |

**Spam 防护（三层，缺一不可）：**

1. **Cloudflare Turnstile**（主要）。理由：**免费且无使用上限**（reCAPTCHA 免费额度已降至 10,000 次/月，超出按月付费），与目标市场（EU/UK）的 GDPR 隐私友好度一致（不向 Google 传输数据）。
   - **强制服务端校验**：必须调用 `siteverify`，只查前端 token 非空是纸糊防线。
   - Turnstile token 单次有效：提交失败必须 re-render widget，否则用户二次提交必失败——这是一类极容易被生成式代码漏掉的错误分支。
2. **Honeypot 隐藏字段 + 时间阈值**（零成本兜底）。表单渲染时间戳，提交间隔 < 2s 判为机器人。
3. **Cloudflare WAF + 速率限制**（账户层配置，无需代码）。

**邮件：** Resend（`resend@6.31.0`），发送两封——内部通知（含完整 RFQ 明细 + reference）与买家自动回执（含 8 小时响应承诺，兑现 PRD §13.2 信任条）。

> **可行性结论：可行。** Worker 单次 CPU 预算 10ms 足以覆盖 Zod 校验 + Turnstile 校验 + D1 写入；Resend 调用放在 `ctx.waitUntil()` 异步执行，不阻塞响应。

### 6.4 ComplianceContext 与 RFQ 篮（回应设计要求 #2 #3）

**状态方案：Nanostores + @nanostores/persistent**

选择理由（对比 Redux/Zustand/Jotai）：
- Nanostores 是 Astro 官方推荐的最小状态方案，跨框架（当前 island 用 React，未来可能换），**~250 字节**。
- 其余方案均为 React 专属，且体积在 x10~x40 量级。对一个"默认 0 KB JS"的站，这是唯一负责的选择。
- `@nanostores/persistent` **原生支持跨标签页同步**（这正是设计稿 RFQ 篮的要求 #3），无需自己写 `storage` 事件监听。

```ts
// src/lib/rfq/store.ts
import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

// localStorage key 严格为 rfq_v1（设计稿约定）
export const rfqItems = persistentAtom<RfqItem[]>('rfq_v1', [], {
  encode: JSON.stringify,
  decode: JSON.parse,
  listen: true,            // ← 跨标签页同步，必开
});

export const rfqCount = computed(rfqItems, (items) =>
  items.reduce((n, i) => n + i.qty, 0),
);

export function addToRfq(item: RfqItem): void {
  const cur = rfqItems.get();
  const hit = cur.find((i) => i.sku === item.sku);
  rfqItems.set(hit
    ? cur.map((i) => (i.sku === item.sku ? { ...i, qty: i.qty + item.qty } : i))
    : [...cur, item]);
}
```

```ts
// src/lib/compliance/store.ts
import { persistentAtom } from '@nanostores/persistent';

export const complianceContext = persistentAtom<ComplianceTarget>(
  'compliance_v1',
  'eu_uk',                  // 默认值必须显式，不得依赖浏览器 geo（SSR 无 geo）
  { encode: JSON.stringify, decode: parseAndValidate, listen: true },
);
```

**重要约束给前端执行者**：`persistentAtom` 在 SSR/预渲染阶段读不到 localStorage，**首次渲染必须用默认值**，不得在 SSR 阶段触碰 `window`。这是 Astro 静态渲染 + 客户端持久化最常见的水合失配来源。ComplianceContext 的默认值必须是确定值（`eu_uk`），不能依赖 `navigator.language`。

### 6.5 内容如何给非技术客户维护（回应难点 B5）

**结论：以 Git 内 Content Collections 为主，Phase 1 不接 Headless CMS；用一个受控的前端编辑通道降低门槛。**

这是本次调研中**我认为最需要向 PM 明确说明**的一条。先说被普遍误传的一句话：

> 「接了 Headless CMS，编辑点保存，内容就自动上线了。」

这句话只对一半。Content Collections 是**构建期原语**——数据在 `astro build` 时被采集、校验、固化。无论内容存在哪里，只要走 Content Collections，**新内容上线都必须重新构建**。接 CMS 只是把"编辑地点"从 GitHub 挪到了 CMS 后台，构建仍然要跑（靠 CMS 的 webhook 触发 CI）。所谓"无需部署"是错的。

因此真正的选择题是：**谁来编辑，用什么界面，值不值得为一个每个月加几十个 SKU 的场景买一套 CMS 订阅与 OAuth 维护面。**

| 方案 | 成本 | 上手难度（SOHO 客户） | 结论 |
|---|---|---|---|
| Git + MDX 直接改 | ¥0 | 高（需懂 Git/MR） | 不合适作为唯一手段 |
| Headless CMS（Sanity/Strapi） | ¥0~订阅费 + OAuth 维护 | 中（界面友好但要学） | Phase 1 **不做** |
| **Git 内容 + 受控编辑通道** | ¥0 | **低** | **采用** |

**「受控编辑通道」具体形态（这是推荐给 PM 的方案）：**

1. **产品数据入口统一为一个受 Schema 约束的目录**：`src/content/products/{line}/{sku}.md`。Frontmatter 字段由 Zod schema 钉死，写错字段名**构建即刻失败并指明文件行号**——这比 CMS 后台的模糊校验更可靠。
2. **图片拖进 `src/assets/products/{sku}/`，按 `{sku}-01.webp` 命名**，与 sku 自动关联，无需手工填 path。
3. **给客户一个零 Git 的提交界面**：使用 GitHub 的 Web 端编辑界面（浏览器里点 "Add file" → 贴 frontmatter → Commit）。对"加一个产品"这个动作，客户只需认识 8 个字段。**这是真正的月成本 ¥0 且无需教学 Git 的路径。**
4. **配一份"加产品"图文 SOP**（PM 侧产出），含一个可复制的 YAML 模板。
5. CI 在每次提交后自动构建 + 部署，客户提交后约 3-5 分钟上线，会收到 GitHub 的构建结果邮件（成功/失败）。

**升级触发条件（写进 ADR-003，避免随意漂移）**：当以下任一条件成立时，重新评估 Headless CMS：
- SKU 数 > 2000 且 Git 仓库体积 > 2GB（图片归档到 R2 后应可延后很久）
- 客户开始需要多人协作编辑、草稿流转、定时发布、编辑留痕
- 客户明确表示无法接受 GitHub 界面

> **给 PM 的可行性与成本结论**：此方案**零订阅成本**，客户学习成本约 30 分钟（认字段 + 复制模板），且保留了类型安全与版本回滚两个 CMS 难以匹敌的好处。明确不推荐 Phase 1 接 CMS——它解决的是"多人协作与流程治理"问题，而 MVP 阶段只有一个人加 SKU。

### 6.6 千级 SKU 的筛选 / 搜索（回应设计要求 #6）

**结论：静态站完全可以满足，无需 MeiliSearch / Algolia / SSR。**

采用**三层递进**方案，按成本从低到高，只有命不中才走到下一层：

```
用户输入 q
  │
  ├─ L1  SKU 精确匹配            ← dist/sku-index.json（构建期生成，~80KB）
  │      O(1) hash 查表，立即跳转无关的 PDP
  │      命中则直接导航，不再往下走
  │
  ├─ L2  SKU 模糊 + did-you-mean  ← 同一份 sku-index.json
  │      编辑距离 ≤ 2 的最近候选，展示 "Did you mean: AB-1234?"
  │      （把构编辑距离限制在 ≤2 是为了避免 O(n·m) 在千级列表上的性能问题）
  │
  └─ L3  Pagefind 全文检索        ← dist/pagefind/
         只在 L1/L2 均无高置信命中时懒加载（-client lazy，不进首屏）
```

**关键事实（已核实，2026-10-01）：**

- `pagefind@1.5.2` 按**语言分别建索引**，浏览器端按当前页面 `lang` 自动加载对应索引 → 与 hreflang 结构天然对齐。
- 中日韩分词在 **extended release** 中提供，`npx pagefind` 默认使用的就是 extended 版本。
- **限制（必须告知 PM/设计）**：Pagefind 对 CJK **不做 stemming（词干还原）**。中文可以正确切分无空格文本，但不会把不同词形归并。对 B2B 站来说影响有限（主要搜 stemming 场景是英文材质词），但这一条要写进验收标准，避免上线后被当作 bug。
- 另一个限制：Pagefind 索引的是**构建产出的 HTML**。因此必须用 `data-pagefind-body` 严格限定正文范围，否则导航栏/页脚文案会被全量索引，导致每个词都命中每个页面——这是 Pagefind 最常见的沉默降级。

**切换到托管检索的触发条件**
以下任一成立时弃用 Pagefind 改用 Meilisearch/Algolia：需要按登录用户差异化结果、需要实时库存反映、需要查询分析与同义词治理。Phase 1 三条都不成立。

### 6.7 结构化数据 JSON-LD

每类页面的 schema 产物，**必须服务端注入（静态 HTML 内），不得由客户端 JS 生成**：

| 页面类型 | Schema | 必填字段（对齐 PRD §13.3 规格） |
|---|---|---|
| 全站 | `Organization` | name, url, logo, contactPoint, **foundingDate**（对应 PRD 的"经营年限"信号） |
| 产品 `/products/{sku}` | `Product` | name, sku, image[], **brand**, offers{ priceSpecification }, additionalProperty（材质/镀层/MOQ/镍释放/报告编号） |
| 全站（面包屑） | `BreadcrumbList` | itemListElement[] |
| `/faq/` 及 FAQ 区块 | `FAQPage` | mainEntity[].{ Question, acceptedAnswer } |
| `/blog/{slug}` | `BlogPosting` + `BreadcrumbList` | headline, datePublished, author |

**重要警告（必须写进验收）**：`Product` schema 中**禁止**给出 `aggregateRating` 或 `review`（本站无评价体系），编造将招致 Google Manual Action，直接摧毁本站的核心资产。

### 6.7.1 价格：发布参考区间 + MOQ，不给阶梯价表

> **裁决变更（2026-10-01）**：本节原定「Phase 1 不公开标价」。团队裁决驳回「不标价」，保留「给区间」。理由为 PM 的调研硬证据：隐藏 MOQ / 隐藏价格 / 隐藏交期是海外批发买家的第一痛点，`NihaoJewelry` 的崛起正来自 NO MOQ + 价格可见。产品卡上抹掉价格等于把第一决策变量抹掉。
> 同时驳回「公开全量阶梯价表」：客户是贸易公司，价格必须留议价弹性。

**展示规则**

| 位置 | 展示内容 | 限定语（必备，文案以 PM 定稿为准） |
|---|---|---|
| 列表卡片（ProductCard） | 参考价格区间 + MOQ | `Reference range — quoted per order` |
| PDP | 同上，置于规格表上方 | 同上 |
| **公共页面不出现** | 精确阶梯价表 | 阶梯价只在 RFQ 报价环节给出 |

格式：`USD 3.80-4.60 / pc`（价格数字待客户提供，**示例中的数字仅为格式示意，禁止编造真实报价**）与 `MOQ 24 pcs`。

**输入数据的两条硬约束（客户已确认的真实数据只有这两条，不得失真）**

1. 款式量级：只可表述为 **`hundreds of styles`** —— 不得写成精确数。
2. MOQ：只可表述为 **`MOQ 12-120 pcs, per style`** —— **不得压缩成单点值**。

因此单品的 MOQ 也必须按款标注（字面对齐 FashionGo 的启示：MOQ 必须按款标注，不能只写「MOQ 低」）。

**Content Layer schema（`src/content.config.ts`）**

```ts
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    sku: z.string(),
    moqMin: z.number().int().min(12).max(120),   // 按款标注，不在 schema 里给默认单点值
    moqMax: z.number().int().min(12).max(120).optional(),
    // 参考区间：由该款最低档起点与最高档推算，非成交价
    priceLow:  z.number().positive().optional(),  // 客户未提供时留空，不得填 0
    priceHigh: z.number().positive().optional(),
    priceCurrency: z.literal('USD').default('USD'),
    // ...
  }),
});
```

**渲染规则（数据缺失时的降级，必须实现此分支）**：`priceLow/priceHigh` 任一缺失时，不渲染价格区块，**不回退为 "Contact for price" 这类等于隐藏价格的文案**——按 PRD §13.3 的既定表述渲染 `On request — ask with your RFQ`。这是一个易被漏掉的错误分支（生成式实现天然偏向 happy path），已列入 §12.9 验证。

**JSON-LD 写法（`AggregateOffer`）**

```json
{
  "@type": "Product",
  "sku": "FB-2317",
  "offers": {
    "@type": "AggregateOffer",
    "priceCurrency": "USD",
    "lowPrice": "3.80",
    "highPrice": "4.60",
    "offerCount": "3",
    "availability": "https://schema.org/InStock",
    "eligibleQuantity": {
      "@type": "QuantitativeValue",
      "minValue": 24,
      "unitCode": "C62"
    }
  }
}
```

字段说明与坑：

| 字段 | 取值 | 注意 |
|---|---|---|
| `@type` | `AggregateOffer` | 表示「价格区间」而非单一报价，与页面上「Reference range」语义一致 |
| `lowPrice` / `highPrice` | 该款最低档起点 / 最高档推算值 | **必须是纯数字字符串**，不带 `$`、不带千分位逗号 |
| `priceCurrency` | `USD` | ISO 4217 大写 |
| `offerCount` | 阶梯档数 | 可选但建议给，增强可信度 |
| `eligibleQuantity.minValue` | 该款 MOQ | `unitCode: "C62"` 为 UN/CEFACT 的「件」；**不要**用 `minOrderQuantity` 直接挂在 `Offer` 上——那是 `Offer` 的属性，挂错位置或写错类型会导致 rich result 静默失效 |
| `availability` | 仅当有真实数据 | 与 §10.3 W-7 一致：**不虚构库存状态** |

`AggregateOffer` 与 `eligibleQuantity` 的组合是 Google Merchant / rich result 能识别的形态；反过来，若写成单一 `Offer` 并臆造一个 `price`，既与实际业务不符，也会触发上文已警告的「编造招致 Manual Action」风险。

---

## 7. 图标库锁定（P0 规则落地）

### 结论

> **全项目唯一图标源：Lucide。通过 `astro-icon` + `@iconify-json/lucide` 消费。**
> 禁止引入任何其他图标包；禁止内联手写 `<svg>` 图标；禁止使用 emoji 充当功能图标。

| 项 | 值 |
|---|---|
| 图标集 | **Lucide** |
| 消费包 | `astro-icon@1.2.0` |
| 数据源包 | `@iconify-json/lucide@1.2.138` |
| 组件用法 | `<Icon name="lucide:shopping-bag" />` |

### 为什么是 Lucide（对比）

| 候选 | 图标数 | 风格一致性 | Tree-shaking | 结论 |
|---|---|---|---|---|
| **Lucide** | 1600+ | 极高（统一 24px 网格、2px 描边） | 好（按需内联单个 path） | **采用** |
| Phosphor | 9000+ | 中（6 种权重，混用易乱） | 好 | 否决：多权重反而诱发全项目风格不一致 |
| Heroicons | 300+（solid/outline） | 高 | 好 | 否决：数量偏少，B2B 站需要的物流/合规/工业类图标缺 |
| Tabler | 5900+ | 高 | 好 | 合格次选，未选中的理由是 Lucide 的饰品/贸易类图标更贴合 |

**决定性理由**：本项目是饰品 B2B，`lucide:gem`、`lucide:package`、`lucide:shield-check`（合规）、`lucide:ship`（物流）、`lucide:file-check`（检测报告）等图标在本项目中高频出现且语义精确——这是数量之外的真实适配度优势。

### 用法约束

```astro
---
import { Icon } from 'astro-icon/components';
---
<Icon name="lucide:shield-check" class="size-5 text-brand-600" aria-hidden="true" />
<span class="sr-only">镍释放测试通过</span>
```

- `astro-icon` 在构建期把单个图标的 path **内联进 HTML**，不产生运行时 JS、不产生额外网络请求。这对"默认 0 KB JS"的预算至关重要，也是不选 `lucide-react`（需 React 运行时）的原因。
- **每张交互性图标必须配 `aria-hidden="true"` + `.sr-only` 文本**，或用 `aria-label`。这是无障碍硬约束。
- 图标尺寸一律走 Tailwind `size-*`，**不准**在 `<Icon>` 上写 `width`/`height` 硬编码（会绕过 design tokens）。

### 违规示例（出现即退回）

```astro
<!-- 违规 1：emoji 当功能图标 -->
<button>🛒 加入询价篮</button>

<!-- 违规 2：手写 svg，与 Lucide 风格不一致 -->
<svg viewBox="0 0 24 24"><path d="..." /></svg>

<!-- 违规 3：引入第二个图标源 -->
import { ShoppingCart } from '@heroicons/react/24/outline';
```

---

## 8. API 端点清单

完整契约见 **`docs/api-spec.yaml`**（OpenAPI 3.0.3），前后端以此文件为**唯一依据**。此处列摘要。

所有端点挂载在 `/api/v1/` 前缀下。MVP 仅 3 个端点——少是优点，不要加。

### 8.1 端点摘要

| # | Method | Path | 认证 | 说明 |
|---|---|---|---|---|
| 1 | POST | `/api/v1/rfq` | 无（Turnstile token） | 提交 RFQ 询盘 |
| 2 | POST | `/api/v1/newsletter` | 无（Turnstile token） | 订阅每周上新/采购指南 |
| 3 | GET | `/api/v1/health` | 无 | 健康检查，供 CI 冒烟用 |

> **注意：Phase 1 不提供公开的产品查询 REST API。** 原因是产品数据已全部预渲染为静态 HTML + Pagefind 静态索引，做一个产品查询 API 既无消费者又增加攻击面与维护成本。若 v2 需要后台管理，届时再开（且必须走鉴权）。这是明确的不做项，见 §10。

### 8.2 POST /api/v1/rfq

**Request**

```jsonc
{
  "turnstileToken": "0.Abc...",
  "honeypot": "",                       // 必须为 ""
  "formLoadedAt": 1767225600000,        // 表单渲染时间戳，用于浸泡机器人判定
  "contact": {
    "company": "Maison Bleue",
    "name": "Claire Dubois",
    "email": "claire@maisonbleue.fr",
    "country": "FR",                    // ISO 3166-1 alpha-2
    "whatsapp": "+33612345678",         // 可选
    "website": "https://maisonbleue.fr" // 可选
  },
  "shipping": {
    "destinationMarket": "eu_uk",       // eu_uk | us | middle_east | other
    "incoterm": "FOB",                  // EXW | FOB | CIF | DDP | UNSURE
    "quantityScale": "sample"           // sample | small | bulk
  },
  "items": [
    { "sku": "FB-2317", "qty": 60, "note": "need 18K PVD gold" }
  ],
  "message": "Looking for 316L line, need EN 1811 report for EU.",
  "locale": "en"
}
```

**Response 201**

```json
{
  "code": 0,
  "data": {
    "id": "01JCM8Y9TZ4W7V2X1ABCDEF",
    "reference": "RFQ-2026-0047",
    "receivedAt": "2026-10-01T10:22:31.000Z",
    "respondBy": "2026-10-01T18:22:31.000Z"
  },
  "message": ""
}
```

**错误码**

| HTTP | code | 场景 |
|---|---|---|
| 400 | `INVALID_TURNSTILE` | Turnstile 校验失败 |
| 400 | `TOKEN_ALREADY_USED` | token 重复使用（二次提交），需重新渲染组件 |
| 422 | `VALIDATION_ERROR` | Zod 校验失败，`data.fields` 列出出错字段 |
| 429 | `RATE_LIMITED` | IP + 指纹窗口内超限（默认 5 次/10 分钟/IP） |
| 500 | `PERSIST_FAILED` | D1 写入失败。**必须**有 DP destinations 告警，不得静默吞掉 |

> **注意邀"Aalways 201 regardless"的反模式**：写入失败而返回成功是最严重的沉默逻辑错误——客户永远收不到询盘却不自知。D1 写失败必须返回 500 且触发告警。

### 8.3 POST /api/v1/newsletter

```json
{ "turnstileToken": "0.Abc...", "honeypot": "", "email": "buyer@x.com", "locale": "en" }
```

`201 { code:0, data:{ subscribed: true } }`｜`409 SUBSCRIBED_ALREADY`（幂等，重复订阅不报错）

### 8.4 统一响应格式

```yaml
成功: { code: 0, data: {...}, message: "" }
失败: { code: <非0>, data: { fields?: {...} }, message: "<人类可读>" }
```

---

## 9. 数据库表清单

**D1 (SQLite)** · 数据库名 `jewelry-b2b-global-db` · 环境：`production` / `preview`

> **产品数据不落库。** 产品是构建期的内容，存在 Git 里并通过 Content Collections 校验。把产品搬进数据库，等于为了满足"看起来应该有个产品表"的直觉，而引入同步、后台界面、CRUD 接口三层复杂度。这是 MVP 阶段典型的**过度设计**，明确不做。

| 表 | 用途 | 关键字段（`id` / `created_at` / `updated_at` 强制必带） |
|---|---|---|
| `rfq_inquiries` | 询盘主表 | `id` TEXT PK, `reference` TEXT UNIQUE, `locale`, `status` ('new'\|'contacted'\|'quoted'\|'won'\|'lost'), `company`, `contact_name`, `email`, `country`, `whatsapp`, `website`, `destination_market`, `incoterm`, `quantity_scale`, `message`, `source_page`, `utm_json`, `turnstile_score`, `created_at`, `updated_at` |
| `rfq_items` | 询盘明细 | `id` TEXT PK, `inquiry_id` FK→`rfq_inquiries.id`, `sku`, `qty`, `note`, `created_at` |
| `newsletter_subscribers` | 订阅者 | `id` TEXT PK, `email` UNIQUE, `locale`, `source`, `status` ('active'\|'unsubscribed'), `created_at`, `updated_at` |
| `audit_log`（可选，建议加） | 提交审计 | `id`, `event`, `ip_hash`, `ua_hash`, `payload_ref`, `created_at` |

**索引清单**（MVP 只建够用的，其余等慢查询出现再加）

```sql
CREATE INDEX idx_rfq_created      ON rfq_inquiries (created_at DESC);
CREATE INDEX idx_rfq_status       ON rfq_inquiries (status, created_at DESC);
CREATE INDEX idx_rfq_email        ON rfq_inquiries (email);
CREATE INDEX idx_rfq_items_parent ON rfq_items (inquiry_id);
CREATE UNIQUE INDEX idx_sub_email ON newsletter_subscribers (email);
```

> 明确**不建**：复合索引、`rfq_inquiries.company` 上的索引（MVP 无后台搜索）。遵循"等查询慢再加"。

**隐私合规**：`audit_log` 存 `ip_hash`/`ua_hash` 而非明文，保留 90 天后由定时任务清理。这是 GDPR 要求，目标市场含 EU。

---

## 10. 技术约束与不可行警告

### 10.1 MVP 阶段明确不做（Out of Scope）

违反下列任一条即视为范围蔓延，退回。

| 编号 | 不做的事 | 为什么 |
|---|---|---|
| NO-1 | **在线支付 / 购物车结算** | PRD 明确定位展示 + 询盘。引入支付 = PCI/合规面 + 退款争议 + 运维，对核心目标零贡献 |
| NO-2 | **会员登录 / 会员批发价体系** | v2 目标。Phase 1 先验证流量与 RFQ 转化，再做对了才值得投入 |
| NO-3 | **Headless CMS（Sanity/Strapi/Contentful）** | 见 §6.5 触发条件，当前不成立 |
| NO-4 | **后端产品 CRUD API / 管理后台** | 产品是构建期内容，见 §9 |
| NO-5 | **MeiliSearch / Algolia** | 见 §6.6 切换条件，Pagefind 足够且零成本 |
| NO-6 | **自动化 machine translation / AI 翻译管道** | 饰品行业术语（316L、PVD、EN 1811、镍释放）机器翻译出错率高，错误规格会被买家当作诈骗信号。**人工翻译或延后** |
| NO-7 | **多个 ccTLD / 子域名多语言 / `/{lang}/` 路径前缀** | 见 §6.2 裁决变更：V1 单层英文无前缀，不加任何 locale 层 |
| NO-13 | **渲染语言切换器（含禁用态下拉）** | **禁用态等于暗示即将上线，是虚假承诺**，违反 PRD §13.6。见 §6.2 禁止表 |
| NO-14 | **运行时 i18n 中间件 / locale 重定向层 / 语言协商依赖** | V1 只有一种语言，无东西需要协商。预埋只到「字典外置」这一层（对齐 ADR-011） |
| NO-8 | **引入第二个图标源 / emoji 图标** | §7 P0 规则 |
| NO-9 | **React/Vue/Svelte 作为全站运行时** | 仅允许 island 级使用。全 hydration 会摧毁 §10.2 的性能预算 |
| NO-10 | **SKU 级别的 360° 视图 / 视频自动播放** | 带宽与 LCP 风险；静态图足够，视频用点击后加载的 lazy iframe |
| NO-11 | **第三方 Sitemap + 大量的 `noindex` 之外的自动 SEO 插件** | Astro 静态输出已足够可控，插件只会添熵 |
| NO-12 | **暗黑模式** | 设计稿未列为 Phase 1 要求 |

### 10.2 性能预算（采纳设计要求 #4，已写入 CI 门禁）

| 指标 | 阈值 | 强制执行方式 |
|---|---|---|
| LCP | < 2.5 s | Lighthouse CI，弱网节流（Slow 4G）下门禁 |
| CLS | < 0.1 | Lighthouse CI（由 declarative width/height 保障） |
| INP | < 200 ms | 需真实交互埋点，Phase 1 用 Lighthouse TBT < 200ms 代理 |
| 首屏图片数 | ≤ 3 张 | 构建期检查脚本 + 人工 review |
| 图片输出最长边 | ≤ 1200 px | `Image`/`Picture` 的 widths 上限；CI 检查源图 |
| 单图大小 | ≤ 120 KB | CI 构建产物扫描，超限 fail |
| **前端禁止加载任何 CJK 字体** | HarmonyOS Sans SC / Noto Sans SC 在 V1 一律不加载 | 见下，这是硬约束 |

**中文字体硬约束的具体落地**（回应设计要求 #4，并因 §6.2 裁决而**收紧**）：

V1 前台为**单层英文**（无 `/zh/` 路由），因此结论比原方案更强：**整个 `dist/` 中不允许出现任何中文字体文件或 `@font-face` 声明**。

```astro
---
// src/layouts/BaseLayout.astro
// V1：前台恒为英文，不加载任何 CJK 字体，不做 locale 分支
const LOAD_CJK_FONT = false;   // v2 引入前台中文时才按路由打开
---
{LOAD_CJK_FONT && (
  <link rel="preload" as="font" type="font/woff2"
        href="/fonts/HarmonyOS-Sans-SC-subset.woff2" crossorigin />
)}
```

理由不变：全量 CJK 字体 1 MB+ 会直接击穿 LCP 预算。**并且** V1 连加载入口都不应存在——一个「目前永远为 false」的分支比一个 `locale === 'zh'` 的分支更好，因为它把「何时该开」这件事留给了明确的常量，而不是让未来的实现者去猜 locale 判断逻辑。

> **注意与「中文后台」的区别**：本约束只约束**前台**。v2 的管理后台若用中文 UI，那是独立的 admin 应用，不受此预算约束。`admin UI locale` 与 `前台 locale` 是两个东西（本次裁决核心论点之一）。

并且：中文字体**必须做子集化**（按 UI 字典实际用字裁剪，而非全量），运行在 `scripts/` 下加一个 subset 步骤。全量 CJK 字体 1MB+ 会直接击穿 LCP 预算。

### 10.3 不可行 / 高风险警告（告知 PM 与客户）

| 项 | 警告内容 |
|---|---|
| **W-1 内容上线有延迟** | 任何内容改动（含加 SKU、改价格、改文案）都需 CI 构建，**通常 3-8 分钟**上线。不是 WordPress 那种"点保存即生效"。这是静态站的固有代价，换来的是性能与零运维。**PM 必须把这一点写进客户预期管理材料**。加急路径与回滚见 §10.4。 |
| **W-2 真正的天花板是产出文件数，不是构建时长** | 见 §10.5 的 SKU 容量模型。**安全线不在 build 阶段，在 deploy 阶段**：500-800 款 × 6 图会产生约 27,000-43,000 个图片变体文件，必须先在 staging 核实 Workers 静态资源的资产数量上限，否则会成功构建、失败部署。 |
| **W-3 翻译成本已被 V1 范围移除** | 原担忧的「SKU 标题/描述翻译是持续人力成本」随 §6.2 裁决（V1 单层英文、无 `/zh/` 路由）**不再成立**。V1 只剩一份英文 UI 字典，成本极低。此条保留只为记录该结论的来源。 |
| **W-4 Pagefind 对中文不做词干还原** | V1 无中文前台，此条**不适用**。仅在 v2 引入中文前台后才需考虑。 |
| **W-5 Cloudflare 免费额度有硬边界** | Workers 10 万请求/日（超限返 429）。RFQ 提交量远低于此，但**必须做用量观测**，否则突发流量会静默丢询盘。注意：Free 计划不一定提供「请求配额」类原生告警条目，**因此不能依赖控制台告警作为唯一防线**，具体方案见 §10.6。 |
| **W-6 不可行项：GMP/验厂证书墙** | 客户无自有工厂、无验厂资质。技术上可以做页面，但 PRD §2 已明确改走"第三方检测报告 + 验货流程"路线。架构上只需 `Product.additionalProperty` 承载报告编号，不做"证书管理模块"。 |
| **W-7 不可行项：实时库存 / 实时报价** | 静态站无实时数据源，且客户无自有工厂无法保证库存真实。产品页**不展示库存数字**，改为 "Availability confirmed with your RFQ"。**注意：此条约束的是「库存数字」，不约束「价格」——价格按 §6.7.1 裁决必须展示参考区间。** |

### 10.4 加急路径：改动之后第一时间该做什么（回应 W-1）

给客户的**准确话术**（可直接进预期管理材料）：

> 内容提交后通常需要 **3-8 分钟**完成构建并上线。这不是故障，是「每次上线都做一次全站质检」的代价——换来的是页面速度和几乎为零的运维成本。**如果改错了想要回退，是几秒钟的事，比再改一次更快。**

**三条路径，按优先级使用：**

| 优先级 | 场景 | 路径 | 耗时 | 代价 |
|---|---|---|---|---|
| **1（首选）** | **改错了，要回到上一版** | **回滚**，见下 | **秒级** | 无 |
| 2 | 内容正常更新 | 提交 → GitHub Actions 自动构建部署 | 3-8 分钟 | 无 |
| 3 | 需要跳过排队（紧急修正） | 手动触发：`gh workflow run deploy.yml` 或 GitHub Actions 页面 **Run workflow** 按钮（工作流需声明 `workflow_dispatch:`） | 3-8 分钟（省掉触发等待） | 无 |
| **4（破窗手段）** | 上述都不可用，且必须立刻改 | 在授信机器上本地 `npm run build && wrangler deploy` | 约 1-2 分钟 | **绕过 `astro check` 与体积检查，可能把坏的产物推上线。仅限救急，事后必须补跑 CI。** |

**Cloudflare 控制台手动触发构建（备用加急路径，挂在优先级 3 之后使用）**

若仓库在 Cloudflare 侧开启了构建集成（Workers Builds / Pages 构建），当 GitHub Actions 排队拥堵或临时不可用时，可跳过 GitHub 直接在 Cloudflare 控制台重跑构建：

1. 控制台进入 `Workers & Pages` → 选择本项目 → `Deployments`（或 `Builds`/`Build history`）标签页。
2. 找到最近一次成功构建，点击右侧 **Retry build**（或 **Trigger build / Create build**）手动重跑。
3. 构建完成后自动部署，全程无需本地环境，且走与 CI 相同的构建命令与校验，**不绕过 `astro check`**。

注意：此路径的可用性取决于 Cloudflare 侧构建集成是否已配置（部署时在 checklist 中确认）。未开启集成的账户仍以路径 3（GitHub Actions Run workflow）与路径 4（本地破窗）为准。

**回滚：这才是「改错价格」的正确答案**

Cloudflare Workers 的回滚是**立即生效**的（会创建一个新部署并把该版本推到全部路由），且可在控制台操作：

```bash
# 列出最近部署（含 version ID），默认显示最近若干条
npx wrangler deployments list

# 回滚到上一个版本
npx wrangler rollback --message "Revert wrong price on FB-2317"

# 或回滚到指定版本
npx wrangler rollback <VERSION_ID> --message "reason"
```

控制台路径：`Workers & Pages` → 选 Worker → `Deployments` → 目标版本右侧三点 → `Rollback`。

已知限制与注意：

- 可回滚范围：最近 **100** 个已发布版本。
- **回滚只回退 Worker 代码与随之打包的静态资源，不回退 D1 数据**。本站静态内容（含价格）随 Worker 版本一同发布，因此回滚**能**恢复上一版价格与文案——这正是它适合此场景的原因；但已入库的 RFQ 数据不受影响（这是好事）。
- 回滚后应**保留 git 记录**：打一个 stable tag 并从该点切分支修 bug，避免下一次 push 又把坏版本推上去。

**结论要点**：给客户的承诺应是「**上线 3-8 分钟，回退几秒钟**」。把这个组合讲清楚，这条抱怨基本不会升级。

### 10.5 SKU 容量模型：500-800 款到底行不行

回答确认问题：**我原先说的「首批 ≤300」与客户「几百款」不冲突**——300 是我为「先跑通管线」给的首批建议值，不是技术天花板；「几百款」是客户的量级目标。二者是不同维度，**500-800 款没有原则性障碍。**

真正的风险点需要换一个位置看。构建时长只是可见成本，**隐式成本是产出资源数**：

| SKU 数 | 源图数（×6/款） | 图片变体产出（4 档宽 × 2 格式 + 原图 ≈ 9/张） | 预估构建时长（GitHub Actions 标准 runner） |
|---|---|---|---|
| 300 | 1,800 | ≈ 16,000 | 约 1-2 分钟 |
| 500 | 3,000 | ≈ 27,000 | 约 2-4 分钟 |
| 800 | 4,800 | ≈ 43,000 | 约 4-7 分钟 |
| 1,000 | 6,000 | ≈ 54,000 | 约 5-8 分钟 |

**所以安全线不在 `astro build`，而在 `wrangler deploy`。**

必须警惕的一个陷阱：**不要把 Cloudflare Pages 的「每站点 20,000 文件」限额套用到本项目**——那是 Pages 的限额，本项目部署在 **Workers**（静态 Assets），两者限额不同。正因为不同，才更需要先在 staging 实测：**用 800 款的真实数据跑一次完整 `wrangler deploy`，确认能成功。** 这一步必须在承诺客户「一口气上 800 款」之前做。

**降低资产数的杠杆（按需启用，效果最显著的一个先上）**

| 杠杆 | 做法 | 效果 |
|---|---|---|
| **压变体数（首选）** | `widths` 从 `[400,600,800,1200]` 降到 `[400,800,1200]`，`formats` 暂时只留 `webp`（AVIF 编码更慢且多一倍文件） | 变体从 ~9/张 降到 ~4/张，**资产数直接减半**（800 款 → 约 19,000） |
| 混合策略 | 列表卡片只出 1 张封面 + 2 档宽；PDP 才出多档 | 进一步压低 |
| 迁 CDO 按需转换 | 产品图改走 Cloudflare Images 按需生成 | 部署资产数降到极低，但引入额外依赖与费用 |

**建议：首批上线前，先按客户的真实图片跑一次「800 款压力部署」验证。若 `[400,600,800,1200] × [webp,avif]` 直接失败，第一反应是把 AVIF 关掉再试，不要急着改架构。**

**构建时长结论（已确认，2026-10-02）**

- **≤300 SKU（约 1800 图）：构建约 2 分钟**（GitHub Actions 标准 runner，与 §6.1 给 PM 的首批建议一致），不构成任何风险，可直接承诺客户。
- **500-800 款：构建预估 2-7 分钟**（见上表：500 款约 2-4 分钟，800 款约 4-7 分钟）。构建时长本身仍在 CI 可接受范围，**真正的分流判据是部署资产数**（上文约 27,000-43,000 个变体文件）与 staging 实测结果，而不是 build 跑多久。

**500-800 款的分流建议（按序执行）：**

1. **首选：分批上线。** 首批 ≤300 款先跑通管线与部署验证，其余按产品线分批补充（每批一轮 CI 构建部署，客户侧无感知差异，且每批都是一次真实的回滚点）。这与 §6.1 的首批建议、OD-03 的首批素材节奏天然对齐。
2. **备选：升级付费计划。** 仅当客户明确要求一次性全量上线、且 800 款 staging 压力部署实测失败时启用——升级 Workers Paid（见 §10.6 处置预案）解除 Workers 侧配额顾虑，必要时同时评估提高 CI runner 规格。不要为「可能用得上」提前付费。

### 10.6 Cloudflare 用量观测（回应 W-5：不能只靠控制台告警）

先说一条必须承认的限制：**在 Free 计划上，Cloudflare 是否提供「Workers 请求配额」这类原生告警条目，以及是否需要付费计划才能启用，取决于账户与当时产品形态。** 把它当成唯一防线是危险的——因此采用**双层**，其中第二层是我们自己实现的、不依赖计划的确定性观测。

**第一层（尽力而为）：Cloudflare Notifications**
在控制台 `Notifications` 中为 Workers 与相关产品线配置通知，先创建 Destination（邮件 / Webhook），再创建通知条目并指定目标。此层作为补充。

**第一层的具体配置步骤（控制台操作，部署 checklist 必含）：**

1. **创建通知目的地**：控制台右上角头像 → `My Profile` → `Notifications` → `Destinations` → `Add destination`，填入客户告警邮箱，完成验证邮件确认（未验证的 Destination 不会发送）。
2. **创建通知条目**：控制台左侧 `Notifications` → `Add notification` → 产品线选 `Workers`，事件类型选请求用量/配额类条目，通知方式关联上一步创建的 Destination。
3. **计划限制确认**：若账户上找不到「Workers 请求配额」类事件条目，说明 Free 计划未提供该原生告警——此层即视为缺席，**第二层从可选变为必做**。不得因第一层配置完成而跳过第二层。
4. 以上两步与第二层看门狗 Worker 的部署，一并写入 §12.11 上线前门禁（已有勾选项「Cloudflare 用量告警已配置（W-5）」，勾选前提是本节 1-3 步 + 第二层全部完成）。

**第二层（必做，确定性）：自建用量看门狗 Worker**

用一个 Cron 触发的 Worker 查询 Cloudflare GraphQL Analytics API 当日用量，达标即用**我们已经在用的 Resend** 发告警邮件。这条链路不依赖 Cloudflare 的计划分级。

```toml
# wrangler.toml
[triggers]
crons = ["0 12 * * *"]   # 每日 UTC 12:00（避开 UTC 00:00 重置瞬间）
```

```ts
// worker/lib/watchdog.ts —— 伪代码骨架，实现时按 GraphQL Analytics API 真实 schema 核字段名
const WORKERS_DAILY_LIMIT = 100_000;
const WARN_THRESHOLD = 0.7;   // 70% 即告警，留出处理时间

export async function checkQuota(env: Env): Promise<void> {
  const requests = await queryWorkersRequestsToday(env.CF_API_TOKEN, env.CF_ACCOUNT_ID);
  const ratio = requests / WORKERS_DAILY_LIMIT;
  if (ratio >= WARN_THRESHOLD) {
    await sendMail({
      to: env.ALERT_EMAIL,
      subject: `[ jewelry-b2b ] Workers 用量 ${(ratio * 100).toFixed(0)}%`,
      body: `今日已用 ${requests} / ${WORKERS_DAILY_LIMIT} 请求。\n` +
            `超限后 CF 将返回 429，RFQ 提交会失败。\n` +
            `处置：①升级 Workers Paid（$5/月，含 1000 万请求）②排查异常流量。`,
    });
  }
}
```

配套要求：

1. **告警阈值 70%，不要设 95%** —— 留出发现到处置的时间窗。
2. `/api/v1/health` 增加 `usage` 字段返回当日请求数，供人工随时查看。
3. 处置预案写入运维手册：** Workers Paid `$5/月` 含 1000 万请求/月**（足够），升级是分钟级操作，不必事前买。
4. 同时给 RFQ 端点加**独立的**应用层速率限制（见 §8.4 的 429 定义），使 Worker 层配额耗尽之前，应用层先拦住异常流量。

**为什么这一条要这么重**：Workers 配额耗尽的表现是 Cloudflare 直接返 **429**，我们的 Worker 代码不会被调用、不会写日志、不会进 D1——**买家只会看到提交失败，而我们在自己的监控里什么都看不到**。这是典型的「静默丢询盘」，也是最贵的故障模式。

## 11. Astro 7 已知坑（硬约束，违反必炸）

以下来自 Astro 5 → 7 的真实迁移事故复盘。**全部列为验收项。**

| # | 坑 | 正确写法 | 错误写法（会静默失败或报错） |
|---|---|---|---|
| 11.1 | **集合必须用 loader** | `defineCollection({ loader: glob({...}), schema })` | `defineCollection({ type: 'content', schema })` — Astro 7 已移除 |
| 11.2 | **Zod 从 `astro/zod` 导入** | `import { z } from 'astro/zod'` | `import { z } from 'astro:content'` — 旧写法，2026 年前的教程几乎全是错的 |
| 11.3 | **配置文件位置** | `src/content.config.ts` | `src/content/config.ts` — Astro 7 **拒绝识别**，集合会静默变空（极难排查） |
| 11.4 | **没有 `entry.slug`** | 使用 `entry.id` | `entry.slug` — 全部路由/链接/RSS/搜索结果都要替成 `id` |
| 11.5 | **渲染 API 改了** | `import { render } from 'astro:content'; const { Content } = await render(entry)` | `await entry.render()` |
| 11.6 | **Sitemap 输出改名** | `robots.txt` 与 Search Console 指向 `sitemap-index.xml` | 仍写 `sitemap.xml` — 404，SEO 静默失效 |
| 11.7 | **编译器更严格（Rust 重写）** | 标签必须闭合；行内标签间如需空格要显式写 `{' '}` | 依赖旧编译器自动纠正未闭合标签 — Astro 7 直接抛错 |
| 11.8 | **`getCollection()` 顺序不确定** | 拿到后**必须自己 sort** | 依赖返回顺序 — 平台相关，本地与 CI 结果可能不同（典型沉默逻辑错误） |
| 11.9 | **`output: 'hybrid'` 已移除** | 用 `output: 'static'` + 单页 `export const prerender = false` | `output: 'hybrid'` — Astro 5 起已删除 |
| 11.10 | **Markdown 处理器换了** | Astro 7 默认处理器为 **Sütterlin** | 沿用旧的 remark/rehype 配置会报 warning，部分插件不再兼容 |
| 11.11 | **图片目录陷阱** | 图片放 `src/assets/` | 放 `public/` 则完全跳过优化 — 检查 CI 脚本防止回退 |
| 11.12 | **pagefind 索引污染** | 用 `data-pagefind-body` 限定正文；排除 nav/header/footer | 不做限定 → 每个词命中每个页面，搜索形同失效 |

**额外一条针对 LLM 生成代码的纪律**：以上每一条都是"编译能过 / 跑得起来 / 结果错误"的高发地带（尤其 11.3 与 11.8）。实现时**先按本表逐项 grep 自检**，再谈功能完成。

---

## 12. 端到端验证步骤

从干净克隆到验收通过的**可执行**路径。**跑不通即未交付。**

### 12.1 本地环境

```bash
node --version            # 必须 >= 22.12.0；低于则先升 Node
npm --version             # >= 9.6.5
npm ci
```

### 12.2 依赖存在性核验（防幻觉依赖）

```bash
# 每个依赖必须能解析到真实版本；不符合 §2 表格即刻停手
npm view astro version                    # 期望 7.3.5
npm view @astrojs/cloudflare version      # 期望 14.3.3
npm view tailwindcss version              # 期望 4.3.3
npm view astro-icon version               # 期望 1.2.0
npm view @iconify-json/lucide version     # 期望 1.2.138
npm view @nanostores/persistent version   # 期望 1.3.5
npm view pagefind version                 # 期望 1.5.2
npm view resend version                   # 期望 6.31.0
```

### 12.3 类型与构建门禁（幻觉 import 在这里就该红）

```bash
npx astro check           # 类型检查，必须 0 error
npm run build             # 必须成功
```

### 12.4 静态性断言（证明这是 SEO 站而非 JS 站）

```bash
# 1) 首页 HTML 必须直接包含产品标题文本（不经 JS）
grep -c "Stainless" dist/index.html        # 期望 >= 1，为 0 则说明走成了 CSR，FAIL

# 2) 禁止全站范围内的 JS 框架运行时（island 除外）
grep -c "lucide-react" dist/**/*.js        # 期望 0
find dist -name "*.js" -size +50k | wc -l  # 期望很小的数字（仅 island）

# 3) 首屏 JS 体积预算
du -sh dist/_astro/*.js                    # 合计应 < 60KB gzip
```

### 12.5 SEO 断言

```bash
# sitemap 必须存在且为 Astro 7 的新命名
test -f dist/sitemap-index.xml && echo OK || echo "FAIL: sitemap 命名未更新"

# hreflang：V1 只应有 x-default 一条指向页面自身（§6.2 裁决）
grep -c 'hreflang="x-default"' dist/products/index.html     # 期望 >= 1
# 断言不得存在其他 hreflang 语种条目（V1 单层英文）
grep -o 'hreflang="[a-z-]*"' dist/products/index.html | sort -u   # 期望只有 x-default

# 断言不存在 /zh/ 路由产物
test -d dist/zh && echo "FAIL: 出现了不应存在的 /zh/ 路由" || echo "OK: 无 /zh/ 路由"

# 断言未渲染语言切换器（含禁用态）
grep -ric 'language switcher\|lang-switcher\|switchLanguage' dist/ | grep -v ':0' && echo "FAIL: 出现语言切换器" || echo "OK: 无语言切换器"

# 断言不存在任何中文字体资源（§10.2）
find dist -iname "*.woff2" | wc -l                          # 只应有英文字体，逐一核对清单
grep -ril "Noto Sans SC\|HarmonyOS" dist/ | wc -l           # 期望 0

# JSON-LD 存在且语法合法
node -e "const fs=require('fs');const s=fs.readFileSync('dist/products/demo-sku/index.html','utf8');const m=s.match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/); if(!m) throw new Error('no JSON-LD'); const j=JSON.parse(m[1]); if(j.offers['@type']!=='AggregateOffer') throw new Error('expected AggregateOffer, got '+j.offers['@type']); console.log('JSON-LD valid, AggregateOffer OK')"

# robots.txt 指向新 sitemap
grep "sitemap-index.xml" dist/robots.txt   # 必须命中
```

### 12.5.1 价格渲染断言（§6.7.1 裁决：卡/PDP 必须展示参考区间 + MOQ）

```bash
# 1) 价格区间与限定语必须同时出现 —— 只给区间不给限定语视为未完成
grep -c "Reference range" dist/products/demo-sku/index.html        # >= 1
grep -c "quoted per order" dist/products/demo-sku/index.html       # >= 1

# 2) MOQ 必须按款标注且为区间语义（禁止被压缩成单点值）
grep -o 'MOQ[^<]*' dist/products/demo-sku/index.html               # 形如 MOQ 24 pcs

# 3) 禁止在公共页面出现阶梯价表结构（table.tiered-price / tiers 容器）
grep -c 'tiered-price\|price-tiers' dist/products/demo-sku/index.html   # 期望 0

# 4) 不得出现隐藏价格的兜底文案（§6.7.1 降级必须走 "On request"）
grep -ci 'contact for price\|price on request only' dist/ | grep -v ':0' && echo "FAIL" || echo "OK"

# 5) 款式量级不得写成精确数（客户只确认了 "hundreds of styles"）
grep -oE '[0-9]{1,4}\+? (styles|SKUs|designs)' dist/index.html      # 命中即为失真，需人工核对
```

### 12.6 图片性能断言

```bash
# 无 1200px 以上的输出图
find dist -name "*.webp" -o -name "*.avif" | head -50 | xargs -I{} sh -c 'identify -format "%w %h %p\n" "{}" 2>/dev/null' | awk '$1>1200 || $2>1200' | wc -l   # 期望 0

# 无超大图
find dist -name "*.webp" -size +120k | wc -l    # 期望 0

# 资产总数 —— 部署前必看（§10.5，这是真正的安全线）
find dist -type f | wc -l                       # 记录数值，与 staging 实测上限对比

# 中文字体：V1 全站不应存在任何 CJK 字体
find dist -iname "*.woff2" -o -iname "*.woff" -o -iname "*.ttf" | wc -l   # 逐一核对，不得含 CJK
grep -rl "Noto Sans SC\|HarmonyOS" dist/ | wc -l   # 期望 0
```

### 12.7 搜索验证

```bash
npx pagefind --site dist            # 生成 dist/pagefind/
ls dist/pagefind/ | head            # 应有 index/ 与 pagefind-entry.json 等
test -d dist/pagefind/index && echo "pagefind OK"
```

浏览器手测三条：
1. 输入完整 SKU（如 `FB-2317`）→ L1 精确命中，直达 PDP。
2. 输入错一位 SKU（如 `FB-2318`）→ L2 展示 "Did you mean: FB-2317?"。
3. 输入 `316L nickel free` → L3 返回相关产品页与合规专题页，**且不应返回全部 1000 个 SKU**（验证 `data-pagefind-body` 已生效）。

### 12.8 RFQ 主链路（核心成功流）

```bash
npx wrangler d1 migrations apply jewelry-b2b-global-db --local
npx wrangler dev
```

```bash
# 成功流
curl -i -X POST http://localhost:8787/api/v1/rfq \
  -H 'Content-Type: application/json' \
  -d '{"turnstileToken":"<test-token>","honeypot":"","formLoadedAt":'"$(($(date +%s)*1000-60000))"',"contact":{"company":"T","name":"A","email":"a@b.com","country":"FR"},"shipping":{"destinationMarket":"eu_uk","incoterm":"FOB","quantityScale":"sample"},"items":[{"sku":"FB-2317","qty":60}],"message":"hi","locale":"en"}'
# 期望：HTTP 201，body 含 reference —— 且客户邮箱收到通知邮件
```

### 12.9 错误流（每条都要有断言，缺一条视为未覆盖）

```bash
# E1 Turnstile 失败 → 400 INVALID_TURNSTILE
# E2 重复提交同一 token → 400 TOKEN_ALREADY_USED（且前端须 re-render）
# E3 缺 email → 422 VALIDATION_ERROR，data.fields 指出 email
# E4 honeypot 非空 → 静默 201 但数据标记 spam（不写入主表）
# E5 连续 6 次 → 429 RATE_LIMITED
# E6 断网 D1 → 500 PERSIST_FAILED，不得返回 201
```

**E6 是最关键的一条**：验证时可通过临时改坏 D1 binding 触发。写入失败却返回成功，是本项目最贵的沉默逻辑错误——客户永远收不到询盘。

### 12.10 合规与无障碍

```bash
# 每个交互图标都有无障碍文本
grep -c 'aria-hidden="true"' dist/products/demo-sku/index.html   # >= 1

# Pagefind 不得索引 nav/footer
grep -c 'data-pagefind-body' dist/products/demo-sku/index.html   # == 1
```

### 12.11 上线前门禁汇总

- [ ] `npx astro check` 0 error
- [ ] `npm run build` 成功
- [ ] §12.4 静态性三断言全绿
- [ ] §12.5 SEO 四断言全绿
- [ ] §12.6 图片 + 字体三断言全绿
- [ ] §12.7 搜索三条手测全过
- [ ] §12.8 成功流 201 + 邮件到达
- [ ] §12.9 六条错误流逐条验证
- [ ] Lighthouse 移动端 LCP < 2.5s / CLS < 0.1 / TBT < 200ms
- [ ] Cloudflare 用量告警已配置（W-5）

---

## 13. v2 演进路径（证明现在的选择不会把自己逼死）

| v2 需求 | 如何承接 | 迁移成本 |
|---|---|---|
| 会员登录 + 会员批发价 | Worker 加会话（Cloudflare 原生 Auth 或第三方）；产品页**现在就**把价格 JSON-LD 与展示层解耦，届时来电価格 tier 替换即可 | 中 |
| 在线下单 | D1 已有 `rfq_items`，加 `orders`/`order_items` 表；静态产物仍主导，仅结算走 SSR | 中 |
| 后台管理 | Worker + Admin SPA（同 Cloudflare 部署），不换栈 | 中 |
| 库存 / 实时报价 | 现有架构不行，需引入 D1 实时查询或 KV。届时 SKU 页改 `prerender=false` | 高（这是唯一会痛的一处，但 MVP 不需要） |
| Headless CMS | Content Layer 天然支持自定义 loader，**只需换 loader，页面代码不动** | 低 |
| 多语言扩展至 5 语种 | i18n 字典 + 目录按 locale 分，**不需改路由结构** | 低 |

**关键的性质保留**：CMS、榆 i18n 语种、多加产品线这三类变更都不触碰渲染层——这正是 Content Layer 抽Loader 的价值。MVP 现在多花的这点结构成本，在 v2 全部兑现。

---

## 14. 关联文档

| 文档 | 路径 |
|---|---|
| PRD | `docs/PRD.md` |
| UI/UX 与设计规范 | `docs/UIUX.md` |
| Design Tokens（DTCG） | `docs/design-tokens.json` |
| **OpenAPI 契约** | `docs/api-spec.yaml` |
| ADR-001 渲染框架 | `docs/decisions/ADR-001-astro-static-first.md` |
| ADR-002 否决 Next.js | `docs/decisions/ADR-002-no-nextjs.md` |
| ADR-003 内容源策略 | `docs/decisions/ADR-003-content-source.md` |
| ADR-004 多语言策略 | `docs/decisions/ADR-004-i18n-routing.md` |
| ADR-005 部署平台 | `docs/decisions/ADR-005-cloudflare.md` |
| ADR-006 询盘后端 | `docs/decisions/ADR-006-rfq-backend.md` |
| ADR-007 搜索方案 | `docs/decisions/ADR-007-search.md` |
| ADR-008 图标库锁定 | `docs/decisions/ADR-008-icon-library.md` |
| ADR-009 客户端状态 | `docs/decisions/ADR-009-client-state.md` |
| ADR-010 样式方案 | `docs/decisions/ADR-010-styling.md` |
| ADR-011 v2 演进边界 | `docs/decisions/ADR-011-v2-boundary.md` |
