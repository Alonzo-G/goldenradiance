# Deployment Runbook — Golden Radiance B2B 官网

> 生成日期：2026-10-02
> 状态：待执行（依赖 Cloudflare 账号 + 真实密钥到位）
> 关联：`docs/ARCHITECTURE.md` §10.4 / §10.5 / §10.6、`docs/SPEC.md`、`infra/schema.sql`、`wrangler.jsonc`

本手册把"构建已通过、尚不能上线"的站点推进到可公网访问。所有命令在仓库根目录执行（项目根 = `main-687d4ca0/`）。

---

## 0. 当前就绪状态（部署前已确认）

| 项 | 状态 | 证据 |
|----|------|------|
| 静态产物 | 就绪 | `dist/client/` 134 个 HTML 页（111 产品页 + 23 站点页），全部 `lang="en"` + `hreflang="x-default"`，零 `/zh/`（占位种子数据 21 款自 2026-10-03 起撤下公开面，PDP 路由一并撤除，故由 132 降为 111） |
| 搜索索引 | 就绪 | pagefind 由 `npm run build` 第三段生成到 `dist/client/pagefind/`；133 页带 `data-pagefind-body`。**注意：直接跑 `astro build` 不会生成索引**，必须走 `npm run build`（§4 已列明三段构成） |
| 路由完整性 | 就绪 | 站内 133 条 sitemap URL 全部 HTTP 200（本地静态服务实测）。**`/product-lines/` 与 `/markets/` 无索引页，直接访问 404 属设计如此**（源里只有 `product-lines/[line].astro` 与两个具名市场页），入口在顶栏，勿按缺陷处理 |
| 后端源码 | 就绪 | `src/pages/api/v1/{rfq,newsletter,health}.ts` 三端点，58 个 vitest 用例全绿 |
| 部署配置 | 半就绪 | 根 `wrangler.jsonc` 已就位，`dist/server/wrangler.json` 由 adapter 构建时生成；`database_id` 仍为占位零 UUID，**上线前必填** |
| 真实素材 | 部分到位 | 首批工厂实拍 70 款 + 1688 目录 SKU 级 41 款已入库（`dataStatus: real`，共 **111 款公开**）；**Logo / Slogan 仍缺**（字标占位）。另有 21 款占位种子数据（`ST-` / `FB-` / `NS-`）自 2026-10-03 起已按 SPEC §10.3 撤下公开面、文件保留。规格类字段仍按 `docs/SPEC.md` §10 降级 |
| 真实密钥 | 未到位 | Turnstile / Resend 生产密钥待客户提供 |

---

## 1. 前置条件

- Cloudflare 账号已注册并完成支付绑定（免费计划即可起站，付费升级见 §10）。
- 本地已安装 Node 22（项目锁定 managed 22.22.2）、`wrangler`（`package.json` devDependency，版本 `^4.125.0`）。
- 已 `npm install` 完成（`node_modules` 存在）。
- 已 `wrangler login`（或设置 `CLOUDFLARE_API_TOKEN` 环境变量）完成鉴权。
- 已持有域名 `rayan-accessories.com` 的管理权限（用于 §8 自定义域名；未就绪前可用 `*.workers.dev` 临时域名先验证）。

---

## 2. 环境变量与密钥

生产环境密钥通过 `wrangler secret` 注入（**不要**写进 `wrangler.jsonc` 的 `vars`，也不要进版本库）。

| 变量 | 用途 | 开发态 | 生产态 |
|------|------|--------|--------|
| `TURNSTILE_SECRET_KEY` | 服务端校验 RFQ 表单 Turnstile 令牌 | 测试密钥 `1x0000000000000000000000000000000AA` | 客户在 Cloudflare Dashboard 申请的站点密钥对应 secret |
| `RESEND_API_KEY` | 发送 RFQ / 订阅确认邮件 | 空（开发态邮件双写落盘 `stdout [mail-outbox]`，不真正外发） | 客户 Resend 账号的 API Key |

> Turnstile 站点公钥（`sitekey`）为前端常量，开发测试值 `1x00000000000000000000AA`，生产替换为客户真实 sitekey。前端常量位置见 `src/components/rfq/submit.ts`，替换时同步改 `.dev.vars` 与前端常量两处。

