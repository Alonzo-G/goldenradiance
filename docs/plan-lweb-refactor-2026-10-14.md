# Lweb 重构方案（待审核）

> 技能来源：`D:/edgeDownloads/lweb.zip`（Lweb — 工业品 B2B 外贸全栈站点设计流程）
> 评估对象：`D:/Ai-workbuddy-project/饰品P2P官网/main-687d4ca0`（线上 https://goldenradiance.fun）
> 日期：2026-10-14　状态：**仅方案，未动一行代码**

---

## 0. 一句话结论

Lweb 是一套**方法论 + 契约**，不是模板库。它对本站最有价值的不是配色，而是三样东西：
**首页 12 段信息节奏**、**后台运营面（Monitor / 询盘库 / 投递 / 存储 / 目录管理）**、
**发布 QA 门禁**。

但它有两个前提与本站冲突，必须先做决策（见 §2）。我的建议是**采纳结构、保留品牌**，
分 5 个批次推进，每个批次独立可上线、可回滚。

---

## 1. 技能是什么

`SKILL.md` + 6 份 reference 契约，核心主张：

| 契约 | 内容 |
| --- | --- |
| 全栈交付 | 前台 + API + 持久化 + 鉴权 + 后台，同一仓库同一次交付，禁"纯前端 mock" |
| 首页 12 段 | 固定区块顺序与密度变化（详见 §3） |
| 路由契约 | 6 个页面家族（首页/列表/应用/详情/FAQ/文章），主导航必须是真实 URL |
| 目录契约 | 分类控件 + 关键词搜索 + 结果计数 + 分栏索引 + 空态重置 |
| 详情契约 | 面包屑 + 图廊 + 采购决策面板 + 规格矩阵 + 应用适配 + 文档索取 + 关联产品 |
| 后台契约 | 8 个 hash 路由工作区、状态机、UI 有限状态、发布 QA 门禁（90/100 分/路由） |
| 设计语言 | 近黑墨色 + 冷钢灰 + 安全橙 + 氧化酒红 `#6B2C3B`；0–4px 圆角；规则线替代嵌套卡片 |
| 动效 | 仅 opacity/transform，150–300ms，必须尊重 `prefers-reduced-motion` |

---

## 2. 两个必须先决策的冲突点

### 冲突 A：品类语义不匹配（需你拍板）

Lweb 的世界观是**工业仪器**：仪表、量程、协议、图纸、校准、工程评审。首页文案示例是
`Weighing / Analysis / Level / Control`、`minimum review unit`、`inspection-grade imagery`。

本站是**饰品外贸**：手链 / 项链 / 戒指 / 耳环，两条产品线（不锈钢钛钢 608 + 时尚合金铜 404），
1014 款实拍。核心决策单位是**款式 + 材质 + 电镀 + 起订量**，不是量程和协议。

**强行照搬的后果**：把 "Bracelet" 写成 "Wrist-mounted article A-12"，把 MOQ 写成
"minimum review unit" —— 买家读不懂，而且**违反本站 P0 定位**（站内已登记：
不编造未核实数字、不伪装工业术语）。

**我的建议：保留饰品术语，采纳结构。** Lweb 的价值在节奏与信息层级，不在名词表。

### 冲突 B：品牌视觉体系（需你拍板）

| 项 | Lweb 规定 | 本站现状 | 冲突程度 |
| --- | --- | --- | --- |
| 主强调色 | 氧化酒红 `#6B2C3B` | 品牌深青 `#123a38` + 金 `#7d6330` | **高**（品牌识别） |
| 次强调色 | 安全橙 `#F26B2B` | 金色系 | 中 |
| 圆角 | 0–4px 单一克制值 | 2/4/6/8px 四级 | 低 |
| 卡片 | 规则线 + 留白，禁嵌套卡片 | 已有 `ruled` 风格但仍有 shadow-raised | 低 |
| 字体 | 现代 grotesk + 可读 sans + mono 数字 | Archivo + Public Sans + JetBrains Mono | **无，已完全符合** |

