# 脚手架实施说明（架构师产出）— jewelry-b2b-global

> 作者：高见远（首席架构师） ｜ 日期：2026-10-02 ｜ 读者：Phase 3 前端 / 后端工程师
> 性质：**契约级实施说明**。Phase 3 按本文执行不走样；与直觉冲突时以本文 + ARCHITECTURE §2 为准。
> 版本依据：docs/ARCHITECTURE.md §2 版本锚定表（2026-10-01 经 npm registry 核实）。任何依赖版本与 §2 冲突时以 §2 为准，本文不凭记忆引入 §2 之外的版本号。
> 活规格：实现中发现本文与 reality 冲突，先回来改本文（或提给架构师改 ARCHITECTURE），再改代码。

---

## 1. 仓库布局与项目根目录

**项目根目录 = 工作区根**（与 docs/ 平级），不是 docs/ 的子目录。下表是对 ARCHITECTURE §5.1 的落地细化；两处有意调整已在 §1.1 说明。

```
jewelry-b2b-global/                      # = 工作区根
├── astro.config.mjs                     # 唯一 Astro 配置，只做装配（CO-3）
├── content.config.ts?                   # 不存在——集合定义必须在 src/content.config.ts（§11.3 坑，见 §6）
├── package.json                         # 见 §2
├── tsconfig.json                        # extends astro/tsconfigs/strict
├── .dev.vars                            # 本地密钥（gitignore，见 §3.3），不提交
├── docs/                                # PRD / SPEC / ARCHITECTURE / api-spec.yaml / decisions/
├── infra/
│   ├── schema.sql                       # D1 建表（本文档同批产出）
│   ├── wrangler.jsonc                   # Workers 配置骨架（本文档同批产出）
│   └── migrations/                      # 备用；V1 直接用 schema.sql 整库初始化
│
├── src/
│   ├── content/
│   │   ├── products/                    # {line}/{sku}.md，18-24 个 demo SKU（dataStatus: placeholder）
│   │   ├── product-lines/               # 三产品线落地页文案
│   │   ├── compliance/                  # 合规专题（EN 1811 子专题长文）
│   │   ├── blog/                        # 6 篇种子文章 MDX
│   │   └── pages/                       # 政策类单页（samples / shipping-payment 等）
│   │
│   ├── i18n/
│   │   ├── en.json                      # V1 唯一字典；组件禁止硬编码文案，一律 t(key)（ADR-004）
│   │   └── index.ts                     # t() 入口 + UiKey 类型（写法照抄 ARCHITECTURE §6.2）
│   │
│   ├── stores/                          # nanostores 客户端状态（调整说明见 §1.1）
│   │   ├── rfq.ts                       # rfqItems persistentAtom('rfq_v1') + rfqCount + addToRfq
│   │   └── compliance.ts                # complianceContext persistentAtom('compliance_v1', 'eu_uk')
│   │
│   ├── lib/                             # 纯函数与构建期工具（CO-4：按资源分包，不按层分包）
│   │   ├── seo/                         # jsonld.ts / breadcrumbs.ts / canonical.ts
│   │   ├── rfq/                         # schema.ts（请求体 Zod，从 astro/zod 导入）
│   │   ├── products/                    # queries.ts / sku-index.ts
│   │   ├── server/                      # 仅 API 路由可 import：db.ts / mail.ts / turnstile.ts
│   │   │                                #   ratelimit.ts / ulid.ts / reference.ts
│   │   └── shared/                      # cn.ts / format.ts（前后端共用纯函数）
│   │
│   ├── components/
│   │   ├── layout/                      # Header.astro / Footer.astro / SeoHead.astro / UtilityBar.astro
│   │   ├── product/                     # ProductCard.astro / SpecTable.astro / Gallery.astro
│   │   │                                # 注意：不存在公共阶梯价表组件（§6.7.1 裁决，阶梯价只进 RFQ 报价环节）
│   │   ├── rfq/                         # RfqDrawer.astro + rfq-drawer.ts（交互脚本，见 §1.1）
│   │   ├── search/                      # SearchDialog.astro + search-dialog.ts
│   │   └── ui/                          # Button.astro / Badge.astro / Icon.astro
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro             # <html lang="en">、hreflang 仅 x-default、字体分路由加载常量 LOAD_CJK_FONT=false
│   │   └── ProductLayout.astro
│   │
│   ├── pages/                           # 15 页 + 3 API，路由逐字对齐 SPEC §7
│   │   ├── index.astro                                     # 1 首页
│   │   ├── product-lines/
│   │   │   └── [line].astro                                # 2-4 三产品线（getStaticPaths 产出 3 个静态页）
│   │   ├── products/
│   │   │   ├── index.astro                                 # 5 全站目录（筛选 sidebar）
│   │   │   └── [sku].astro                                 # 6 PDP
│   │   ├── rfq/index.astro                                 # 7 RFQ 询价篮独立页
│   │   ├── sourcing-partners/index.astro                   # 8 合作产线与质控
│   │   ├── compliance/
│   │   │   ├── index.astro                                 # 9 合规与检测中心
│   │   │   └── nickel-release-en-1811.astro                # 10 镍释放子专题
│   │   ├── samples/index.astro                             # 11 样品政策
│   │   ├── shipping-payment/index.astro                    # 12 物流与付款
│   │   ├── faq/index.astro                                 # 13 FAQ
│   │   ├── blog/
│   │   │   ├── index.astro                                 # 14 Blog 内容中心
│   │   │   └── [slug].astro                                #     6 篇文章详情
│   │   ├── contact/index.astro                             # 15 联系我们
│   │   ├── markets/                                        # P1 预留：middle-east.astro / europe-uk.astro
│   │   └── api/v1/                                         # 全部 export const prerender = false
│   │       ├── rfq.ts                                      # POST /api/v1/rfq
│   │       ├── newsletter.ts                               # POST /api/v1/newsletter
│   │       └── health.ts                                   # GET  /api/v1/health
│   │
│   ├── styles/global.css                # @import "tailwindcss" + design-tokens 映射（CSS-first theme）
│   └── assets/                          # 图片只放这里（CO-5）；public/ 仅 robots.txt/favicon/pagefind 产物
│
├── public/                              # 原样拷贝，不放产品图
├── scripts/build-sku-index.mjs          # did-you-mean 索引
├── .github/workflows/deploy.yml         # build → pagefind → wrangler deploy（本期不实部）
└── .gitignore                           # 必含：node_modules / dist / .astro / .wrangler / .dev.vars / .dev/
```