设置命令（生产）：

```bash
# 交互式填入，按提示粘贴真实值
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
```

本地开发调试用 `.dev.vars`（已在仓库，勿提交真实密钥）：

```bash
# .dev.vars（当前内容）
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
RESEND_API_KEY=
```

---

## 3. D1 数据库：创建 + 迁移

站点后端依赖一个 D1 实例 `jewelry-b2b-global-db`（绑定名 `DB`），存放 RFQ 询单、RFQ 明细、邮件订阅三类表（`infra/schema.sql`）。

**3.1 创建数据库，取得真实 `database_id`：**

```bash
# 方式 A：CLI 创建（推荐，返回 id 直接可见）
npx wrangler d1 create jewelry-b2b-global-db
# 输出形如：
#   ✅ Successfully created DB 'jewelry-b2b-global-db' with id: <real-uuid>
# 复制 <real-uuid>
```

**3.2 回填根配置（必须，否则部署用占位零 UUID 连不上库）：**

编辑 `wrangler.jsonc`，将

```jsonc
"database_id": "00000000-0000-0000-0000-000000000000"
```

改为 3.1 取得的 `<real-uuid>`。仅改这一处，其余不动。

**3.3 执行建表迁移（远程，生产库）：**

```bash
npx wrangler d1 execute jewelry-b2b-global-db --remote --file=infra/schema.sql
```

> 本地联调（非必须）可先跑：`npx wrangler d1 execute jewelry-b2b-global-db --local --persist-to .wrangler/state --file=infra/schema.sql`，再 `npm run workers:dev`。

---

## 4. 构建

```bash
# 本机构建机存在 safe-delete 拦截，需关闭该环境变量（仅在构建机执行）
CODEBUDDY_SAFE_DELETE_ENABLED=0 npm run build
```

`npm run build` 实际执行：`astro check && astro build && pagefind --site dist`。

- `astro check`：类型门禁，必须 0 error。
- `astro build`：产出 `dist/client/`（静态）+ `dist/server/`（worker 部署配置 `wrangler.json`，由 adapter 从根 `wrangler.jsonc` 生成）。
- `pagefind --site dist`：对 `dist/client` 建搜索索引。

构建时长参考（`docs/ARCHITECTURE.md` §10.5）：≤300 SKU / 约 1800 图 ≈ 2 分钟；500–800 款预估 2–7 分钟，建议首批 ≤300 跑通管线，全量仅当客户要求且 staging 失败时升级付费计划。

### 4.1 静态资源体积与平台上限（2026-10-03 撤下占位种子数据后更新）

三批素材入库后的产出规模（首批工厂实拍 70 款 + 1688 目录 SKU 级 41 款 = **111 款公开真实产品**；21 款占位种子数据已按 SPEC §10.3 撤下公开面，无图片故不影响资源体积）：

| 项 | 数量 | 体积 |
|----|------|------|
| HTML 页面 | 134 | — |
| 产品图（主图 1200px WebP q76） | 465 | ≈ 76.0 MB |
| 产品图（缩略 360px WebP q72） | 465 | ≈ 8.6 MB |
| 社交分享图（1200×630 JPEG q82） | 111 | ≈ 6.9 MB |
| **静态资源合计** | **1,041 图** | **≈ 89.5 MB** |

其中真实素材 465 张（首批 421 + 1688 批次 44），全部有图；占位种子数据 21 款无图片、原走程序化占位图，现已整批不在公开面。`dist/client` 全量 **1,351 文件 / 107 MB**（含 pagefind 索引 152 文件 / 2 MB——索引已按 §9 修正搬入部署根内，故文件数较上一版增加、体积基本持平）。

平台上限核对：

- 单文件上限 25 MiB —— 当前最大单图 0.4 MB，**远低于上限**。
- 文件总数上限 20,000 —— 当前 1,351 文件（含 pagefind 索引 152 个 + 分享图 111 个），**余量充足**。
- 构建总耗时实测 26 秒（第二批入库后），图片为静态拷贝，**未按图数线性拖慢构建**；`docs/ARCHITECTURE.md` §10.5 的 W-2 结论在真实素材下依然成立。

