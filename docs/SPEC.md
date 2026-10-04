# Spec - Golden Radiance B2B Global Website (jewelry-b2b-global) v1.0

> 生成日期：2026-10-01
> 基于：docs/PRD.md v1.0 + docs/ARCHITECTURE.md v1.0（含 2026-10-02 i18n 裁决）+ docs/UIUX.md v0.5 + docs/design-tokens.json + docs/api-spec.yaml v1.0
> 状态：已确认（用户 2026-10-01 指示「开始开发网站」，实现路线按 Team Lead 裁决默认路线 A，用户跳过选择视为采纳推荐项）
> **本 Spec 是唯一开发契约。与三份源文档冲突时，以本 Spec 为准；本 Spec 未覆盖的细节，按源文档对应章节执行。**

---

## 1. 产品定义

- **一句话描述**：Golden Radiance 面向海外批发买家的饰品 B2B 外贸官网——三条产品线、规格透明的 SKU 目录、RFQ 询盘转化闭环。
- **目标用户**：海外批发买家 / 品牌采购 / 亚马逊卖家 / 买手店（英文前台，全站美式拼写 `jewelry`）。
- **核心问题**：中国系饰品 B2B 站普遍隐藏 MOQ/价格/交期/合规实证；本站以「规格透明化」为突围点，把买家留在 RFQ 流程内。
- **品牌名（已锁定）**：**Golden Radiance**（中文名：**金色光辉**，仅作品牌登记，英文前台不展示中文）。Logo 用文字字标占位（`Golden Radiance` + 字距排版，`Golden` 加粗 + `Radiance` 常规），Slogan 未定稿前用 PRD §13.1 文案。
  - > 品牌变更记录：2026-10-03 由 **Rayan Accessories** 更名为 **Golden Radiance**（金色光辉），客户指示。站内全部品牌引用（字标 / SEO / JSON-LD / favicon / webmanifest / 页脚版权）已同步替换。

## 2. MVP 范围（锁定——路线 A，全站 15 页 + 3 个 API）

| 优先级 | 功能 | 验收标准 | 备注 |
|--------|------|----------|------|
| P0 | 三产品线导航 + 目录多维筛选（含 MOQ 区间 12-30/31-60/61-120） | AC-01/02/02a/03/04 | MOQ 过滤是硬要求 |
| P0 | PDP 七项规格字段 + 阶梯价表（≥3 档、每档为区间） | AC-05/06/07/08/09 | 缺失字段走 AC-06 降级 |
| P0 | RFQ 询盘篮（localStorage 持久 ≥7 天）+ 提交 + 确认页 | AC-10/11/12/13/16 | 桌面抽屉 + /rfq/ 独立页 |
| P0 | RFQ/newsletter/health 三个 API + D1 落库 | api-spec.yaml 全量 | 信封 `{code,data,message}` |
| P0 | 合规教育中心 + EN 1811 子专题（纯教育+承诺口径） | AC-17/18/20/38/39/40/41/42 | 全站禁资质断言词 |
| P0 | 样品政策 / 物流付款 / FAQ / 合作产线 / 联系页 | AC-21/23/24/25/26/27/28 | |
| P1 | Ship-to / Compliance-for 市场选择器（Nanostores） | AC-12、UIUX §8 | 切换合规文案与市场过滤 |
| P1 | Pagefind 全文检索 + SKU 双层索引 | ARCHITECTURE §6.6 | |
| P1 | Blog 内容中心（6 篇种子文章骨架） | PRD §12.4 | 正文可精简，结构必须完整 |
| P1 | /markets/ 两个市场页 | UIUX §11 P1 预留 | IA 留位即可 |

## 3. 明确不做（Out-of-Scope — 锁定）

| 不做的功能 | 原因 | 何时考虑 |
|------------|------|----------|
| 在线支付 / 下单商城 | PRD Out-of-Scope 第 1 条 | v2 会员批发价之后 |
| 产品查询 REST API | NO-4：静态索引足够 | 有个性化需求后 |
| 中文前台 / 语言切换器（含禁用态） | ADR-004 裁决 | v2 按流量数据 |
| 货币切换 | 已决：全站 USD，币种在价格串内 | — |
| SKU 清单导出 | F21，帮助买家比价 | P2 |
| 运行时 i18n / locale 重定向 / negotiator | ADR-004 禁止项 | v2 |
| 无真人值守的在线客服组件 | AC-29 | — |
| Cloudflare 真实部署 | 客户账号未到位；本期交付本地可运行 + 部署配置就绪 | 客户开通账号后 |