### 1.1 对 ARCHITECTURE §5.1 的两处有意调整（活规格，已裁决）

| # | §5.1 原文 | 本文裁定 | 理由 |
|---|---|---|---|
| 1 | `RfqDrawer.tsx` / `SearchDialog.tsx` 为 React island | 改为 **vanilla TS 交互模块**（`.astro` 壳 + 同目录 `.ts` 脚本，经 nanostores `onMount`/`task` 订阅状态），**全项目不引入 react / react-dom / @astrojs/react** | 两个 island 交互均为"读写 store + 开合抽屉"级复杂度，vanilla 足够；省掉一个运行时与 3 个依赖；§2 版本表未锁定 react 版本，引入即需二次核实且扩 JS 预算。§2 是唯一版本真源，不得凭记忆补 react 版本号 |
| 2 | nanostores 状态文件放 `lib/rfq/store.ts`、`lib/compliance/store.ts` | 移到 **`src/stores/`**；`lib/` 只留纯函数 | 状态文件被浏览器 bundle 加载，纯函数多为构建期/服务端使用，分离后"谁能进 client bundle"一目了然，防止 API-only 模块（db/mail）被误 import 进浏览器 |

ARCHITECTURE §5.1 后续修订时应同步这两条；修订前以本文为准。

---

## 2. package.json 依赖清单（版本以 ARCHITECTURE §2 为唯一真源）