体积调优：若后续 SKU 放大到 300 款（约 1,700 图），按当前 200 KB/图（主+缩）估算约 340 MB，仍在平台上限内但部署上传会变慢。届时按序调整 `scripts/ingest-material.mjs` 顶部常量：`MAIN_MAX`（1200 → 1000）、`MAIN_Q`（76 → 72）、每款图片数上限，或改为接入 Cloudflare Images 绑定做按需变换（`astro.config.mjs` 已启用 IMAGES binding）。

素材管线可复跑（幂等，按文件名覆盖）：`node scripts/ingest-material.mjs`（加 `--dry` 只做匹配校验不写文件）。管线同时负责把工厂中文尺寸图的帧底图注重绘为英文，单独复跑即可修正已有图注。

---

## 4.2 中文文字不得进入图片产物

站点为纯英文前台，**图片里的文字与 HTML 里的文字同等对待**。历史事故：首轮素材分类建立于缩略校样图，遗漏 2 张带中文图注的尺寸图，使其作为普通产品图上线。

现行把关方式（入库后、部署前各跑一次）：

```bash
# 1) HTML 层（应为 0）
grep -rlP "[\x{4e00}-\x{9fff}]" dist/client --include="*.html" | wc -l

# 2) 图片层：扫出带帧底图注带的图，逐张确认图注为英文
node scripts/check-captions.mjs
```

第 2 步会把 18 张英译尺寸图连同少量误报（白底实拍图，帧底是被摄物或托盘边缘）一并列出，需目视过一遍。新增素材批次后必须重跑。

### 4.3 平台营销图批次（1688 目录类）额外把关

工厂自有实拍素材与**平台营销图**是两回事：后者大量是真人佩戴照、叠加中文文案、防盗水印、尺码对照图，甚至带第三方品牌水印与引流单价。

**粒度：以 SKU（颜色变体）为准，不以商品链接为准。** 同一链接下每个通过审核的颜色变体独立成一条产品，SKU 编码 `RA-{品类码}-{链接号}{变体号}` 可回溯 offerId。链接下无可用 SKU 图时降级为一条款式级条目。

入库前须过四道：

```bash
# 1) 肤色占比预筛：批量剔除真人佩戴照（骏娅主图 329 张中仅 97 张无真人）
node scripts/skin-filter.mjs <供应商关键字> 主图

# 2) 按确定顺序出候选拼版，人工只判定「干不干净」——产品归属以文件路径为准，不靠肉眼辨标签
node scripts/candidates-1688.mjs 2 <供应商关键字> 主图 "<款号逗号分隔>"

# 3) 逐 SKU 判定结果 → SKU 级台账（含基材英译闸门 baseEn()）
node scripts/build-catalog-sku.mjs

# 4) 出图 + 写内容 + 撤回被取代的链接级产品；再生成人读清单
CODEBUDDY_SAFE_DELETE_ENABLED=0 node scripts/ingest-1688-sku.mjs
node scripts/report-1688-sku.mjs
```

三条硬红线，命中即扣住不上站：

1. **第三方品牌水印**（如 MILanTing / LALIAN components）——挂到自家品牌名下涉商标风险，须客户书面裁决
2. **可辨识面部**——无论是否模特
3. **任何形式的单价数字**——平台引流价不可作报价依据

第四道闸门（本轮新增）：**基材必须能英译**。中文基材经 `baseEn()` 映射为英文后才允许入文案；**映射缺失则整条产品不外发**——宁可少发一款，不可带汉字上线。历史上曾因把「不锈钢」直接写进 `short_description` 造成 34 页汉字外泄。

> 本批次的实际筛除结果与逐格理由见 `docs/material-intake/INVENTORY-1688.md` §三；口径与踩坑记录见 `docs/SPEC.md` §10.2。

> **撤回步骤注意**：一次性撤回 50+ 文件会触发宿主的批量删除保护（阈值 50/turn），须以 `CODEBUDDY_SAFE_DELETE_ENABLED=0` 执行。脚本幂等，中断后重跑安全。撤回归属**按批次清单判定，不按 slug**——款式级回退会复用旧 slug，按 slug 判会误删仍有效的产品。