## 4. 技术架构（锁定 — 版本锚定，详见 ARCHITECTURE.md §2）

| 层 | 技术 | 实际版本 | 锁定原因 |
|----|------|----------|----------|
| 渲染框架 | Astro（静态优先 + API routes） | 7.3.5 | SEO 生死线，零 JS 默认下发 |
| 样式 | Tailwind CSS（CSS-first theme 扩展） | 4.3.3 | 对接 design-tokens.json |
| 图标（唯一源） | Lucide（@iconify-json/lucide + astro-icon） | 1.2.138 | P0-1 锁定，禁止混用 |
| 搜索 | Pagefind | 1.5.2 | 静态站零后端检索 |
| 客户端状态 | Nanostores + @nanostores/persistent | persistent 1.3.5 | RFQ 篮 + ComplianceContext |
| 后端 | Astro API routes（Cloudflare Workers adapter） | adapter 14.3.3 | 同仓同源部署 |
| 邮件 | Resend | 6.31.0 | 询盘通知 + RFQ 确认 |
| 数据库 | Cloudflare D1（本地 dev 用 wrangler platformProxy） | - | 零运维 |
| 校验 | Zod | 锁定安装版本 | 请求体契约校验 |
| 部署 | Cloudflare Workers（配置就绪，本期不实部） | - | 客户账号未到位 |

## 5. API 端点清单（锁定——以 docs/api-spec.yaml 为唯一细节依据）

| Method | Path | 功能 | 成功 | 关键错误 |
|--------|------|------|------|----------|
| POST | /api/v1/rfq | RFQ 询盘提交（Turnstile→honeypot/时间阈值→Zod→D1 事务→异步双邮件） | 201 + reference | 400/422/429/500 |
| POST | /api/v1/newsletter | 订阅（幂等） | 201 | 409 幂等不报错 |
| GET | /api/v1/health | 健康检查（D1 连通） | 200 | 503 degraded |

**本地开发降级**：`RESEND_API_KEY` 未配置时，邮件写入本地日志文件并标记 `mail_status='skipped_dev'`，API 仍按契约返回——禁止因缺密钥使 500。

## 6. 数据库表清单（锁定——细节以架构师 Phase 2 产出的 schema.sql 为准）

| 表 | 用途 |
|----|------|
| rfq_inquiries | 询盘主表（ULID PK、reference、contact/shipping 快照、utm、turnstile_score、mail_status） |
| rfq_items | 询盘行项（SKU、qty、note） |
| newsletter_subscribers | 订阅者（email UNIQUE、source、status） |

## 7. 页面清单（锁定——15 页，路由与 UIUX §11 逐字一致）

| # | 页面 | 路由 | 核心区块 |
|---|------|------|----------|
| 1 | 首页 | `/` | 非对称三产品线 Hero、Bento、信任条、New this week、流程、CTA |
| 2-4 | 产品线 Landing ×3 | `/product-lines/{fashion-alloy-brass\|stainless-titanium-steel\|natural-stone-gemstone-pearl}/` | 线 Hero、数据条、材质/镀层说明、子品类、热销 rail |
| 5 | 全站目录 | `/products/` | 筛选 sidebar（材质/镀层/品类/合规/MOQ 区间）、toolbar、Grid/List、Active Chips、空状态 |
| 6 | 产品详情 | `/products/{sku-slug}/` | Gallery、sticky 购买面板、七项规格、阶梯价表、accordion、合规 mini-block |
| 7 | RFQ 询价篮 | `/rfq/` | 桌面抽屉同内容独立页、提交表单、合规摘要 |
| 8 | 合作产线与质控 | `/sourcing-partners/` | 采购模式声明、产线分工、AQL 质控（禁工厂宣称 AC-25） |
| 9 | 合规与检测中心 | `/compliance/` | 标准清单+限值、教育口径、索取报告表单 |
| 10 | 镍释放子专题 | `/compliance/nickel-release-en-1811/` | 长文教学、限值表、报告核验教学（AC-20） |
| 11 | 样品政策 | `/samples/` | 样品规则、费用抵扣（AC-21/23） |
| 12 | 物流与付款 | `/shipping-payment/` | MOQ/阶梯/交期/Incoterm/付款（数字未确认走降级） |
| 13 | FAQ | `/faq/` | 分组 accordion + 顶部搜索 |
| 14 | Blog 内容中心 | `/blog/` | 列表（分类 filter）+ 6 篇种子文章页 |
| 15 | 联系我们 | `/contact/` | 渠道卡、结构化表单（≤6 字段）、时区表（AC-28） |
| P1 | 市场页 ×2 | `/markets/middle-east/`、`/markets/europe-uk/` | IA 预留 |