```jsonc
{
  "name": "jewelry-b2b-global",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },     // Astro 7.3.5 engines.node（§2）

  "scripts": {
    "dev": "astro dev",                   // 本地含 API 路由 + D1（platformProxy，见 §3）
    "check": "astro check",               // 类型门禁，0 error 才算过
    "build": "astro check && astro build && pagefind --site dist",
                                          // SPEC §12：build = check + 构建 + 索引，任一失败即门禁失败
    "preview": "astro preview",           // 静态产物预览（无 API）
    "workers:dev": "wrangler dev -c infra/wrangler.jsonc",
                                          // 生产形态冒烟：静态 + API + 真实 workerd 运行时
    "db:init": "wrangler d1 execute jewelry-b2b-global-db --local --file=infra/schema.sql",
    "db:init:remote": "wrangler d1 execute jewelry-b2b-global-db --remote --file=infra/schema.sql",
    "wrangler": "wrangler"
  },

  "dependencies": {
    "astro": "7.3.5",                                  // §2，精确锁定
    "@astrojs/cloudflare": "14.3.3",                   // §2，精确锁定
    "@astrojs/mdx": "^8.0.2",                          // 2026-10-02 核验：registry 实际为 8.0.2，本表原写 ^7.0.0 系 §2 时期值，按活规格修正
    "@astrojs/sitemap": "^3.7.0",                      // 2026-10-02 核验：3.7.4
    "@nanostores/persistent": "1.3.5",                 // §2，精确锁定
    "nanostores": "^1.5.4",                            // 2026-10-02 核验：1.5.4，在 persistent@1.3.5 peer 区间内
    "astro-icon": "1.2.0",                             // §2
    "@iconify-json/lucide": "1.2.138",                 // §2，图标唯一数据源（CO-6）
    "tailwindcss": "4.3.3",                            // §2，CSS-first theme
    "@tailwindcss/vite": "4.3.3",                      // §2 明示「同版本配套」
    "resend": "6.31.0"                                 // §2，Workers 兼容
  },

  "devDependencies": {
    "wrangler": "^4.125.0",                            // §2：adapter peer 要求（2026-10-02 核验安装 4.145.0）
    "pagefind": "1.5.2",                               // §2，extended release
    "@astrojs/check": "0.9.10",                        // 2026-10-02 npm view 核验回填
    "typescript": "6.0.3"                              // 2026-10-02 修正：7.0.2 与 @astrojs/check@0.9.10 peer（^5||^6）冲突，取 6.x 最新
  }
}
```

> **2026-10-02 版本核验结论**：上述全部版本经 `npm view <pkg> version` 实测——astro 7.3.5 / @astrojs/cloudflare 14.3.3 / tailwindcss 4.3.3 / @tailwindcss/vite 4.3.3 / astro-icon 1.2.0 / @iconify-json/lucide 1.2.138 / @nanostores/persistent 1.3.5 / nanostores 1.5.4 / pagefind 1.5.2 / resend 6.31.0 / wrangler 4.145.0 / @astrojs/check 0.9.10 / typescript 6.0.3 / @astrojs/mdx 8.0.2 / @astrojs/sitemap 3.7.4。两处与原表不符：@astrojs/mdx（原写 ^7.x，实际已到 8.0.2）、typescript（原核验 7.0.2 因 peer 冲突降为 6.0.3），已按活规格修正，无其他漂移。「未锁版本处理」一节已完成，本段留作核验记录。

**三条有意"缺席"的依赖（Phase 3 不得顺手安装）：**

| 缺席项 | 原因 |
|---|---|
| `zod`（独立安装） | §2 明令禁止：**从 `astro/zod` 导入**（`import { z } from 'astro/zod'`），不得单独安装 zod 并用它替代（§11.2 坑）。Content Collections schema 同样用 `astro/zod` |
| `react` / `react-dom` / `@astrojs/react` | 见 §1.1 裁定 #1，全项目无 React 运行时 |
| `sharp`（显式安装） | 随 astro 7.3.5 依赖带入（astro 依赖 sharp ^0.35.4，§2）。不单独写版本号，`npm ls sharp` 核验即可 |

**未锁版本处理（@astrojs/check / typescript）：** §2 未锚定这两个包的版本。Phase 3 安装时执行 `npm view @astrojs/check version`、`npm view typescript version`，**把回显版本写回本节与本表**，再 `npm i`。这是存在性核验纪律（生成式代码失效模式 §3），不是可选项。禁止写 `latest` 进 package.json。

**装完必跑的版本核验（写入 CI，防漂移，照抄 ARCHITECTURE §2）：**

```bash
npm view astro version                    # 期望 7.3.5
npm view @astrojs/cloudflare version      # 期望 14.3.3
npm view tailwindcss version              # 期望 4.3.3
npm view astro-icon version               # 期望 1.2.0
npm view @iconify-json/lucide version     # 期望 1.2.138
npm view @nanostores/persistent version   # 期望 1.3.5
npm view pagefind version                 # 期望 1.5.2
npm view resend version                   # 期望 6.31.0
npm view wrangler version                 # 期望 >= 4.125.0
```

---