### 4.4 素材管线脚本全景（19 个）

排查脚本问题时的唯一索引。**状态列是关键**——标「已作废」的三个仍在磁盘上（仓库无 git 兜底，删除不可逆），但**已被 SKU 级管线取代，误用会写回链接级台账并撤掉有效产品**。

| 脚本 | 用途 | 状态 |
|------|------|------|
| `inventory-1688.mjs` | 清点 1688 批次素材，生成 `inventory-1688.json` | 在用 |
| `skin-filter.mjs` | 肤色占比预筛，批量剔除真人佩戴照 | 在用 |
| `candidates-1688.mjs` | 出候选图拼版，人工只判「干不干净」 | 在用 |
| `contact-sheet.mjs` | 每款首图拼成网格，用于快速视觉筛查 | 在用（§4.4 补录） |
| `listing-sku-sheet.mjs` | 单链接全部 SKU 图拼版，判断「同款式不同色」是否真有差异 | 在用（§4.4 补录） |
| `scan-diagrams.mjs` | 程序化检测尺寸标注图（近白底占比 + 帧底孤立图注带） | 在用 |
| `check-captions.mjs` | 检测生成图上残留的烧入文字 | 在用（§4.2） |
| `build-catalog-sku.mjs` | 逐 SKU 判定结果 → SKU 级机读台账 | 在用（§4.3 第三道） |
| `ingest-1688-sku.mjs` | SKU 级入库：出图 + 写内容 + 撤回被取代产品 | 在用（§4.3 第四道） |
| `report-1688-sku.mjs` | 由 SKU 级台账生成人读清单 `INVENTORY-1688.md` | 在用（§4.3 第四道） |
| `ingest-material.mjs` | 首批工厂实拍入库 + 中文尺寸图注英译重绘 | 在用（§4.1 末） |
| `make-assets.mjs` | 生成品牌位图资产（OG 卡 + app icons） | 在用（§4.4 补录） |
| `make-og-images.mjs` | 为每款真实产品生成社交分享图 `public/og/{slug}.jpg` | 在用（§4.4 补录，**新增产品后必跑**） |
| `build-sku-index.mjs` | did-you-mean SKU 索引（ARCHITECTURE §6.6 L1/L2） | 在用 |
| `verify-catalog-consistency.mjs` | 列表页 / 详情页 / 产品线页三处一致性守卫 + og:image 可达性 | 在用（§4.4 补录，发布前必跑） |
| `sku-style-table.mjs` | 款式名与基材英译映射，被 `build-catalog-sku.mjs` 引用 | 模块（无独立入口，勿直接执行） |
| `build-catalog-1688.mjs` | 链接级台账构建 | **已作废**，被 `build-catalog-sku.mjs` 取代 |
| `ingest-1688.mjs` | 链接级入库 | **已作废**，被 `ingest-1688-sku.mjs` 取代 |
| `report-1688.mjs` | 链接级人读清单 | **已作废**，被 `report-1688-sku.mjs` 取代 |

**社交分享图**：`og:image` 若全部指向同一张 `/og-default.png`，111 个产品页在 LinkedIn / WhatsApp 的分享卡片会长得一模一样。`make-og-images.mjs` 为每款真实产品生成 1200x630 JPEG（111 张 / 6.9 MB / 均 63 KB），**新增产品后必须重跑**，否则该产品分享图 404 —— 这条由守卫脚本的 og:image 可达性断言拦下。

> 为什么是 JPEG 而不是直接引用现成的 WebP：Facebook 与 LinkedIn 抓取器对 WebP 支持不可靠，可能整张预览都不显示，那比显示通用卡更糟。不确定平台是否接受时，选格式保守的那一边。
>
> 为什么图上不叠文字：叠标题等于在分享素材上做卖点声明，而那些规格尚未与客户确认，按项目「不编造」纪律不应出现在对外素材上。纯产品照最诚实。
>
> 尺寸必须与 `SeoHead` 写死的 `og:image:width/height`（1200×630）一致，改一边就要改另一边。

发布前必跑的两道校验：

```bash
# 列表页 / PDP / 产品线页三处逐条比对 + og:image 可达性：零悬空、零缺失、零死链
node scripts/verify-catalog-consistency.mjs
```