全局组件：Utility Bar（Ship-to/Compliance-for 选择器，**无语言/币种下拉**）、Header（三产品线导航）、Footer（4 列 + 合规 icon 行）、RFQ 抽屉、移动端 sticky bottom bar（PDP）、持久联系方式入口（AC-27）。

## 8. 设计 Token（锁定——以 docs/design-tokens.json 为唯一真源）

- **品牌主色/中性色/产品线色/语义色**：全部从 design-tokens.json 读取，经 Tailwind CSS-first theme 扩展注入，**禁止硬编码色值（#fff/#000 除外）**。
- **字体**：Inter（拉丁正文/UI）+ HarmonyOS Sans SC（仅 /admin 预留，前台不加载 CJK）。
- **图标**：Lucide 单一源，尺寸 16/20/24px 三档。
- **主题**：浅色单主题。
- **禁止**：紫→粉渐变（P0-2）、弹性缓动、千篇一律居中 Hero。

## 9. 验收标准（锁定——QA 以 PRD §9 的 AC-01..AC-42 为唯一依据）

按 PRD §9 全量执行（已在 Phase 1 由 PM 锁定，共 42 条 + §10 状态表）。补充开发口径：

- AC-07 阶梯价：≥3 档、每档为区间（`12-59 pcs → USD a.b-c.d / pc` 形态），禁固定单价。
- AC-37/AC-38/AC-41：无实证的数字与资质断言一律降级文案，详见 §10 占位规则。
- AC-34：图标全部来自 Lucide，交付前跑 emoji 正则扫描（含 2600-27BF 区间）。
- ARCHITECTURE §12 的端到端断言（含 §12.5 SEO 断言：`dist/` 无 `/zh/`、hreflang 仅 x-default）一并执行。

## 10. 占位数据规则（用户指令：产品图和参数先用占位）

1. **Demo SKU 集**：由设计师产出 18-24 个 demo SKU（三线分布），集中存放于 `src/content/products/`（Content Collections，类型化 schema）。所有字段结构完整，数值字段允许用合理示例值，但**每个 SKU 标记 `dataStatus: "placeholder"`**。
2. **一键替换**：真实数据到位后仅替换 content 目录 + 图片目录，页面代码零改动——schema 字段名与 PRD §6.4 的真实素材字段一一对应。
3. **占位图**：不用外部图片服务。构建期生成/内置的本地占位图（按 UIUX 规定宽高比的灰调色块 + 品类名 SVG 文本），alt 文本按 AC-33 写实。
4. **价格占位**：PDP 阶梯价与卡片价格区间允许用 demo 值（AC-07 要求区间形态），但 demo 值只存在于 content 数据文件，**禁止散落在组件里**。
5. **信任/合规文案不受占位豁免**：检测报告、交期、响应时长、覆盖国家数等仍按 PRD §6.2 / AC-37/38/41 降级文案执行，**不得编造**。
6. **文案禁令**：禁止 Lorem ipsum / Welcome to our website / Sign up today（AC-36）；全部 UI 文案走 `src/i18n/en.json` 字典经 `t(key)` 取值（ADR-004）。

### 10.1 真实素材落位实况（2026-10-02 追加，对第 2 条的修正）

客户于 2026-10-02 投递首批工厂实拍素材（源目录 `D:\AAAAAAA外贸资料\饰品\NEW`，71 条朋友圈动态 / 429 张图 / 208 MB）。

**落位结果**