本站品牌色 `#123a38`（深青）+ `#7d6330`（金属金）**已用于 logo / favicon / wordmark / 社交图**，
是 10 月 8 日上线的品牌资产。改成酒红等于**重做品牌资产 + 换 logo**。

**我的建议：保留品牌色，把 Lweb 的酒红/橙降级为"功能色"**（CTA band、选中态、成功态），
主品牌不动。这样既拿到 Lweb 的视觉纪律，又不牺牲品牌。

---

## 3. 首页 12 段契约 vs 现状 9 段

| # | Lweb 段 | 本站现状 | 判定 |
| --- | --- | --- | --- |
| 1 | Sticky dark header + 8 导航 + 语言 + RFQ | Header 有深色 sticky、4 组下拉、RFQ | ⚠️ 导航项偏少（技能要 8 个紧凑项） |
| 2 | 全幅 dark hero + eyebrow + H1 + 技术说明 + 双 CTA + **底部 4 指标** | HomeHero 有；**4 指标独立成段**（HomeStats） | ⚠️ 指标应上移贴近 hero 底部 |
| 3 | 四项服务保障条 | HomeAdvantages 4 项 | ✅ 已符合 |
| 4 | 居中兼容性/客户证明 + 一行克制协议徽章 | **无** | ❌ 缺失（可用 EN 1811 / REACH 徽章行补） |
| 5 | 三列产品/工程范围（检验级图像） | HomeCategories（品类深链） | ⚠️ 应为三列，现状非严格三列 |
| 6 | 分栏选型指南 + 右规整对比表 | **无对比表** | ❌ 缺失（两线对比表，天然适配） |
| 7 | 六个行业/应用入口（规整网格） | HomeScenarios **仅 2 项** | ❌ 严重不足（2 → 6） |
| 8 | 深色三项案例研究 | HomeShowcase（One batch） | ⚠️ 1 区块，非三项案例 |
| 9 | 四步工程/报价/交付流程 | HomeBuyers（3 步 how） | ⚠️ 3 步 → 4 步 |
| 10 | 双栏 FAQ（原生 disclosure） | FAQ 独立页 | ⚠️ 首页无 FAQ |
| 11 | 氧化酒红项目 CTA 带 | LineCtaBand（仅落地页） | ⚠️ 首页缺 CTA 带 |
| 12 | 多列深色页脚 + 主行动 + 法务行 | Footer 已符合 | ✅ |

**结论：首页 9 段 → 12 段。** 新增 3 段（#4 徽章行、#6 两线对比表、#10 FAQ），
改造 5 段，调整 1 段（指标上移）。这是**信息架构级重构**，不是调样式。

---

## 4. 后台：现状 vs 契约（差距最大的一块）

**现状**：`/admin/` 3 个页面（login / inquiries / subscribers），209+90+73 行，
D1 已有 `rfq_inquiries` / `rfq_items` 表，HMAC session + 角色校验已实现。

**Lweb 契约**：8 个路由工作区 + 事务性 outbox + 投递 worker + 存储健康 + 目录管理。

| Lweb 工作区 | 本站对应 | 状态 |
| --- | --- | --- |
| `#overview` 指标条 + 新鲜度 | inquiries 页顶部 4 个 stat 卡 | ⚠️ 有，无新鲜度披露 |
| `#monitor` 趋势/页面来源/产品意向/漏斗/实时 | **无** | ❌ 全新 |
| `#actions` 优先动作队列 | **无** | ❌ 全新 |
| `#funnel` 漏斗阶段 | **无** | ❌ 全新 |
| `#leads` 询盘库（搜索/筛选/详情） | inquiries 页表格 + 抽屉 | ⚠️ 有基础，缺搜索与状态机 |
| `#delivery` 私有投递连接器 + worker | **无**（现是 Resend 直发邮件） | ❌ 全新 |
| `#storage` 存储健康 + 迁移 | **无** | ❌ 全新 |
| `#catalog-manager` 目录编辑/发布 | **无** | ❌ 全新 |