## 3. 本地开发策略（静态页 + API + D1 一条命令跑通）

### 3.1 总体形态

- `astro.config.mjs` 使用 `@astrojs/cloudflare` adapter，并开启 `platformProxy`：

```js
// astro.config.mjs（只做装配，CO-3）
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',                                   // §11.9：static 模式，API 路由单页关闭预渲染
  adapter: cloudflare({
    platformProxy: { enabled: true },                 // 关键：本地 astro dev 注入 D1 等 bindings
  }),
  vite: { plugins: [tailwindcss()] },
  integrations: [/* mdx, sitemap, icon */],
  site: 'https://example.com',                        // sitemap/canonical 用，上线前改真实域名
});
```

- `output: 'static'` + 三个 API 路由文件内 `export const prerender = false;`（§11.9：`hybrid` 已移除，禁止使用）。
- 本地 `npm run dev`（astro dev）时，API 路由内通过 `locals.runtime.env.DB` 拿到本地 D1 绑定（wrangler platformProxy 读取 infra/wrangler.jsonc）；生产形态冒烟用 `npm run workers:dev`。
- 数据库初始化顺序：`npm run db:init` → `npm run dev`。schema.sql 幂等性不保证（V1 直接整库重建：本地可直接删 `.wrangler/state` 再跑）。

### 3.2 RESEND_API_KEY 缺失时的邮件降级（SPEC §5 硬要求）

- 判定：`env.RESEND_API_KEY` 为空字符串或 undefined 时，`src/lib/server/mail.ts` 走降级分支。
- 降级行为：**不调用 Resend**，把本应发出的两封邮件（内部通知 + 买家回执）追加写入本地日志文件，`mail_status` 置 `'skipped_dev'`，其余流程照常。
- 日志文件路径：`.dev/mail-outbox.jsonl`（项目根，gitignore 必含 `.dev/`）。
- 每行 JSONL 格式：

```json
{"ts":"2026-10-02T08:30:00.000Z","kind":"internal_notification","to":"sales@example.com","reference":"RFQ-2026-0001","subject":"New RFQ RFQ-2026-0001","payload":{...rfq 摘要...}}
{"ts":"2026-10-02T08:30:00.100Z","kind":"buyer_receipt","to":"claire@maisonbleue.fr","reference":"RFQ-2026-0001","subject":"We received your RFQ","payload":{"respondBy":"2026-10-02T16:30:00.000Z"}}
```

- **API 契约不变**：降级路径下 `/api/v1/rfq` 仍返回 201 + reference；D1 写入仍真实执行。禁止因缺密钥返回 500。
- 配套：`.dev/` 加入 .gitignore；给 Phase 3 的提示——降级分支也要进错误流测试（密钥存在但 Resend 报错时 `mail_status='failed'`，不影响 201，因为记录已入库，对应 api-spec 的 500 MAIL_FAILED 语义）。

### 3.3 Turnstile 本地开发密钥

Turnstile 的**站点密钥（sitekey，前端用）**与**服务端密钥（secret，后端用）**是两个东西，测试密钥必须成对使用，不得混用：

| 角色 | dev 测试值 | 行为 |
|---|---|---|
| sitekey（前端 widget） | `1x00000000000000000000AA` | 可见挑战，恒通过——前端开发无需任何配置 |
| secret（后端 siteverify） | `1x0000000000000000000000000000000AA` | siteverify 恒返回成功 |

落地方式：

- 前端 sitekey 放在 `src/i18n/en.json` 之外的公开常量（它是公开值，可进代码），dev/生产由 env 区分。
- 后端 secret 写进 `.dev.vars`（gitignore）：`TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`。platformProxy 会把 .dev.vars 注入 `locals.runtime.env`。
- 生产用真实 sitekey/secret：sitekey 进部署 env，secret 走 `wrangler secret put`（infra/wrangler.jsonc 里保持空占位，禁止写真实值）。
- 测试专项：需要测"校验失败"分支（E1/E2）时，把 secret 换成恒失败测试密钥 `2x0000000000000000000000000000000AA`。另记 §6.3 的坑：**token 单次有效**，提交失败后前端必须重新渲染 widget。

---

## 4. ULID 与 reference 生成规则

### 4.1 ULID（不引入重依赖，实现要点 ≤ 40 行）

位置：`src/lib/server/ulid.ts`。实现要点：