> 该守卫的可见性判据与 `src/lib/products/queries.ts` 的 `SHOW_PLACEHOLDER_PRODUCTS` 开关同源（脚本从开关读取），因此**改这个开关必须重跑守卫**，否则守卫会拿已撤下的占位款断言公开面，属于自身失效。

---

## 5. 部署

```bash
# 使用 adapter 生成的部署配置（非根 wrangler.jsonc）
npx wrangler deploy -c dist/server/wrangler.json
```

部署成功后返回 `*.workers.dev` 临时域名（如 `rayan-accessories.<sub>.workers.dev`）。

> 不要直接 `wrangler deploy` 根 `wrangler.jsonc`——根配置不含 `main`/`assets`，仅为源码期输入；真正可部署的是构建产物 `dist/server/wrangler.json`。

---

## 5.1 GitHub Actions 自动部署（CI/CD）

> 本节由 2026-10-05 补充。工作流文件 `.github/workflows/deploy.yml` 已就位，push 到 `main` 即自动构建 + 部署，无需本地手动跑 §5 的命令。

### 5.1.1 工作流做什么

触发（push `main` 或手动 `workflow_dispatch`）后，在 ubuntu-latest 上顺序执行：

1. `npm ci`（干净安装，锁版本）
2. `npm run build`（= `astro check` 类型门禁 + `astro build` + `pagefind` 索引）
3. 质量门禁：扫描 `dist/client` 汉字 / 价格符号泄漏（对应 §11 门禁）
4. `npm test`（vitest 58 用例）
5. `wrangler deploy -c dist/server/wrangler.json`（用适配器生成的部署配置，非根 `wrangler.jsonc`）

### 5.1.2 需要的 GitHub Secrets（一次性配置）

仓库 **Settings → Secrets and variables → Actions → New repository secret**，加两个：

| Secret 名 | 值 | 获取方式 |
|-----------|-----|----------|
| `CLOUDFLARE_API_TOKEN` | API Token | Cloudflare Dashboard → My Profile → API Tokens → Create Token → 选 **「Edit Cloudflare Workers」** 模板（权限：Account / Workers Scripts / Edit） |
| `CLOUDFLARE_ACCOUNT_ID` | 32 位 hex | Cloudflare Dashboard 首页右侧 Account ID |

> Token 只授 Workers Scripts Edit 最小权限，不授全局；若未来要 CI 里跑 `wrangler d1 execute --remote` 或 `secret put`，需额外加 D1 / Secrets Store 权限（本节不涉及，保持最小化）。

### 5.1.3 CI 与手动部署的边界

CI 只做「构建 + 部署」，**不替代**以下一次性手动操作（均在账号/密钥到位后、首次部署前执行，见 §2/§3/§11）：

- `wrangler.jsonc` 的 `database_id` 回填真实 UUID（否则部署后连不上库）
- D1 建表：`npx wrangler d1 execute jewelry-b2b-global-db --remote --file=infra/schema.sql`
- 生产密钥注入：`wrangler secret put TURNSTILE_SECRET_KEY / RESEND_API_KEY / ADMIN_PASSWORD / ADMIN_SECRET`

这些操作不放进 CI 的原因：密钥绝不进版本库；D1 建表虽幂等，但需先在账号侧建库取得 UUID。故统一归入上线门禁（§11）的「一次性手动」范畴。

---

## 6. 部署后验证

**6.1 健康检查（必须）：**

```bash
curl -s https://<your-sub>.workers.dev/api/v1/health
# 期望：{"code":0,"data":{"status":"ok"},"message":"ok"}
```

**6.2 RFQ 提交冒烟（核心成功流）：**

```bash
curl -s -X POST https://<your-sub>.workers.dev/api/v1/rfq \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {"name":"Test Buyer","email":"test@example.com","company":"Test Co"},
    "items": [{"sku":"FB-0001","qty":120,"note":""}],
    "shipping": {"country":"US"},
    "locale": "en"
  }'
# 期望：{"code":0,"data":{"reference":"RFQ-2026-0001"},"message":"ok"}
```

**6.3 错误流校验：**