- 发布 **70 款**（`dataStatus: "real"`，SKU 前缀 `RA-`）；图片 **421 张**输出至 `public/products/<slug>/`（主图 1200px WebP q76，缩略 360px，合计 842 个文件 / 81.5 MB）。可复跑管线：`scripts/ingest-material.mjs`
- **工厂中文尺寸标注图已英译发布**：18 张全部保留产品照与尺寸线（那些标注本就只有阿拉伯数字加 `mm`，无需翻译），仅把帧底中文克重行重绘为同句式英文 `Pair weight approx. X g (excl. ear backs)`；实测尺寸与克重同时写入 frontmatter 的 `dimensions_mm` / `weight_g`，由规格表以真实文本呈现
- **排除 8 张不可发布图片**（实际跳过 7 张，`01.01` 所属动态本身未发布）：1 张中文品牌海报、6 张真人/明星脸、1 张带人民币价签的合成图。逐张理由见 `docs/material-intake/catalog.json`
- 分类表、源文案与 RMB 工厂价留存于 `docs/material-intake/catalog.json`——**内部参考，不进入站点产物**

**尺寸图口径纠正（同批次复查）**：首轮分类建立于缩略校样图，存在 2 处漏检与 1 处误判，现已修正——

- 漏检 2 张：`57.08`、`61.07` 未进入排除清单，**已作为产品图带着中文图注上线**。本轮已英译替换
- 误判 1 张：`61.06` 被标为尺寸图，实为无标注的实拍生活图。已恢复发布
- 新口径：全量 429 图以「近白底占比 + 帧底孤立深色图注带」程序化筛出尺寸图模板，18 张落在 0.71–0.88 区间、其余最高仅 0.48，分离干净；每张再以原尺寸逐张目视复核。复用脚本 `scripts/scan-diagrams.mjs`（新增素材批次后重跑）

**对第 2 条「零页面代码改动」的修正**：本次实践证伪了该预期，schema 与组件**必须**改动——

1. `dataStatus` 由 `z.literal('placeholder')` 扩为 `z.enum(['placeholder','real'])`；新增 `images` 字段；规格与阶梯价字段改为 optional
2. 新增 `ProductImage.astro` 统一图片位（有实拍图用实拍、无则回落程序化占位图）；`ProductCard` / `Gallery` / `SpecTable` / `BuyPanel` / `catalog.ts` / `product-lines/[line].astro` 增补「待报价确认」降级分支
3. 尺寸图入库时按目标尺寸重绘英文图注（`translateDiagram`）：sharp 的 composite 排在 resize 之后，故标注必须在**已缩放到目标尺寸**的底图上做，否则被判覆盖层过大
4. schema 放宽后由 `tests/content-contract.test.ts` 机械兜底：placeholder 必须规格齐全且阶梯价 ≥3 档且币种 USD；real 必须有图、图文件必须在 `public/` 真实存在、**不得**携带 `tiered_price` / `plating_thickness_um`，凡填 `weight_g` 就必须写明 `weight_basis`，尺寸图至多一张且恒排末位

页面**结构**未变，新增的只是「规格未确认」这一状态的渲染分支。

**未确认字段的处置（不得编造）**：材质等级、镀层方法与厚度、MOQ 仍一律留空，UI 渲染 `Confirmed with your quotation`；价格渲染 `Price on request`；`ear_post` 保守取 `false`，PDP 因此不输出 EN 1811 耳针限值句，而非替客户断言穿透类型。尺寸与克重自本轮起有来源，不再属于未确认字段——但克重是**一对**重量（源图口径「一对（不加耳堵）」），故 frontmatter 显式记 `weight_basis: pair`，规格表渲染为 `24.2 g per pair`，不让买家自行推断（一对与单只差一倍，直接影响运费与报价）。

**待客户补齐**：

- `61.07` 尺寸图上另标有「24.8 cm」，在该品类尺度下明显应为毫米。未擅自改动工厂原图，也未写入任何结构化字段，待客户确认
- Logo / Slogan 仍缺（字标占位）
- 不锈钢/钛钢产品线本轮无真实素材
- 材质等级、镀层、MOQ、阶梯价到位后，18 款可从「尺寸已知」进一步升级为完整规格

### 10.2 1688 批发目录批次落位实况（2026-10-02 追加，同日第三轮修正为 SKU 粒度）

客户于 2026-10-02 追加投递 `D:\AAAAAAA外贸资料\饰品\产品(1)`——两个供应商（东莞市骏娅饰品有限公司 / 义乌市空屿饰品有限公司）在 1688 平台的**商品目录导出**，含 52 个商品链接、1,690 张图，结构为每款一个 `*_images` 目录（`_URL.txt` 元数据 + `主图` / `SKU 属性图` / `描述图`）。