**诚实评估**：#delivery / #storage / #catalog-manager 这三块，
Lweb 的原始场景是「MySQL + 私有下游 CRM」，本站是「Cloudflare D1 + Resend 邮件」。
**照搬会引入不必要的复杂度**（连接器、worker 租约、加密配置信封）。

**我的建议**：
- **做**：#monitor（需求监控是真实运营刚需）、#actions、#funnel、#leads 强化、#overview 新鲜度
- **简化做**：#storage → 只做「D1 健康 + 迁移状态」（不做 MySQL 专属 UI）
- **不做**：#delivery（Resend 直发已是可靠投递，加连接器是负债）、
  #catalog-manager（1014 款产品走 Git 内容集合，运营改稿走 PR 流程更合适）

---

## 5. 目标架构

```
goldenradiance.fun
├── 前台（Astro 5 SSG，1440/768/390 三档）
│   ├── /                 首页 12 段（新建 #4 #6 #10，调整 5 段）
│   ├── /products/        目录（已有筛选+搜索+计数 → 对齐 Lweb 契约）
│   ├── /products/[sku]/  详情（补：区段索引 / 应用适配 / 文档索取 / 关联产品）
│   ├── /product-lines/   产品线（现状保留；可评估补索引页，修 404 隐患）
│   ├── /markets/         应用页家族（europe-uk / middle-east 已有）
│   ├── /faq/ /blog/ /compliance/ …  文章+FAQ 家族（已有）
│   └── /admin/           运营后台（本次重点）
│       ├── login
│       └── 工作区路由（单页 hash 路由，沿用现状"静态壳+客户端 fetch"模式）
└── 服务端（Cloudflare Workers，D1）
    ├── /api/v1/*         公开 API（rfq / newsletter / health）— 不动
    └── /api/admin/*      运营 API（+ monitor 聚合端点）
```

**技术选型保持不变**：Astro 5 SSG + Tailwind 4 + Cloudflare Workers + D1。
Lweb 是技术栈中立的（它自己说"若宿主已有框架路由就用它"），**不需要换框架**。

### 设计 Token 策略

保留 `design-tokens.json` 单一真源 + `global.css @theme` 映射，**增量扩展**：

```
新增（功能色，来自 Lweb 但降级使用）
  --color-cta-band    #6B2C3B   仅首页 CTA 带 / 产品线 CTA 带
  --color-attention   #F26B2B   仅"待处理/需注意"语义标记
  --color-verified    #58bd76   仅"已验证/已投递"语义（不复用 success 主色）

收敛
  --radius-xs/sm/md/lg  2/4/6/8px → 统一到 2/4px 双值（对齐 Lweb 0–4px）
  --shadow-raised       大部分组件改用规则线 + 边框，阴影仅保留抽屉/浮层
```

---

## 6. 分批实施计划

每批独立可上线、可回滚（`git revert` 单个 merge 即可）。

| 批次 | 内容 | 规模 | 风险 | 依赖 |
| --- | --- | --- | --- | --- |
| **B0** | 技能落地为项目规范：`docs/lweb-adoption.md` 记录采纳/不采纳项与理由；Token 增补 | 小 | 无 | 无 |
| **B1** | 首页 12 段重构：新建 #4 徽章行、#6 两线对比表、#10 FAQ；#2 指标上移；#7 场景 2→6；#9 3→4 步 | **大** | 中（信息架构变更，需视觉 QA 三档） | B0 |
| **B2** | PDP 补齐：区段索引（sticky）、应用适配段、文档索取段、关联产品（同类优先→邻类） | 中 | 中 | B0 |
| **B3** | 后台 Monitor：#overview 新鲜度 + #monitor（趋势/来源/产品意向/漏斗）+ #actions + #funnel；#leads 补搜索与状态机；D1 聚合表 | **大** | 高（新表 + 新端点） | B0 |
| **B4** | QA 门禁落地：`scripts/verify-lweb-visual.mjs`（1440/768/390 计算样式巡检）+ 接入 `npm run verify` | 中 | 低 | B1–B3 |