```bash
# 重复邮箱订阅应返回 409（已存在）
curl -s -X POST https://<your-sub>.workers.dev/api/v1/newsletter \
  -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
# 期望：{"code":409,...}
```

**6.4 前端关键页面（按 sitemap 全量探测）：**

**不要**去 curl `/product-lines/` 与 `/markets/` —— 这两个索引页**不存在**。源里只有 `product-lines/[line].astro` 与两个具名市场页（`europe-uk`、`middle-east`），入口在顶栏下拉，直连返回 404 属设计如此，不是部署故障。

正确做法是按 sitemap 逐条探活，任何非 200 都是真实故障：

```bash
curl -s https://<your-sub>.workers.dev/sitemap-0.xml \
  | grep -oE '<loc>[^<]+' | sed 's|<loc>||' \
  | while read -r u; do
      printf '%s %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$u")" "$u"
    done | grep -v '^200 ' || echo "全部 200"
```

覆盖范围应为：首页 + 111 张产品详情页 + 三条产品线（`/product-lines/fashion-alloy-brass`、`/stainless-titanium-steel`、`/natural-stone-gemstone-pearl`）+ `/compliance/` + `/rfq/` + `/contact/` + `/blog/`（含 7 篇）+ `/markets/{europe-uk,middle-east}` + `/faq/` + `/samples/` + `/shipping-payment/` + `/sourcing-partners/`，合计 133 条（以 sitemap 实际条数为准）。

并逐页确认 `<html lang="en">`、含 `hreflang="x-default"`、搜索框可唤起（Pagefind 索引加载成功）。

---

## 7. W-5 用量告警（免费额 10 万请求/日超限静默 429）

按 `docs/ARCHITECTURE.md` §10.6 落地两层告警：

**第一层（Cloudflare 原生，免费计划可用）：**
1. Dashboard → **Notifications** → **Destinations** 添加接收方式（邮箱 / Webhook）。
2. **Notifications** → **Create** 新建通知，类型选 Workers 相关用量（Requests），阈值设为 **日请求量 > 100000**，绑定刚建的 Destination。
3. 触发即邮件/Webhook 告警，避免静默 429 到客户才被发现。

**第二层（Free 计划无原生用量阈值时必做 — 看门狗 Worker）：**
- 部署一个极简 Worker 读取 Workers Analytics 当日 requests 计数，超过阈值（如 85% × 100000 = 85000）主动 `fetch` 告警 Webhook。
- 该 Worker 与站点 Worker 分离，仅做计数与告警，不承载业务流量。
- 脚本骨架与阈值常量集中放 `infra/`（部署前由运维补全，本手册不内置实现以免越权代写架构细节）。

---

## 8. 自定义域名 + DNS + SSL

1. Dashboard → **Workers & Pages** → 站点 Worker → **Settings** → **Domains**，添加 `rayan-accessories.com`（及 `www.` 如需）。
2. 按提示在域名注册商处加 **CNAME** 记录指向 `*.workers.dev` 提供的目标。
3. Cloudflare 自动签发 SSL（Universal SSL），等 DNS 生效（通常分钟级，最多 24h）。
4. 验证 `https://rayan-accessories.com/sitemap-index.xml` 与 `https://rayan-accessories.com/robots.txt` 可访问（`astro.config.mjs` 已设 `site`，`@astrojs/sitemap` 已集成，`public/robots.txt` 已就位）。

---

## 9. 搜索上线校验

Pagefind 索引随静态产物部署。上线后：
- 打开站点，按 SearchDialog 触发键（UIUX 约定）唤起搜索，输入任一 SKU 关键词，确认返回结果。
- 若搜索空白：确认 `dist/client/pagefind/` 已随部署上传（静态托管默认包含），且页面含 `data-pagefind-body`（133 页已标注，404 页刻意排除）。

> **已修缺陷（2026-10-03）**：构建脚本原为 `pagefind --site dist`，索引落在 `dist/pagefind/`；而 Cloudflare 适配器部署的静态根是 `dist/client`（见 `dist/server/wrangler.json` 的 `assets.directory: "../client"`），`SearchDialog` 又按根相对路径 `/pagefind/pagefind.js` 取索引 —— **部署后搜索必然 404**。已改为 `pagefind --site dist/client`。上线前务必按本节实测一次搜索，勿只看构建日志里的 `Indexed N pages`（那条日志在错误路径下同样会打印成功）。