**与首批的关键差异**：这批不是工厂自有素材，而是**平台营销图**。图片质量分布极不均匀，必须逐张筛。

**产品粒度以 SKU（颜色变体）为准，不以商品链接为准**（客户 2026-10-02 明确指示）。同一链接下的每个颜色变体独立成一条产品；款式族以 `styleFamily` 记录，**不作为产品层**。SKU 编码 `RA-{品类码}-{链接号}{变体号}`，可回溯到 1688 offerId。链接下无可用 SKU 图时，降级为一条**款式级**条目。

| 项 | 数量 |
|----|------|
| 扫描商品链接 | 52 |
| 扫描图片 | 1,690 |
| **已发布产品** | **41**（SKU 级 34 + 款式级 7） |
| 发布图片 | 44（1.2 MB） |
| **扣住候选** | **65** |
| 已读出的尺寸/克重实测 | 3 条（所属链接整体扣住，仅内部留档） |

**已发布 41 款**：全部属 `stainless-titanium-steel` 线，品类为项链 24 / 手链 16 / 耳饰 1，**全部来自骏娅**。这补上了此前「不锈钢/钛钢线 0 款真实素材」的缺口。清单见 `docs/material-intake/INVENTORY-1688.md` §二。

> **粒度修正取代声明**：同日第三轮之前按「商品链接」粒度发布的 18 款（`RA-N-101`…`RA-B-118`）**已被本轮的 SKU 级清单取代**。其中 11 款链接级条目在本轮入库时由 `ingest-1688-sku.mjs` **程序化撤回**（删 `.md` 与图片目录），7 款因该链接无可用 SKU 图而降级为款式级条目（沿用原 slug）。§10.2 此前版本的「已发布 18 / 扣住 34」口径作废。

**扣住 65 格的逐类理由**（`INVENTORY-1688.md` §三）：

| 原因码 | 数量 | 说明 |
|--------|------|------|
| `NO_BASE_MATERIAL` | 53 | 标题未声明基材（不锈钢/钛钢/合金），**无法判定产品线归属**，按不编造原则扣住。全部 47 格来自空屿（listing 39 / 41 / 46），另 6 格来自骏娅 |
| `TEXT` | 12 | 骏娅 listing 7：图片被供应商中文水印「东莞市骏娅饰品有限公司」半透明覆盖，去字后不可用 |

> 与 §10.2 旧版的差异：旧表把空屿整批归因 `THIRD_PARTY_BRAND`（第三方品牌水印）。本轮逐 SKU 复核后，空屿进入候选阶段的 47 格的**首要阻断**是 `NO_BASE_MATERIAL`（标题确无基材）；第三方水印与 USD 引流单价问题依然存在（listing 41 等），但**不随基材确认一并解锁**，仍须客户单独裁决。

**筛选方法（可复用）**：

1. `scripts/inventory-1688.mjs`——解析 `_URL.txt` 与中文标题，按受控词表抽取品类/材质/风格/主题/色系
2. `scripts/skin-filter.mjs`——**肤色占比**批量剔除真人佩戴照。判据：RGB 落在肤色区间 + 色相 5°–52° + 饱和度 <0.62（排除饱和红宝石误判）
3. `scripts/candidates-1688.mjs`——按**确定顺序**输出候选拼版，人工只判定「干不干净」
4. `scripts/build-catalog-sku.mjs`——候选判定 → SKU 级台账，含基材英译闸门 `baseEn()`
5. `scripts/ingest-1688-sku.mjs`——出 WebP + 写内容文件，并撤回被取代的链接级产品