1. 结构：`10 字符时间戳（48bit ms）+ 16 字符随机数（80bit）= 26 字符`，字母表用 **Crockford Base32**：`0123456789ABCDEFGHJKMNPQRSTVWXYZ`（剔除 I/L/O/U，避免人工抄录歧义），全大写。
2. 时间部分：`Date.now()`，从低位到高位每 5 bit 取一个字符（10 次循环）。
3. 随机部分：`crypto.getRandomValues(new Uint8Array(10))`——Workers 与 Node 18+ 均原生提供 Web Crypto，零依赖。每字节取 8 bit 不对齐 5 bit，编码时按 80bit 位流连续切分（用一个 `bits` 累加器变量即可），保证随机位分布均匀。
4. 单调性（同毫秒内多次生成不回退）：模块级缓存 `lastTime/lastRandom`；`now === lastTime` 时对随机部分做 +1 进位（从最低位字符起在字母表内递增，进位溢出则等待下一毫秒）。KV 主键不要求严格单调，但实现单调递增可让同批 INSERT 在 D1 里保持聚簇友好——约 5 行代码，值得。
5. 参考骨架（约 30 行）：

```ts
// src/lib/server/ulid.ts —— Crockford Base32 单调 ULID
const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
let lastTime = -1, lastRand = 0n;                      // 80bit 随机数用 BigInt 承载

export function ulid(now: number = Date.now()): string {
  let rand: bigint;
  if (now === lastTime) {
    rand = lastRand + 1n;                              // 同毫秒单调 +1
    if (rand >> 80n) { rand = randomBits(); }          // 溢出 80bit，等待下一毫秒
  } else {
    rand = randomBits();
  }
  lastTime = now; lastRand = rand;
  let time = now, tail = '', head = '';
  for (let i = 0; i < 10; i++) { head = ENC[time % 32] + head; time = Math.floor(time / 32); }
  for (let i = 0; i < 16; i++) { tail = ENC[Number(rand & 31n)] + tail; rand >>= 5n; }
  return head + tail;
}

function randomBits(): bigint {                        // 10 字节 -> 80bit
  const b = crypto.getRandomValues(new Uint8Array(10));
  let v = 0n; for (const x of b) v = (v << 8n) | BigInt(x); return v;
}
```

6. 验收自测：连续生成 1000 个，断言全部匹配 `/^[0-9A-HJKMNP-TV-Z]{26}$/` 且非降序。

### 4.2 reference 编号规则（RFQ-YYYY-NNNN）

- 规则：`RFQ-` + 当前 UTC 年份 + `-` + 4 位零填充序号，如 `RFQ-2026-0047`。序号**按当年 D1 内计数**，非全局计数（跨年自动归零是特性不是 bug）。
- 生成流程（在 rfq 路由内，与写库同批完成）：

```
year   = new Date().getUTCFullYear()
count  = await env.DB.prepare(
           "SELECT COUNT(*) AS n FROM rfq_inquiries WHERE reference LIKE 'RFQ-' || ?1 || '-%'"
         ).bind(String(year)).first('n')
seq    = (count ?? 0) + 1
ref    = `RFQ-${year}-${String(seq).padStart(4, '0')}`
```

- 写入：`env.DB.batch([...])` 把「INSERT rfq_inquiries（含 reference）+ N 条 INSERT rfq_items」作为**单事务**提交（D1 batch 原子性）。
- 并发撞号：两个请求同刻拿到相同 seq 时，后者 INSERT 触发 reference UNIQUE 冲突。处理：捕获冲突后 `seq += 1` 重试，最多 3 次；仍失败返回 500 PERSIST_FAILED。MVP 询盘量级下该窗口可忽略，**禁止**为此引入自增表或全局锁（过度设计）。
- reference 一旦返回给买家即不可变，邮件主题与 D1 记录共用同一值。

---

## 5. Rate limit 实现要点（429）

位置：`src/lib/server/ratelimit.ts`。MVP 用**内存 Map 固定窗口**，规则对齐 api-spec：**5 次 / 10 分钟**。

```ts
// 要点骨架（非完整实现）
const LIMIT = 5, WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();            // key -> 窗口内时间戳数组

export function rateLimit(ip: string, fingerprint: string) {
  const key = `${ip}:${fingerprint}`;
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= LIMIT) {
    return { allowed: false, retryAfterSeconds: Math.ceil((arr[0] + WINDOW_MS - now) / 1000) };
  }
  arr.push(now); hits.set(key, arr);
  return { allowed: true, retryAfterSeconds: 0 };
}
```