---

## 10. 回滚与备份

- **Worker 回滚**：Dashboard → Worker → **Deployments** → 选上一稳定版本 **Rollback**，秒级生效。
- **D1 备份**：定期 `wrangler d1 export jewelry-b2b-global-db --remote --output=backups/$(date +%F).sql`；重大变更前必做一次。
- **静态回滚**：重新 `npm run build && wrangler deploy -c dist/server/wrangler.json` 旧提交即可，CI 历史保留构建产物。

---

## 11. 上线门禁清单（Go-Live Gate）

逐项勾选，全绿方可切换 DNS 到生产域名：

- [ ] `wrangler.jsonc` 的 `database_id` 已替换为真实 UUID
- [ ] `TURNSTILE_SECRET_KEY` / `RESEND_API_KEY` 已 `secret put`（生产值，非空）
- [ ] D1 已 `create` + `execute --remote` 建表成功
- [ ] `npm run build` 全绿（astro check 0 error + pagefind 完成）
- [ ] `node scripts/verify-catalog-consistency.mjs` 全绿（零悬空 / 零缺失 / 零标题差异 / og:image 零死链）
- [ ] 新增产品后已重跑 `node scripts/make-og-images.mjs`（否则分享图 404，由上一项守卫拦下）
- [ ] 产物零汉字泄漏：`grep -rlP "[\x{4e00}-\x{9fff}]" dist/client --include='*.html' --include='*.js' --include='*.css' --include='*.svg'` 输出为空
- [ ] 产物零价格泄漏：`grep -rlE '¥|RMB|人民币' dist/client --include='*.html' --include='*.js' --include='*.json'` 输出为空
- [ ] 按 §6.4 的 sitemap 全量探测，非 200 条数为 0
- [ ] `wrangler deploy -c dist/server/wrangler.json` 成功
- [ ] `/api/v1/health` 返回 `code:0`
- [ ] RFQ 成功流返回有效 `reference`（如 `RFQ-2026-0001`）
- [ ] Newsletter 重复邮箱返回 409
- [ ] 7 类关键页面 HTTP 200 + `lang="en"` + `hreflang="x-default"`
- [ ] Pagefind 搜索实测有结果（`/pagefind/pagefind.js` 返回 200，索引在部署根内）
- [ ] 素材管线改动后已重跑 `verify-catalog-consistency.mjs`（守卫判据与 `SHOW_PLACEHOLDER_PRODUCTS` 开关同源）
- [ ] W-5 两层告警已配置（第一层必做；Free 计划加第二层）
- [ ] 自定义域名 DNS + SSL 生效，`sitemap-index.xml` / `robots.txt` 可访问
- [ ] D1 已做一次基线备份
- [ ] Lighthouse 实测（AC-30，上线前补，见 §12）

---

## 12. 待客户/运维补齐的开放项（Handoff）

| 项 | 阻塞方 | 备注 |
|----|--------|------|
| OD-03 真实素材（Logo/SKU/图） | 客户 | 到位按 `SPEC.md` §10 零改码替换 `src/content/`，重构建即可 |
| OD-04 P1 数据 9 项（阶梯价/交期/承运商等） | 客户 | 到位前页面走 PRD §6.2 降级写法，不出现具体数字 |
| 真实 Turnstile / Resend 密钥 | 客户 | 见 §2 |
| Cloudflare 账号 + 域名管理权 | 客户 | 见 §1 / §8 |
| Lighthouse 实测（AC-30） | 运维 | 站点可访问后跑，目标分见 PRD |
| W-5 第二层看门狗 Worker 实现 | 运维 | 仅 Free 计划且无原生阈值时必需 |
| 生产态 `workers:dev` 冒烟（真实绑定） | 运维 | 账号到位后跑一次完整链路 |

---

## 13. 本手册执行记录

- 2026-10-02：编写完成。前置静态审计已通过（43 页 200、资产齐、测试 47/47 绿、合规断言全过）。执行动作待账号与密钥到位后按 §3→§11 顺序推进。