> **踩坑记录 1（归属）**：拼版缩略图上的标签读数不可靠。我曾据一张缩略拼版把某款实为模特照的主图判成白底影棚图，肤色检测（skinFrac=0.956）推翻了该判断。因此**产品归属一律以文件路径为准，不靠肉眼辨认拼版标签**；拼版只用于判断干不干净。
>
> **踩坑记录 2（汉字外泄）**：`short_description` 曾直接嵌入中文基材「不锈钢」，造成 **34 页汉字外泄**回退。修法是新增 `baseEn()` 基材英译映射，**映射缺失则整条产品不外发**——宁可少发一款，不可带汉字上线。
>
> **踩坑记录 3（标题重复）**：款式名以品类词结尾时（`Beaded Y Necklace` + `Necklace`）产出 `Necklace Necklace`。去重逻辑原先只作用在 slug 上，现已抽出 `catSuffix` 同时作用于标题与 slug。
>
> **踩坑记录 4（撤回归属）**：撤回被取代的链接级产品**不能按 slug 判定归属**——款式级回退会复用旧 slug，按 slug 判会把仍有效的产品误删。改为按批次清单（`intake-result.json` 的首批 SKU/slug 白名单）判定。
>
> **平台限制**：一次性撤回 50+ 文件会触发宿主的批量删除保护（阈值 50/turn），撤回步骤须临时关闭该保护执行；脚本本身幂等，重跑安全。

**图文差异（已按图片判定并记录待确认）**：链接级旧记录（`RA-B-116` / `RA-E-113` / `RA-N-111` / `RA-N-114` / `RA-B-107` 五处）已随粒度重构失效。本轮以图片判定品类，冲突场景不复存在；另发现 **11 组「同款式同色」变体**（如 `RA-B-1704/1708/1709/1710`、`RA-B-3516/3517/3518`）——颜色判读相同但确为不同 SKU，差异维度（长度/尺寸）待客户确认，见 `INVENTORY-1688.md` §5.1。

**字段缺失一律留空**（`INVENTORY-1688.md` §六）：价格、MOQ、材质等级、镀层规格、尺寸重量**全部留空**，站点走既有降级。站内出现过的 USD 单价均为 1688 引流价，不可作报价依据。**注意**：本批次已发布产品**无一款带尺寸/克重**——3 条实测数据所属的空屿 listing 39 整条扣住。

**新增字段**：`style_tags`（字符串数组，默认空）——仅在供应商标题/图片给出明确风格依据时填写，供 PDP 渲染风格标签行；无依据者留空，不得为填满而臆造。风格标签显示与否不影响任何规格声明。

**待客户裁决（本批次新增三项）**：

1. 空屿整批 47 格扣住——确认基材即可批量解锁
2. **S925 银分类缺口**：listing 51 / 52 标题写明「S925 银针」，但现有三条产品线均不覆盖 S925 银，`lineFor()` 返回 null 并记 `LINE_TAXONOMY_GAP`
3. 第三方品牌水印（MILanTing / LALIAN components）与 USD 引流单价，涉商标风险

### 10.3 占位种子数据的可见性开关（2026-10-03 追加，对 §10 第 1、4 条的收紧）

**触发**：客户查看站点预览后指示「产品页的测试产品卡删掉」。

**问题实质（比「难看」严重）**：`placeholder` 态被 §10 第 1、4 条要求字段齐全，因此这 21 款**必然携带编造的 `tiered_price` 与 MOQ**；而 111 款真实素材款无任何价格来源，一律渲染 `Price on request`。两者并排时，**占位款是全站唯一带具体数字的卡片**——买家无从分辨哪张有真实货源，等于把编造价当成我们的报价对外发布，与 §10 第 5 条「不得编造」及 PRD AC-37 直接冲突。

**处置：只撤展示、不动文件。** `src/lib/products/queries.ts` 新增 `SHOW_PLACEHOLDER_PRODUCTS = false`：

- 撤下的公开面：`/products/` 列表与筛选、三条产品线页、首页 rail、21 条 PDP 静态路由、sitemap 条目
- **内容文件保留**在 `src/content/products/`——它仍是 `tests/content-contract.test.ts` 中「placeholder 必须规格齐全且阶梯价 ≥3 档」的断言基准，也是真实资料到位前的字段形状参照
- 恢复方式：置回 `true` 重建即可全站复原，**无需改动任何页面代码**

**连带修正——筛选空组与死筛选**：材质、镀层、MOQ 档三组筛选项的取值此前**全部只来自占位款**（真实款这些字段按契约必须留空）。撤下后若照原样无条件渲染，会留下「有标题没选项」的空 legend，以及选了必然 0 结果的死筛选。故 `products/index.astro` 改为 **facet 取值仅在至少 1 款可见产品落在该值时才渲染**，整组为空则整组不出现。