- 取值来源：IP 用 `request.headers.get('CF-Connecting-IP')`（Workers 环境必有；本地 dev 缺失时回退 `'dev-local'`）；指纹 = `SHA-256(User-Agent + Accept-Language)` 前 8 个十六进制字符，用 Web Crypto，零依赖。
- 应用范围：POST /api/v1/rfq 与 POST /api/v1/newsletter 两个端点各自独立计数（newsletter 不应被 RFQ 高频误伤，反之亦然）。
- 超限响应：`429 { code: 429, data: { retryAfterSeconds }, message: "Too many requests. Please try again later." }`，带 `Retry-After` 头。
- 顺带清理：每次调用时顺手删除窗口外 key（`hits.size > 1000` 时全量 sweep 一次），防 Map 无界增长。
- **必须写明的局限**：Workers 多 isolate 下，内存 Map 是"每 isolate 5 次/10 分钟"，全局上限实际更宽松——MVP 可接受。生产升级路径（Phase 3 不做，写进代码注释即可）：Cloudflare WAF Rate Limiting Rule（账户层配置，无代码）。**不要**为此引入 DO/KV——范围外。

---

## 6. 已知坑提醒（Phase 3 上手前逐条读完，全部是验收项）

从 ARCHITECTURE §11 + §6 提炼与本次脚手架直接相关的条目，实现时逐项自检：

| # | 坑 | 执行要求 |
|---|---|---|
| 1 | §11.2 Zod 来源 | 一律 `import { z } from 'astro/zod'`。独立安装 zod = 违规，content schema 与 API 校验两处同罪 |
| 2 | §11.3 配置文件位置 | 集合定义必须放 `src/content.config.ts`。放 `src/content/config.ts` 时 Astro 7 拒绝识别，集合静默变空——最阴险的一类沉默错误，构建不报错 |
| 3 | §11.1 集合必须带 loader | `defineCollection({ loader: glob({...}), schema })`；`type: 'content'` 旧写法在 Astro 7 已移除 |
| 4 | §11.4 无 entry.slug | 路由/链接/搜索索引一律用 `entry.id` |
| 5 | §11.9 输出模式 | `output: 'static'`；API 路由单文件 `export const prerender = false`。`hybrid` 已删除，写了即报错 |
| 6 | §11.8 getCollection 顺序不确定 | 目录页/下拉数据拿到集合后**必须显式 sort**，禁止依赖返回顺序（本地与 CI 可能不同） |
| 7 | §11.6 sitemap 命名 | robots.txt 与 Search Console 指向 `sitemap-index.xml`，不是 `sitemap.xml` |
| 8 | §11.12 Pagefind 索引污染 | 页面正文容器加 `data-pagefind-body`，否则 nav/footer 全量入索引，搜索形同失效 |
| 9 | §6.4 persistentAtom SSR 失配 | `persistentAtom` 预渲染阶段读不到 localStorage，**首屏渲染必须用显式默认值**（compliance 默认 `eu_uk`），SSR 分支禁止触碰 `window`/`navigator.language` |
| 10 | §6.3 Turnstile token 单次有效 | 提交失败（400/422/429）后必须重新渲染 widget 拿新 token，否则用户二次提交必失败——错误分支必须实现 |
| 11 | §12.9 E6 沉默逻辑错误 | D1 写入失败必须 500 PERSIST_FAILED。**写入失败时返回 201 是本项目最贵的错误**——客户永远收不到询盘且无人察觉 |
| 12 | CO-1/CO-3 单文件与装配 | 单文件 ≤ 300 行；astro.config.mjs / 路由文件只做装配，业务逻辑进 `lib/`；`.astro` 组件禁止内联业务逻辑（CO-7） |
| 13 | 图标唯一源 CO-6 | 只经 `<Icon name="lucide:...">`（astro-icon + @iconify-json/lucide）。禁 emoji 图标、禁手写 `<svg>`、禁第二图标包 |
| 14 | 硬编码色禁令 | 一切色值走 Tailwind theme（design-tokens.json 注入）；代码里只允许 #fff/#000 例外。禁紫→粉渐变 |
| 15 | ADR-004 i18n 禁令 | 无 `/zh/` 路由、无语言切换器（含禁用态）、无 locale 重定向、无 negotiator 依赖。UI 文案全部走 `t(key)` |