**不做**：#delivery 连接器、#catalog-manager 目录编辑器（理由见 §4）。

### 关键依赖与数据问题（必须在对应批次解决）

1. **#7 六场景内容**：现只有 2 个（daily / volume）。需从真实买家场景补到 6 个
   （建议：时尚品牌配饰 / 电商卖家 / 礼品定制 / 婚庆珠宝 / 大批量贴牌 / 电商快补货）。
   **不编造 MOQ 或交期数字**（P0）。
2. **#6 两线对比表**：两条线 material/plating 填充率 0%，只能做**定性对比**
   （材质定位 / 适用场景 / 可选电镀 / 起订口径），不得填未核实的数值。
3. **B3 趋势数据**：现 D1 只有询盘与订阅，无事件表。需新增匿名事件采集
   （技能契约：allow-list 匿名事件形状，拒绝可识别形状）。**须同步更新隐私页**。
4. **#4 徽章行**：EN 1811 / REACH 表述必须与 `/compliance/` 现有内容一致（不新增未核实认证）。

---

## 7. 门禁与验收

每批次交付前必须过：

```
npm test            # 84 用例（含新增）
npm run build       # astro check + build + pagefind
npm run verify      # 现有 7 个回归 + 新增 lweb visual 巡检
```

Lweb 视觉门禁（对应 `admin-monitoring-implementation.md` 的评分表）：
- 1440 / 768 / 390 三档**计算样式**巡检（非源码 token 检查）
- 页面级横向溢出 = 0；仅表格允许局部横向滚动
- 无 console error、无坏图、对比度 ≥ WCAG AA、触控目标 ≥ 44px
- 检查项：紫/蓝 AI 渐变、backdrop blur、装饰性渐变、重复标题、移动端标题裁切

---

## 8. 需要你拍板的 4 件事

1. **品类术语**：保留饰品术语（推荐）还是照 Lweb 改成工业仪器术语？
2. **品牌色**：保留 `#123a38` 深青 + 金（推荐），还是改成 Lweb 氧化酒红？
   改色 = 重做 logo/favicon/wordmark/社交图。
3. **后台范围**：做 Monitor + Actions + Funnel + Leads（推荐），
   还是连 #delivery 连接器和 #catalog-manager 一起做？
4. **批次节奏**：先做 B0+B1（前台首页 12 段，最直观），
   还是先做 B3（后台监控，运营价值最高但风险最大）？

---

## 附：勘察证据（本次实测）

| 项 | 实测 |
| --- | --- |
| 首页区块 | 9 个（Hero/Categories/Scenarios/Stats/Lines/Showcase/Advantages/Buyers/Compliance） |
| 场景数 | 2（`home.scenarios.daily` / `.volume`）—— 契约要 6 |
| 流程步数 | 3（`home.how.step1..3`）—— 契约要 4 |
| PDP 关联产品 | **0**（grep `related` 无命中） |
| PDP 区段索引 / 文档段 / 应用适配 | **无** |
| 目录页能力 | 已有：分类勾选 + 结果计数 + chips + 空态 + URL 同步 + 网格/列表双视图 |
| 后台 | 3 页 372 行，stat 卡 + 筛选 + 表格 + 详情抽屉；无搜索、无趋势、无动作队列 |
| 动效降级 | ✅ 已实现（`global.css:235` 全量 `prefers-reduced-motion` 归零） |
| 字体 | ✅ Archivo + Public Sans + JetBrains Mono，与 Lweb 要求完全一致 |
| 产品数据 | 1014 款 real，steel 608 / alloy 404，材质与 MOQ 填充率 0% |