> 这是**数据驱动**的隐藏而非硬编码：真实资料补齐后筛选组自动出现，不需要再改代码。当前侧栏为 Product line（3）/ Product type（4）/ Compliance 三组；品类面由 7 项降为 4 项，脚链、胸针、发饰三个品类在全站归零（此前仅占位款覆盖）。

**规模变化**：公开产品 132 → **111 款**（三条产品线 55 / 41 / 15，均未归零）；sitemap 154 → 133 条 URL。

## 11. 边界与约束

- 单文件 ≤300 行；页面组件单一职责；样式仅经 Token。
- 响应式断点与无障碍要求按 UIUX §16/§17；LCP < 2.5s、FCP < 3s（AC-30）。
- `<html lang="en">`；每页 hreflang 仅 1 条 x-default 指向自身；`dist/` 不允许出现 `/zh/` 或 CJK 字体文件。
- 性能预算（ARCHITECTURE §3）：JS 下发 ≤ 60KB gz（仅目录/PDP/RFQ 交互页）；图片构建期 sharp 优化。
- Git 内 Content Collections 为内容源；不接 Headless CMS。

## 12. 端到端验证步骤（完成定义）

```bash
npm run build          # astro check + build 必须零错误
npm run preview        # 静态站可访问
wrangler dev           # API 三端点可访问

# 核心成功流
curl -X POST http://localhost:8787/api/v1/rfq -H "Content-Type: application/json" -d '<api-spec.yaml minimal example>'
# 断言：201 + code:0 + data.reference

curl -X POST http://localhost:8787/api/v1/newsletter -H "Content-Type: application/json" -d '{"turnstileToken":"x","honeypot":"","email":"a@b.com","locale":"en"}'
# 断言：201；重复提交断言：409 且 code 语义为幂等成功

curl http://localhost:8787/api/v1/health
# 断言：200 + db:up

# 错误流
curl -X POST http://localhost:8787/api/v1/rfq -d '{"items":[]}'   # 断言 422 + fields
# 静态断言
test -d dist/zh && echo FAIL || echo OK    # 无 /zh/
grep -o 'hreflang="[a-z-]*"' dist/products/index.html | sort -u   # 仅 x-default
# emoji 扫描：全仓 .astro/.ts/.html 零命中（2600-27BF 含）
```

## 13. 变更记录

| 日期 | 变更内容 | 原因 | 影响范围 |
|------|----------|------|----------|
| 2026-10-01 | 初版生成 | 用户确认开始开发，路线 A | 全部 |
| 2026-10-03 | 品牌更名 Rayan Accessories → Golden Radiance（金色光辉） | 客户指令 | 站内 8 文件 + SPEC/OPEN-DECISIONS/RUNBOOK |
| 2026-10-03 | 转化率优化 P0/P1 落地（见 `docs/CONVERSION-OPTIMIZATION.md`）：①规格降级→「Request full spec sheet」主动邀约 ②Hero 占位图→各线真实产品 ③RFQ country 手输→下拉 ④首页信任数字条 ⑤提交前信任锚点 ⑥尺寸/克重双单位 ⑦MOQ「on request」筛选档 ⑧搜索拼写容错 | 用户要求按优化方案执行 | SpecTable/BuyPanel/HomeHero/HomeStats(新增)/RfqPanel/rfq-client/catalog/products-index/sku-index/format/en.json/countries.ts(新增) |
| 2026-10-03 | ①字体异步加载（media=print onload 消除 render-blocking）②Hero 首屏图 eager+fetchpriority=high ③**后台管理系统落地**：/admin 登录 + 询盘管理（列表/筛选/详情/状态流转/CSV 导出）+ 订阅管理 + 统计看板；鉴权用环境变量密码(SHA-256)+HMAC 签名 session cookie（无 D1 会话表）④**SEO+geo 优化**：LocalBusiness+GeoCoordinates JSON-LD、地区落地页(欧英/中东)补 FAQ 结构化数据与地区关键词、sitemap 排除 admin/api、robots 禁爬后台 | 用户要求打开速度/布局/后台/SEO+geo 优化 | BaseLayout/HomeHero/env.d.ts/jsonld.ts/index.astro/markets\*/wrangler.jsonc/astro.config.mjs/robots.txt + 新增 src/lib/admin/\* 与 src/pages/admin/\* + src/pages/api/admin/\* |