---

## 7. 完成定义（收尾即验证）

Phase 3 的完成定义直接引用 SPEC §12 端到端验证步骤（唯一依据，不在此复述）。补充三条脚手架级前置断言：

```bash
npx astro check                 # 0 error
npm run db:init && npm run dev  # D1 建表成功、/api/v1/health 返回 200 + db:up
grep -c "skipped_dev" .dev/mail-outbox.jsonl   # RFQ 提交后 >= 1（邮件降级路径生效）
```

以及 infra/wrangler.jsonc 的两处 TODO 核对：`main` 路径与首次构建产物实际路径一致；`database_id` 已回填真实值（仅远端部署需要，本地 platformProxy 不依赖它）。

---

## 8. Phase 3 实施修正记录（后端冒烟实测，2026-10-02 追加）

> 以下三条为后端工程师在真实运行中实测出的适配器行为偏差，已由 Team Lead 裁决采纳并落实到代码/配置。§3 原文按此节为准。

| # | 原文（§3） | 实测与修正 | 落点 |
|---|---|---|---|
| 1 | `platformProxy: { enabled: true }` 注入本地 D1 绑定 | @astrojs/cloudflare@14.3.3 底层已换 @cloudflare/vite-plugin，`platformProxy` 选项被无视，且插件只在项目根找 wrangler 配置——配置在 infra/ 时 API 路由拿不到 DB（health 503 db:down 实测）。修正：cloudflare() 增加 `configPath: 'infra/wrangler.jsonc'`；package.json db:init 补 `-c infra/wrangler.jsonc --persist-to .wrangler/state`（统一 D1 状态目录） | astro.config.mjs / package.json（Team Lead 修） |
| 2 | `locals.runtime.env.DB` 取绑定 | 适配器 14.3.3 已移除 `locals.runtime.env`（访问即 throw，源码实测）。修正：绑定一律 `import { env } from 'cloudflare:workers'`；`waitUntil` 走 `locals.cfContext`（App.Locals 扩展声明在 src/env.d.ts） | src/lib/server/db.ts 等 |
| 3 | 邮件降级写 `.dev/mail-outbox.jsonl` | workerd dev 运行时禁止 node:fs 写真实磁盘（"operation not permitted" 实测）。修正：mail.ts 双落点——优先写文件，失败则输出带 `[mail-outbox]` 前缀的同一 JSONL 到 stdout（dev log 可 grep）；文件级路径由 vitest 在 Node 侧真实验证；生产有 RESEND_API_KEY 时不走此分支 | src/lib/server/mail.ts |

补充实测记录（dev 测试密钥行为，QA 注意）：Turnstile 恒通过测试密钥（1x000...AA）下 siteverify 恒 success，「同 token 重发」实际返回 201 而非 400——TOKEN_ALREADY_USED 分支已实现（siteverify timeout-or-duplicate → 400），在线验证需恒失败密钥 `2x000...AA` 或真实密钥。

### 8.1 构建配置终局裁决（2026-10-02，第三轮修正，覆盖上文 1/2 中涉及 wrangler 配置位置的描述）

前端工程师读 vite-plugin 源码定位到死锁根因：`maybeResolveMain` 把 `main` 当 **worker 源码输入**（带扩展名 → config 加载期强制存在性校验），而 `dist/_worker.js/index.js` 是构建输出，冷构建必然不存在——无论相对路径怎么写都是死锁。终局方案（Team Lead 裁决采纳，实测构建全绿）：

1. **根 `wrangler.jsonc` 不含 main 与 assets**，仅供：vite-plugin 根目录自动发现（astro dev D1 绑定）、`wrangler d1 execute`、vars/observability 管理。
2. **部署配置由适配器在 astro build 末尾生成**：实测产物为 `dist/server/wrangler.json`（dist/client 静态产物 + dist/server worker 分离布局）。部署命令一律以它为准：`npm run workers:dev`（= `wrangler dev -c dist/server/wrangler.json`）、生产 `wrangler deploy -c dist/server/wrangler.json`。
3. 原 `infra/wrangler.jsonc` 与占位脚本 `scripts/ensure-worker-placeholder.cjs` 均已删除；ARCHITECTURE §12.10 等文中出现 `infra/wrangler.jsonc` 处以本节为准。
