# PRD — 饰品 B2B 外贸全球官网（批发询盘站）

| 项 | 内容 |
|---|---|
| 文档版本 | v1.0 |
| 撰写 | 许清楚（产品经理） |
| 项目 | jewelry-b2b-global |
| 产品形态 | 展示型 B2B 官网 + RFQ 询盘转化闭环（**无在线支付、无下单商城**） |
| 客户身份 | 纯贸易公司 / SOHO 起步，**无自有工厂、无验厂资质** |
| 目标市场 | 全球（按品类分层，非按区域割裂） |

---

## 1. 问题陈述

### 1.1 谁，在什么场景下，遇到什么问题

海外批发买家（亚马逊/TikTok Shop 卖家、精品买手店、品牌贴牌方、区域进口商）要为中国饰品找一个**能长期复购、敢下大单**的供应商。他们的真实决策链路是：

> Google 搜一个带材质词的供应商词 → 打开 3-5 个中国站 → **找 MOQ、找材质规格、找检测报告、找样品政策** → 找不到就关掉 → 找到了才发一封询盘。

### 1.2 现在怎么解决的，为什么不行

现有解决方案分三类，各有硬伤：

| 现有方案 | 买家怎么用 | 为什么不解决 |
|---|---|---|
| 超大型 SKU 站（Nihao、JewelryBund 等） | 海量选品、No MOQ、直接下单 | **SKU 越多，规格越糊**。第三方评测给 Nihao「产品质量一致性 2.5/5」，差评集中「cheap alloys tarnishing quickly」「quality inconsistent」。买家买到的和图片看到的不是一回事，只能靠自己试错 |
| 平台店铺（Alibaba / Made-in-China / GlobalSources） | 站内 RFQ 比价 | 平台内是**价格战场**，供应商被压到只剩报价单；且平台只证明「公司存在」，不证明「这批货合格」 |
| 海外批发平台（Faire / FashionGo / JOOR） | 本土现货、Net 60 | 只覆盖有本地库存和品牌叙事的卖家，中国供应链几乎进不去，且价格已含多层加价 |

### 1.3 本项目的核心命题

客户是**无工厂、无验厂资质的贸易公司** —— 这既是最大的短板，也可能被转成最大的长板：

- **短板**：不能用「我们是工厂 / 5000㎡ 车间 / 日均产能 3 万件」这套话术（一验就穿帮）。
- **长板**：正因为不绑定单一工厂，才能**站在买家这一侧做筛选与验证** —— 三条产品线分别对接不同专精产线，替买家把「镀层厚度、基材牌号、镍释放、第三方报告」这些工厂不愿主动公开的东西，变成标准字段。

**本项目不是做一个「小一号的 Nihao」，而是做第一个「规格可验证的饰品批发商」。**

---

## 2. 目标用户画像

### 画像 A：跨境电商卖家（Amazon / TikTok Shop / Etsy / Shopify）
| 维度 | 描述 |
|---|---|
| 年龄/角色 | 25-40 岁，SOHO 或 2-10 人小团队，本人即采购决策人 |
| 主力市场 | 美国、英国、德国 |
| 场景 | 看到社媒爆款 → 找源头快速上款 → 小批量试单 → 卖动再翻单 |
| 技术水平 | 高（熟悉平台规则、会用插件比价、懂 FBA） |
| **最关心** | MOQ 能不能低到 30-50 件混款；有没有合规文件（平台会查）；能不能贴自有 logo；有没有可直接上架的图 |
| **最怕** | 掉色/镍超标导致差评和账号风险；图片与实物不符；交期不稳错过旺季 |
| 决策周期 | 3-14 天（最快的一类） |

### 画像 B：精品买手店 / 独立零售店主（Boutique Buyer）
| 维度 | 描述 |
|---|---|
| 年龄/角色 | 30-55 岁，店主或买手，欧美为主 |
| 场景 | 每季补货，追求「别家没有的款」 |
| **最关心** | 款式独特性 / 会不会撞款；小批量混款（10-30 件）；补货速度；包装质感 |
| **最怕** | 起订量下不来；收到货发现是烂大街款；补货时已断货 |
| 决策周期 | 2-8 周（会先买样品） |

### 画像 C：品牌贴牌 / 新兴设计师品牌（Private Label / Emerging Brand）
| 维度 | 描述 |
|---|---|
| 年龄/角色 | 28-45 岁，创始人或产品开发 |
| 场景 | 有设计稿或改款需求，找能做 OEM/ODM 的伙伴 |
| **最关心** | 打样周期与打样费能否退；最小起订；材质可追溯；设计保密 |
| **最怕** | 打样费不退且改版一次加一次钱；沟通要靠猜；设计被转手卖给别家 |
| 决策周期 | 1-3 个月（最长的一类） |

### 画像 D：区域进口商 / 批发分销商（Importer / Distributor）
| 维度 | 描述 |
|---|---|
| 角色 | 采购经理，中东、拉美、东南亚、非洲 |
| 场景 | 整柜或半柜，长期稳定供货 |
| **最关心** | FOB/CIF 条款；单位成本控制；清关文件齐全；长期供货稳定性 |
| **最怕** | 报价不含运费导致落地成本失控；清关被扣 |
| 决策周期 | 1-2 个月 |

> **V1 定位说明**：画像 A + B + D 是主战场（询盘快、验证成本低）。画像 C（贴牌）需要打样流程支撑，V1 保留入口但不做深度流程。大型连锁零售采购（要求验厂/账期）**不在 V1 服务范围内** —— 客户无资质，硬接只会暴露短板，应在 FAQ 中诚实说明边界。

---

## 3. 竞品分析

### 3.1 直接竞品（中国系出海 B2B 独立站）

| 竞品 | 官网 | 核心功能 | 优势 | 劣势（来自差评 / 第三方评测） | 定价 / MOQ |
|---|---|---|---|---|---|
| **Nihaojewelry** | https://www.nihaojewelry.com/ | 80 万+ SKU marketplace、No MOQ、DDP 包税专线、中国+墨西哥仓、VIP 阶梯折扣（累计消费 $2k 起 3%，$200k 起 15%） | No MOQ 门槛最低；品类最全；日更 1 万+ 新款；支持 PayPal/卡/TT | **产品质量一致性仅 2.5/5**（Branvas 评分）；「cheap alloys tarnishing quickly、arriving broken」；网站「functional but cluttered」，像传统 B2B 黄页；退货需自付寄回中国运费，**基本不可行**；贴牌/定制包装支持 1/5 | 单价 $1-3 为主；无 MOQ 但运费逼着走量 |
| **JewelryBund** | http://www.jewelrybund.com | 深圳贸易+工厂混合，主打 alloy/costume/水晶/玫瑰金 | 2008 年成立，宣称自有 3 家工厂；接受 T/T、西联、PayPal；多币种报价 | 站点架构老旧，产品页缺规格字段（材质等级/镀层厚度/重量全无）；无公开检测报告；无样品政策页 | 未公开；以询价为主 |
| **Yeajewel** | https://www.yeajewel.com | 不锈钢/铜/水晶/珍珠/925 银，OEM+ODM | 2014 年成立，宣称 4 万+ 客户；品类跨材质 | 单品技术规格信息缺失（第三方对比明确列为劣势）；Trustpilot 存在低分同名档案；定制能力弱 | MOQ 偏高 |
| **MissJewelry / Xuping 系** | — | 铜/不锈钢仿首饰制造商，自有品牌线 | 自有工厂，成本极低（Xuping 耳饰批量价 $0.44/对 @12000 件） | 设计同质化严重；以量取胜，不服务中小买家；无内容/合规资产 | 大批量导向 |
| **CJDropshipping / Shewin 类** | — | 一件代发 + 批发混合 | 物流整合强 | 定位 dropshipping，与本项目（批发询盘）不是同一赛道，但会抢同一批 Google 流量 | — |

### 3.2 平台型竞品（供应商店铺页信息架构）

| 平台 | 店铺页信息架构（买家看什么字段决策） | 对本项目的启示 |
|---|---|---|
| **Alibaba.com** | Gold Supplier（付费徽章）/ Verified Supplier（第三方验企）/ Trade Assurance（订单保障）；**Years on platform、Response rate、Transaction count、Reorder rate** 是真正影响判断的数字；阶梯 MOQ 报价展示 | 独立站没有平台背书，必须**自建这四类信号**：经营年限、响应时效、成交/复购、品类专注度 → 落到「About + 承诺数字 + 询盘响应」 |
| **Made-in-China** | 更重资质证书（ISO9001、CE）；RFQ 报价中标率 Top20% >18% | 客户无资质，不宜硬拼证书墙，改走「第三方检测报告（产品级）+ 验货流程」 |
| **GlobalSources** | 展会导流为主，高客单价，单客户 LTV 可达 $50k+ | 不在 V1 考虑（成本结构不匹配） |

### 3.3 海外 B2B 批发平台（买家用什么字段决策）

| 平台 | 买家的决策字段 | 启示 |
|---|---|---|
| **Faire** | Net 60 账期、**首单免费退货**（极大降低试新供应商的心理门槛）、品牌故事、MOQ $0-250、Shopify 集成 | 「首单风险逆转」是最强转化设计 → 本项目对应用 **样品费可抵扣首单 + 明确退换规则** |
| **FashionGo** | 1,400+ 供应商、MOQ 6-12 件/款、实时库存、买家评价可见、Style Match 搜图 | MOQ 必须**按款标注**，不能只写一句「MOQ 低」 |
| **Tundra** | 零佣金、直连工厂、阶梯量价自动生效 | 阶梯价要在**产品页可见**，不能只说「量大从优」 |
| **JOOR** | 品牌资质审核、数字化产品线单（linesheet） | 高门槛赛道，不进入 |

### 3.4 差评归纳：海外买家对中国饰品供应商的真实抱怨

| 抱怨 | 来源/佐证 |
|---|---|
| **镀层掉色 / 基材冒充** | 「cheap alloys tarnishing quickly」；2025 年 11 月国内抽检 21 件低价饰品，**17 件镀层厚度不达标**——某「镀金」手镯金层仅 0.03μm（国标要求 0.5μm，差 16 倍）；某标 S925 耳钉镉超标 9000 余倍（新华社/央视报道） |
| **镍超标、过敏投诉** | 约 15-20% 人群对镍过敏；抽检样品镍释放超标近 3 倍 |
| **图片与实物不符** | Reddit 高频抱怨「Jewelry doesn't match advertised specifications，特别是宝石尺寸与净度」 |
| **MOQ 过高 / 报价不含运费** | 「Shipping costs are calculated by weight and volume；shipping a few items by air can cost more than the items themselves」 |
| **样品贵且不退** | 「A supplier who refuses to provide a sample, or demands an unreasonable sample fee, is a red flag」 |
| **无第三方检测报告 / 报告造假** | 400 元即可购买虚假 CNAS/CMA 质检报告（媒体调查）→ **买家对「有报告」也已不信任，必须可核验（报告编号 + 出具机构 + 批次）** |
| **沟通响应慢** | 平台数据：48 小时未回复，成交转化率降至不足 5%；72% 采购商期望 1 小时内获回复 |
| **交期不稳** | 旺季延时、无明确生产周期承诺 |

---

## 4. 我们的差异化（市场空白点）

### 4.1 核心市场空白：**「规格可验证」是行业集体缺位的一环**

所有竞品都在同一个维度上内卷 —— **SKU 数量、价格、MOQ**。而买家真正卡住的那一环（**这批货到底合不合格**），**没有任何一个中国系 B2B 饰品站把它做成产品页的标准字段**。Nihao 能写出 304 不锈钢、PVD、0.03μm 镀层、5g 重量（它自己 blog 里就在教买家认这些字段），但那是**个例而非标准**，且 80 万 SKU 里绝大多数仍是「材质：合金」三个字。

媒体已把行业底裤扒开（镀层普遍 0.0Xμm、镉超标千倍、假报告 400 元可买），**海外买家的不信任已从「有没有报告」升级到「报告能不能核」**。

### 4.2 差异化定位

> **Spec-First Sourcing：每一个 SKU 都带可核验的规格，每一份报价都附批次报告。**

三条差异化支柱：

| 支柱 | 具体做法 | 为什么竞品做不到 |
|---|---|---|
| **① 规格字段强制化** | 每个产品页强制展示 7 项：基材牌号 / 镀层方式与厚度 / 尺寸与重量 / MOQ / 阶梯价区间 / 合规标签 / 检测报告编号 | 大 SKU 站无法给 80 万个 SKU 补规格，成本不可承受；我们是**精挑 SKU**（数百款量级），能做到 |
| **② 身份诚实化（把短板转成信任）** | 明确写「我们是贸易采购伙伴，不是工厂」，并公开**合作产线分工 + 我方验货流程（AQL 抽检标准）**。同时公开说明：**检测报告按批次出具，随每一份报价提供** —— 是**承诺**而非已持有 | 所有竞品都在吹「自有工厂」，买家已免疫；**唯一敢说自己不是工厂、也敢说自己手上还没有现成报告的站，反而最可信** |
| **③ 风险逆转（对标 Faire 首单免费退货）** | 样品费可全额抵扣首单；首单货不对板按 AQL 标准赔付；询盘响应承诺（含时区表，具体时长待客户确认） | 竞品退货要买家自付寄回中国运费，等于没有退货 |
| **④ 合规教育（新增，因报告暂缺而强化）** | `/compliance/` 与 EN 1811 子专题的定位**从「我们有资质」改为「我们教你识别」**：讲清 EN 12472 为什么是关键、怎么核验一份报告真伪、怎么问供应商才问得到真话 | 竞品要么贴一堆证书图（可伪造），要么完全不提。行业已被媒体曝光假报告 400 元可买，**教买家识别比自证更有说服力，也更符合我们现在的真实状态** |

> **重要口径修正（客户确认：目前暂无现成检测报告，后续可做）**
> 支柱①的「检测报告编号」字段在 V1 一律走 §6.2 降级写法 `On request — provided with your quotation`（AC-38）。
> **差异化没有因此削弱，反而更锋利**：我们的主张不是「我们已通过检测」，而是「**我们把规格摊开给你，并承诺按批次送检、报告随报价给你，还教你如何核**」。这恰恰落在 §4.1 说的市场空白上 —— 买家要的不是一张证书照片，是可核验的承诺。

### 4.3 一句话定位（给设计师/架构师的统一口径）

**「The jewelry sourcing partner that shows you the spec sheet before you ask.」**
（在你开口之前，就先把规格书摊给你看的饰品采购伙伴。）

> 这句话**不依赖「已持有报告」**，无需改动。

---

## 5. 目标市场分层与产品线映射

### 5.1 采购偏好矩阵

| 市场 | 主力品类偏好 | 买家关注点 | 合规要求（必写进站点） | 价格敏感度 | 是否做区域页 |
|---|---|---|---|---|---|
| **北美 US/CA** | 不锈钢/钛钢（防水不掉色）、天然石/珍珠 | 合规文件、防水不掉色、可上架图、贴牌、亚马逊可售 | CPSIA（儿童款铅 ≤100ppm）；加州 Prop 65（铅/镉警示）；FTC 材质标注指引 | 中（愿为合规付溢价） | **是（P1）** |
| **西欧/英国** | 不锈钢/钛钢（316L 低镍释放）、天然石、极简款 | REACH 合规、回收材料、极简设计、可追溯 | **REACH 附件 XVII**：Pb ≤0.05%(500ppm)、Cd ≤0.01%(100ppm)、**镍释放 ≤0.5 µg/cm²/week（耳针 0.2）**，测试标准 EN 1811（无镀层）/ EN 12472（有镀层，模拟磨损）；UKCA | 中低（重质轻价） | **是（P1，优先）** |
| **中东 UAE/SA** | **时尚合金/铜饰**（重工、金色）、18K 金色 PVD 不锈钢 | 金色观感、**镀层厚度 0.3-0.5μm**（其他市场标准仅 0.1-0.2）、阿拉伯语包装、Halal 供应链文件 | 无强制重金属法规；需原产地/清关文件 | 中高（量大压价） | **是（P1，优先）** |
| **东南亚 VN/ID/TH/PH** | 不锈钢（热带防水是**底线**不是卖点）、时尚合金 | 50-200 件小批量、7-14 天补货周期、必须防水 | 无强制；但 **304 在 80% 湿度下数周变色 → 必须 316L + PVD** | 高 | 否（并入通用「Emerging Markets」） |
| **日韩/澳洲** | **天然石/人造宝石/珍珠**、精致小件合金 | 做工精细度、尺寸精准、无瑕疵、包装 | 日本对饰品重金属有指引；澳洲 ACCC 一般消费品安全 | 低（重质） | 否（英文站覆盖） |
| **拉美 BR/MX/CO** | 时尚合金（大胆撞色）、天然石、birthstone | 运费与清关（要 DDP）、落地成本 | 巴西部分品类 INMETRO | 高 | 否（P2） |
| **非洲 NG/KE/ZA** | 时尚合金/铜饰（金色重工） | 极低单价、清关能力 | 无强制 | 极高 | 否（P2） |

### 5.2 产品线 → 市场 映射（结论）

| 产品线 | 主攻市场 | 主攻理由 |
|---|---|---|
| **① 时尚合金 / 铜饰** | 中东（主）、拉美、非洲、东南亚 | 金色重工观感 + 价格驱动；中东买家要求厚金 PVD（0.3-0.5μm）是可写入产品页的差异化规格 |
| **② 不锈钢 / 钛钢** | 北美、西欧/英国（主）、东南亚 | 合规驱动（316L 天然低镍释放）+ 防水驱动（热带气候）；「waterproof / non-tarnish / hypoallergenic」是欧美买家实际搜索词 |
| **③ 天然石 / 人造宝石 / 珍珠** | 日韩澳洲（主）、欧美买手店、北美 | 设计驱动 + 独特性；买手店最怕撞款，天然石每颗纹理不同天然带「非标」属性 |

### 5.3 区域 Landing Page 结论

**V1 只做 2 个区域页，不做全语种站点。**

| 优先级 | 区域页 | 理由 |
|---|---|---|
| **P0（V1 必做）** | 无独立区域页，但**全站合规内容按市场可切换**（产品页顶部一个「Ship to / Compliance for」选择器） | 低成本拿到「按市场给合规信息」的核心价值，避免 V1 内容量失控 |
| **P1** | `/markets/middle-east`（英文，含阿拉伯语文案块） | 中东镀层规格诉求（0.3-0.5μm）与欧美差异最大，且是合金线的主战场，ROI 最高 |
| **P1** | `/markets/europe-uk`（英文，含 REACH/EN 1811 专章） | 欧盟合规是最硬的内容资产，也是「EN 1811 compliant jewelry supplier」这类低竞争高意图关键词的落点 |
| **P2 / Backlog** | 东南亚、拉美、日韩 | 用 Blog 长尾覆盖，不建独立页 |

**多语言结论**：V1 **只做英文站**（全球 B2B 买家通用，且美国拼写 `jewelry` 搜索量远高于英式 `jewellery`，全站统一用 `jewelry`）。中东页内嵌阿拉伯语文案块（不建全阿语站）。西班牙语/法语/德语放 **P2 Backlog**。

### 5.4 出口合规要求清单（必须写入站点「Compliance」页）

| 法规 / 标准 | 适用市场 | 限值 / 要求 | 站点呈现方式 |
|---|---|---|---|
| **REACH 附件 XVII Entry 27（镍释放）** | 欧盟 + 英国 | 长期接触皮肤饰品 **≤0.5 µg/cm²/week**；穿刺耳针 **≤0.2 µg/cm²/week** | 产品页合规标签 + Compliance 页专章 |
| **EN 1811** | 欧盟 | 无镀层制品镍释放测试方法 | Compliance 页「我们怎么测」 |
| **EN 12472** | 欧盟 | **有镀层制品**镍释放测试方法（模拟磨损后测）—— 镀层薄了这里就会挂 | Compliance 页 **重点解释**（这是买家最不懂、最该被教育的点） |
| **REACH 附件 XVII Entry 63（铅）** | 欧盟 | Pb ≤0.05% by weight（500ppm） | Compliance 页 + 报告字段 |
| **REACH 附件 XVII Entry 23（镉）** | 欧盟 | Cd ≤0.01% by weight（100ppm） | Compliance 页 + 报告字段 |
| **CPSIA（铅）** | 美国 | 儿童饰品铅 ≤100ppm；儿童用品需第三方测试 | 产品页「Children's」分类单独标注 |
| **California Prop 65** | 美国加州 | 含铅/镉等清单化学物质需警示标签；提供检测数据可免除 | Compliance 页 + 报价单备注 |
| **ASTM F2999（成人饰品） / F2923（儿童饰品）** | 美国 | 饰品安全标准 | Compliance 页 |
| **FTC 材质标注指引** | 美国 | 贵金属纯度标注（如 925）不得误导 | 全站**禁用未经验证的贵金属印记文案**（客户不做银饰，天然规避此风险，但需在 Compliance 页说明「我们不标注未经检测的贵金属印记」） |
| **盐雾测试 ASTM B117** | 全球 | 加速腐蚀测试，支撑「waterproof / sweat-safe」宣称 | 不锈钢线产品页（宣称防水的必须可追溯到测试） |
| **HS 编码 7117.19.55** | 美国清关 | 仿首饰（非贵金属）子目，多数不锈钢仿首饰免税，但**商业发票描述必须准确**，否则被重新归类 | Logistics 页（这是买家最容易踩的坑，写了就是内容资产） |

> **内容红线**：Compliance 页**不得**做「全站一刀切的合格声明」。检测结果随合金、镀层、批次变化，必须写清楚「报告按批次出具，随 RFQ 提供与你订单匹配的报告」——这既是诚实，也是专业（竞品普遍做不到，或不敢说）。
>
> **现状补充（客户确认）**：客户**目前暂无现成检测报告，后续可做**。因此在 V1 全站语义中，报告一律是**承诺**而非**已持有**。见 §4.2 口径修正与 §5.5 检测补做建议。

### 5.5 建议客户优先补做的第三方检测（决策参考，**非 V1 交付物**）

客户已表示检测可以后续做。以下按**投入产出比**排序，供客户决策；PRD 不把它列为 V1 范围。

| 优先级 | 检测项 | 覆盖市场 / 用途 | 建议做法 | 大致成本档位（人民币，仅量级参考） |
|---|---|---|---|---|
| **P1（最高）** | **EN 12472 + EN 1811 镍释放** | 欧盟 + 英国；也是「Spec-First」定位的实证基石 | 从**不锈钢/钛钢线**各抽 2-3 个主力款送检（316L 天然易过，成功率最高，先拿下一批真实报告） | 单款约 800-1,500 元，3-5 款约 4,000-7,000 元 |
| **P1** | **REACH 铅 + 镉（Pb ≤0.05% / Cd ≤0.01%）** | 欧盟 + 英国；常与镍释放同批送检、共用样品 | 与上一项合并送检，同一批样品可同时出铅镉结果，边际成本很低 | 与上项合并，增量约 500-1,000 元 |
| **P2** | **CPSIA 铅 + 镉（儿童款另计）** | 美国；加州 Prop 65 的免警示依据 | 只在**有儿童款**或买家明确要求时做；先覆盖北美主推款 | 单款约 800-1,500 元 |
| **P2** | **ASTM B117 盐雾测试** | 支撑「waterproof / sweat-safe」宣称 | 只在产品页**实际写了**防水宣称的款上做 —— 没做测试就不能写这个宣称（AC-08） | 单款约 500-1,000 元 |
| **P3** | **镀层厚度 XRF 测量** | 中东买家最关心的 0.3-0.5μm 厚金诉求 | 单款成本最低、说服力最直接，适合合金线主力款先做 | 单款约 200-500 元 |
| **P3** | **ISO 9001 / BSCI（工厂体系类）** | 大型连锁零售采购会问 | **不建议现在做** —— 客户是贸易公司无自有工厂，做体系认证性价比低，且 V1 目标客群（卖家/买手店/进口商）不要求 | 数千至数万元，暂不建议 |

**给客户的一句话建议**：先花约 5,000-8,000 元把「不锈钢线 3-5 款 + 镍释放 + 铅镉」这一批做掉，就能让 `/compliance/` 页和 PDP 从「承诺」升级为「有实证」——这是全站信任度提升性价比最高的一笔投入。

> **注意**：以上成本为市场量级参考，**非报价**。V1 上线不依赖这些检测，按 §6.2 降级写法即可正常发布。

---

## 6. 核心功能清单（RICE 排序）

**RICE Score = (Reach × Impact × Confidence) / Effort**
- Reach 1-10（每季度受影响用户比例）；Impact 0.25/0.5/1/2/3；Confidence 50%/80%/100%；Effort 1-10（人月，1=半天，10=3 个月以上）

### P0 — V1 必须交付

| ID | 功能 | Reach | Impact | Conf | Effort | **Score** | 说明 |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| **F1** | **三层产品线分类导航 + 多维筛选**（线→品类→款；筛选：材质/镀层/品类/市场合规/价格档/**MOQ 区间**） | 10 | 3 | 100% | 3 | **10.0** | 网站的骨架。买家第一动作就是「按材质找」。**MOQ 区间过滤是硬要求**：客户实测 MOQ 按款跨 12-120 件，跨度 10 倍，筛不出来等于没有（见 AC-02） |
| **F2** | **产品详情页规格化字段**（7 项强制：基材牌号 / 镀层方式与厚度 / 尺寸重量 / MOQ / 阶梯价区间 / 合规标签 / 检测报告编号） | 10 | 3 | 100% | 4 | **7.5** | **差异化的物理载体**。没有它，其他一切都是空话 |
| **F3** | **结构化 RFQ 询价篮**（加询 → 选数量档 → 带出阶梯价区间 → 填目标市场 → 自动附加该市场合规要求 → 提交） | 9 | 3 | 100% | 4 | **6.75** | 把「聊天式询盘」变成「报价就绪的规格单」，直接决定询盘质量 |
| **F3-a** | **RFQ 输入侧「粘贴 SKU 编码」入口**（textarea + 容错解析，支持逗号/空格/换行分隔的 SKU 码） | 4 | 2 | 80% | 1 | **6.4** | **入口而非出口**：承接「买家手上已有 SKU 清单」的场景，成本极低、直接抬升 RFQ 数量。见 §6.3 决策说明 |
| **F4** | **合规与检测中心页**（REACH/EN 1811/EN 12472/CPSIA/Prop 65 + 报告编号可查询 + 「如何核报告」指南） | 7 | 3 | 100% | 3 | **7.0** | **信任的第一支柱**，且是最好的低竞争 SEO 资产 |
| **F5** | **样品政策页 + 样品申请流程**（可申请 5 款以内样品，批发价+运费，样品费可抵首单） | 8 | 2 | 100% | 2 | **8.0** | 风险逆转，对标 Faire 首单免费退货的心理效果 |
| **F6** | **全站快速联系入口**（WhatsApp 浮动按钮 / 邮箱 / 询盘入口，移动端常驻） | 10 | 2 | 100% | 1 | **20.0** | **最高性价比**。成本极低、覆盖 100% 页面 |
| **F7** | **首页信任首屏**（明确贸易伙伴身份 + 三条产品线 + 可验证承诺数字 + 8 小时响应承诺） | 10 | 2 | 100% | 2 | **10.0** | 5 秒定生死。必须把「不是工厂但更可信」讲清楚 |
| **F8** | **合作产线与质控页**（三条线分别对接哪类产线、AQL 验货标准、验货照片/视频） | 7 | 3 | 100% | 3 | **7.0** | **把「无工厂」从劣势转优势的关键页** |
| **F9** | **SEO 技术基础**（语义化 URL / meta / Product+Organization 结构化数据 / sitemap / 图片 alt / 多尺寸懒加载） | 8 | 2 | 100% | 2 | **8.0** | 不做 = 后续所有内容投入打水漂 |
| **F10** | **物流与付款条款页**（运输方式与时效区间 / FOB-CIF-DDP 解释 / HS 编码提示 / 付款方式 / MOQ 与交期） | 8 | 2 | 100% | 2 | **8.0** | 买家抱怨最多的「运费不透明」直接在这里解决 |
| **F11** | **FAQ 页**（按买家阶段分组：选品 / 合规 / 样品 / 交期 / 付款 / 定制） | 8 | 1 | 100% | 1.5 | **5.3** | 低成本拦截低质询盘，释放人力 |

### P1 — V1.1 迭代

| ID | 功能 | Reach | Impact | Conf | Effort | **Score** | 说明 |
|---|---|:--:|:--:|:--:|:--:|:--:|---|
| F12 | 区域 Landing Page（`/markets/middle-east`、`/markets/europe-uk`） | 5 | 3 | 80% | 5 | **2.4** | 见 5.3 节，ROI 高但内容量大 |
| F13 | Blog / 采购指南内容中心（长尾词承接） | 5 | 2 | 80% | 4 | **2.0** | SEO 复利，需持续投入，V1 先建框架 + 6 篇种子文章 |
| F14 | 产品线专属工艺页（PVD 电镀 / 天然石分级 / 珍珠分级） | 4 | 2 | 80% | 3 | **2.13** | 强化「品类专业度」，承接工艺类长尾词 |
| F15 | 阶梯价与批量报价计算器（输入数量 → 估算区间 → 引导 RFQ） | 5 | 2 | 80% | 4 | **2.0** | 提升询盘质量，但需价格数据支撑 |
| F16 | 货币显示切换（USD/EUR/GBP/AED 参考价，非实时结算） | 6 | 1 | 80% | 3 | **1.6** | 只做展示换算，不做结算 |
| F17 | 新品订阅（New Arrivals + 邮件简报） | 4 | 1 | 80% | 3 | **1.07** | 留存与复购，V1 先做 RSS/邮件入口 |

### P2 — Backlog（暂不做）

| ID | 功能 | Score | 说明 |
|---|---|:--:|---|
| F18 | 多语言全站（ES/FR/DE/AR） | 1.6 | 内容维护成本高，V1 无翻译产能 |
| F19 | 买家登录区（询盘历史 / 样品单状态 / 目录下载） | 0.67 | 登录墙会降低询盘率，且需后端账号体系 |
| F20 | 买家评价 / 案例展示区 | 1.0 | V1 无真实评价数据，**空评价区比没有更糟** |
| F21 | **SKU 清单导出（CSV / PDF）** | 0.5 | Reach 3 / Impact 1 / Conf 50% / Effort 3。真实需求但人群窄；且**导出等于把清单交给买家去比价**，与「留在 RFQ 流程内」的目标相悖。审批场景已由 AC-14 的确认邮件覆盖，见 §6.3 |
| F22 | RFQ 输入侧「上传 CSV 文件」 | 1.6 | 需先发布 CSV 模板页 + 处理解析失败的多种边界，V1 不值得。先做 F3-a 纯文本粘贴，验证需求真实存在再升级 |

### 6.1 MVP 范围（V1 只做这些）

**P0 全部（F1-F11 + F3-a）+ Blog 框架（F13 的最小版：栏目 + 6 篇种子文章）。**

理由：F13 的种子文章是「EN 12472」「如何核检测报告」这类**低竞争高意图**内容的落点，也是 F4 合规页的流量入口，两者互为依赖，不能拆。除此之外，**P1 与 P2 全部推迟**。

MVP 的成功判据（上线 90 天）：
- 自然搜索进入 ≥ 500 UV/月（主要来自材质+MOQ 长尾词）
- 有效 RFQ ≥ 30 条/月（"有效"定义：含目标市场 + 预估数量）
- 样品申请转化率 ≥ 15%（申请 → 实际寄样）
- 询盘首响 ≤ 8 小时达成率 ≥ 90%

### 6.2 V1 上线门槛：真实数据到位前，禁止出现具体数字

客户真实数据（SKU 数、MOQ、价格、交期、覆盖国家数、响应时长、产线数量）到位前，**任何页面不得写入具体数字**。这条与设计师文档 §17 的口径完全一致，是交付质量红线，不是建议。

**降级写法对照表**（数字缺失时直接采用左列表述，不得留空、不得虚标、不得写占位符）：

| 想要表达 | 有真实数据时 | **无数据时的降级写法** |
|---|---|---|
| SKU 深度 | `1,240 styles` | `Catalogue depth varies by line` |
| 起订量 | `MOQ from 12 pcs` | `Low MOQ, stated per style` |
| 价格 | `From $0.38/pc` | `Priced by tier — see each collection` |
| 交期 | `Ships in 15 days` | `Lead time quoted per order` |
| 覆盖国家 | `Ships to 60+ markets` | `Ships worldwide` |
| 响应时长 | `Reply within 8 business hours` | `Quoted by a person, not a bot` |
| 产线数量 | `Eleven partner workshops since 2019` | `A vetted workshop network, audited per lot` |
| 检测报告 | `Report SGS-2026-XXXXX` | `On request — provided with your quotation` |

**规则**：能承诺什么就写什么，承诺不了的整条删掉，不留空言。设计师与前端一律照此表执行。

#### 6.2.1 客户已确认的真实数据（可直接落定，不再走降级）

| 项 | 客户答复 | 落定后的写法 | 仍未定的项 |
|---|---|---|---|
| **产品图** | **有几百款可商用实拍图，质量尚好** | §6.2 不适用。Hero 竖切条 / 产品线 Landing / PDP 均按真图设计（§17 第 9 项解锁） | 需客户做一轮「可用图筛选」，口径见 §6.4 |
| **检测报告** | **暂无现成报告，承认后续可做** | **继续走降级**：`On request — provided with your quotation`（AC-38）。**报告是承诺而非已持有** | 补做优先级见 §5.5 |
| **SKU 规模** | **数百款** | 可写 `hundreds of styles`（量级表述，**不写精确数** —— 客户给的是量级不是确数，写死数字有虚标风险） | 各产品线的具体分布 |
| **MOQ** | **按款 12-120 件** | 可写 `MOQ 12-120 pcs, stated per style` | 每条线各自的典型档位 |
| **后台语言** | **需要中文后台** | 后台 admin UI 用中文；前台仍只英文 | 见 §6.5 |

> **仍未确认、继续走降级的项**：阶梯价档位、真实交期、可承诺的响应时长、覆盖国家/地区数、物流方式与承运商、样品政策细节、品牌名与 Logo、合作产线数量与年限。

### 6.3 关于「SKU 清单导入 / 导出」的决策说明

设计师提出的这个问题，输入侧与输出侧要分开判断，结论相反：

| 方向 | 结论 | 理由 |
|---|---|---|
| **输入侧**（买家把已有 SKU 清单交给我们） | **做，进 P0（F3-a）** | 这是**入口不是出口**。买家手上常有上次采购的 Excel 或目录抄码，纯文本粘贴 + 容错解析成本极低（Effort 1），直接抬升 RFQ 数量。**V1 只做纯文本粘贴，不做 CSV 上传**（F22 推迟：需先发布模板页并处理解析失败边界） |
| **输出侧**（我们把清单导出给买家） | **不做 V1，进 P2（F21）** | ① **AC-14 已要求 RFQ 确认邮件包含完整 SKU 清单（规格 + 数量档 + MOQ + 阶梯价），买家可直接转发给采购经理审批** —— 审批场景已被覆盖；② 导出文件等于把结构化清单交给买家去横向比价，与「把他留在我们的 RFQ 流程内」相悖；③ Reach 窄、Effort 不低，RICE 仅 0.5 |

**对设计的直接影响**：§8.3 RFQ 空状态的 `Paste SKU codes` **保留并进 V1**；`Upload a CSV` **降为 P1，V1 先不画**；§7.4 工具栏**不加 download 出口**。

### 6.4 图片交付筛选口径（客户待办，非我方产出）

客户有几百款实拍图，但**其中符合 UIUX §6.1 最低拍摄标准的数量未知**。上线前需客户按以下口径做一轮筛选，逐款判定「可用 / 需补拍 / 弃用」：

| 检查项 | 判定标准 | 不通过的处理 |
|---|---|---|
| **主图背景** | 是否去背干净 / 背景是否统一干净 | 背景杂乱但产品清晰的 → 走 UIUX §6.3 的 CSS 补救；背景脏且无法修的 → 弃用 |
| **光位一致性** | 同一产品线内是否同一光位、同一色温 | 色温不一致的 → 归到同一批次分组展示，**不要跨批次混排**（会暴露图片来源不一） |
| **撞图 / arbitrage 风险** | 该图是否是从供应商/同行处直接拿的公开图（买家反向搜图能搜到别家在用） | **高风险图一律不用**。这直接摧毁「Spec-First」的可信度 —— 客户无工厂，若买家发现图是搬来的，等于坐实了「二道贩子且无质控」 |
| **每 SKU 帧数** | 是否满足 UIUX §6.2 的 4 帧规范（主图 / 细节 / 佩戴或比例 / 背面或扣件） | 缺帧的 → 标为「需补拍」，优先补齐主推款 |
| **分辨率** | 主图长边是否 ≥1500px（低于此值在 Google 图片搜索的曝光会显著下降） | 不足的 → 弃用或补拍 |

**给客户的交付要求**：筛选后按「可用 / 需补拍 / 弃用」三分类给出清单，**可用图数量必须覆盖 V1 首页 Hero（3 条线各 3-4 张）+ 三条产品线 Landing + 全部上线 SKU 的主图与细节帧**。若可用图不足以覆盖全部 SKU，**宁可先上线图齐的那一批 SKU，也不要用不合格图凑数**。

### 6.5 前台 locale 与后台 admin UI locale 是两个概念（勿混淆）

| 概念 | 定义 | V1 结论 |
|---|---|---|
| **前台 locale（storefront locale）** | 买家看到的站点语言 | **只做英文**（美式拼写 `jewelry`）。**不出现语言切换器**，不渲染禁用态下拉。中东页内嵌阿语块属于「页内文案块」，不是 locale 切换 |
| **后台 admin UI locale（admin UI locale）** | 客户/运营登录后台管理内容时看到的界面语言 | **中文**。与前台完全解耦，不影响前台任何路由、URL、hreflang 或 i18n key 设计 |

**影响**：
- 中文字体（HarmonyOS Sans SC 一类）**只在 `/admin` 加载**，前台 bundle 不得包含 —— 否则白给全球访客加几百 KB
- 后台中文是**界面文案**，不是内容翻译。前台内容仍然只有英文一份，后台不做多语言内容管理（V1 无此需求）
- 架构师需确保 admin 与 storefront 是两套 locale 上下文，不要共用一个 `lang` 状态

---

## 7. 明确不做（Out-of-Scope）

| # | 不做的事 | 原因 |
|---|---|---|
| 1 | **在线支付 / 结账 / 下单商城** | 客户无标准化报价体系，B2B 首单必经议价；在线支付会锁死价格并引发争议。且无支付牌照与风控能力。V1 只做到 RFQ |
| 2 | **实时库存显示** | 贸易公司无自有仓，库存来自合作产线，同步不可靠。**错误库存 = 信任崩塌**，比不显示更糟 |
| 3 | **任何「自有工厂」表述 / 工厂实拍 / 车间视频 / VR 验厂** | 客户无工厂。买家会要求视频验厂，一验穿帮。**改为「合作产线 + AQL 验货流程」的诚实表述** |
| 4 | **925 银饰产品线** | 客户明确不做。且银价波动 + 银标合规风险极高（抽检显示 75% 标 S925 实为合金，行业信任已被破坏），不碰是明智的 |
| 5 | **贵金属印记类文案（"925"、"足金999"、"Sterling Silver"）** | 未检测不得标注。FTC 对此有明确指引，违规 = 扣货 + 罚款 |
| 6 | **全站一刀切的「合规合格声明」** | 检测结果随合金/镀层/批次变化，通用声明不可防御，且与「可验证」定位自相矛盾 |
| 7 | **买家注册 / 登录墙** | 登录墙是询盘率杀手。V1 询盘走邮箱 + WhatsApp |
| 8 | **AI 在线客服机器人** | 无 24h 人工坐席，机器人答非所问损害专业度。**改为「8 小时人工响应承诺 + 时区对照表」** |
| 9 | **第三方评价插件 / 评价区** | 无真实数据（见 F20） |
| 10 | **买家端实时聊天（Live Chat）** | 同上，无坐席支撑。WhatsApp 异步沟通更符合跨境时差现实 |
| 11 | **一键代发（Dropshipping）功能** | 与批发询盘定位冲突，且物流成本结构上不成立 |
| 12 | **多币种切换（含展示级换算）** | **V1 不进**（F16 为 P1，RICE 1.6）。理由：① 无支付则无结算需求；② 报价按单议价，展示换算反而制造"这就是成交价"的误会；③ 全站 Ship-to 选择器**只承载「合规内容」这一件事**，让它同时管币种会导致语义混淆。**V1 全站只标 USD**（价格区间一律写作 `USD 3.80-4.60`，币种写进价格串本身，不做独立切换器） |
| 13 | **前台语言切换器** | V1 只做英文站，不做 EN/ES/AR 下拉。**UI 上直接不出现语言选择器**，不要渲染成禁用态下拉（禁用态会暗示"更多语言即将上线"，是虚假承诺） |
| 14 | **SKU 清单导出（CSV / PDF）** | 见 §6.3，进 P2（F21） |
| 15 | **任何暗示「已持有资质」的断言**：`Certified` / `Approved` / `Tested` / `Compliant` / `Certification` 徽章墙 / 证书图 / 徽标墙 | **客户目前暂无任何现成检测报告**（§6.2.1）。使用这类词等于虚假陈述，一旦买家索要编号即穿帮，且直接摧毁 §4 的核心差异化。允许的表述只有两类：① **承诺式** —— `Test reports issued per batch, provided with your quotation`；② **教育式** —— 讲标准是什么、怎么核报告。**不得出现证书图形、徽标墙、实验室 logo**（AC-41） |
| 16 | **后台多语言内容管理（前台内容的翻译工作流）** | V1 前台内容只有英文一份。后台界面是中文（§6.5），但**不做内容翻译管理** —— 没有第二语言可管 |

---

## 8. 验收标准（EARS 格式）

> EARS：Ubiquitous(The … shall …) / Event-driven(When …, the … shall …) / State-driven(While …, the … shall …) / Unwanted(If …, then the … shall …) / Optional(Where …, the … shall …)

### 8.1 产品线分类导航（F1）

- **AC-01** — The system shall expose the three product lines (Fashion Alloy & Brass / Stainless & Titanium Steel / Natural Stone, Lab Gemstone & Pearl) as top-level navigation entries on every page.
- **AC-02** — When a buyer selects a product line, the system shall display only SKUs belonging to that line, with a filter bar containing: material grade, plating method, product type, compliance tag, and MOQ band.
- **AC-02a** — The MOQ filter shall support range selection across the full 12-120 pcs span (e.g. 12-30 / 31-60 / 61-120), because per-style MOQ varies tenfold and MOQ is the buyer's first decision field. A single "MOQ" sort without range filtering does not satisfy this requirement.
- **AC-03** — When a buyer applies two or more filters, the system shall show the count of matching SKUs and allow each active filter to be removed individually.
- **AC-04** — If a filter combination returns zero results, then the system shall display an empty state offering the nearest broader result set and a direct "Request a product not listed" RFQ entry.

### 8.2 产品详情页（F2）

- **AC-05** — The system shall render, for every product, the seven mandatory spec fields: base material grade, plating method and thickness, dimensions and weight, MOQ, tiered price range, compliance tag, and test report reference.
- **AC-06** — If any of the seven mandatory spec fields is missing from the product data, then the system shall display that field as「On request — ask with your RFQ」rather than omitting it or displaying a placeholder value.
- **AC-07** — While the buyer is on a product page, the system shall display a tiered price table with at least three quantity bands, each band showing a unit price **range** (not a fixed price).
- **AC-08** — Where a product carries a「waterproof」or「non-tarnish」claim, the system shall display the supporting test reference (e.g. ASTM B117 salt spray hours) adjacent to that claim.
- **AC-09** — The system shall not render any precious-metal hallmark text (e.g. "925", "Sterling Silver", "999") unless a test report reference for that hallmark is attached to the SKU.

### 8.3 RFQ 询价篮（F3）

- **AC-10** — When a buyer adds a product to the inquiry basket, the system shall record SKU, selected quantity band, and any per-SKU note, and shall persist the basket across page navigation for at least 7 days without requiring login.
- **AC-11** — When the buyer submits the inquiry basket, the system shall require: company name, contact name, business email, destination country/market, and estimated total quantity.
- **AC-12** — When the buyer selects a destination market, the system shall attach the compliance requirements applicable to that market to the RFQ payload and display a summary of those requirements to the buyer before submission.
- **AC-13** — If the buyer submits the basket with fewer than 1 SKU, then the system shall block submission and prompt the buyer to add at least one product.
- **AC-14** — When an RFQ is successfully submitted, the system shall send a confirmation email containing the full RFQ content and a stated first-response commitment (8 business hours).
- **AC-15** — The system shall deliver every RFQ to both the sales mailbox and the internal notification channel within 5 minutes of submission.
- **AC-16** — If the RFQ submission fails due to a server or mail error, then the system shall retain the basket contents and display an actionable error message with an alternative contact channel (WhatsApp / email).

### 8.4 合规与检测中心（F4）

- **AC-17** — The system shall publish a Compliance page covering REACH nickel release (0.5 / 0.2 µg/cm²/week), EN 1811, EN 12472, REACH lead and cadmium limits, CPSIA, California Prop 65, and ASTM F2999 / F2923.
- **AC-18** — The system shall state explicitly that test reports are issued per batch and are provided with the quotation for the matching product, and shall not display any site-wide blanket pass claim.
- **AC-19** — When a buyer requests the test report for a given SKU, the system shall provide issuing laboratory, report number, test standard, and test date.
- **AC-20** — The system shall publish a「How to verify a test report」section instructing buyers to cross-check the report number with the issuing laboratory.

### 8.5 样品政策（F5）

- **AC-21** — The system shall publish the sample policy: maximum styles per request, sample pricing rule, shipping cost responsibility, and the condition under which the sample fee is credited to the first bulk order.
- **AC-22** — When a buyer submits a sample request, the system shall confirm the request by email within 5 minutes and state the dispatch lead time.
- **AC-23** — The system shall display the sample-fee credit rule on both the sample policy page and the RFQ confirmation message.

### 8.6 合作产线与质控（F8）

- **AC-24** — The system shall publish the sourcing model page stating plainly that the company operates as a trading/sourcing partner rather than a factory owner, and shall describe which production-line specialisation serves which product line.
- **AC-25** — The system shall not display any factory-ownership claim, workshop square-metre figure, or owned-capacity figure.
- **AC-26** — The system shall publish the inbound quality inspection standard (AQL level, inspection scope, re-inspection policy) for each product line.

### 8.7 快速联系（F6）

- **AC-27** — While the buyer is on any page, the system shall display a persistent contact entry (WhatsApp and email) that is reachable within one tap on mobile viewports.
- **AC-28** — The system shall display a response-time commitment with a timezone coverage table on the contact page.
- **AC-29** — The system shall not display any live-chat or chatbot widget that has no human agent behind it.

### 8.8 性能与兼容（非功能）

- **AC-30** — The system shall render the first contentful paint of any page within 3 seconds on a 4G mobile connection.
- **AC-31** — The system shall serve all pages over HTTPS with a valid certificate.
- **AC-32** — The system shall render correctly on the latest two versions of Chrome, Safari, Firefox, and Edge, and on iOS/Android WeChat, Safari mobile, and Chrome mobile.
- **AC-33** — The system shall provide alt text for all product images and shall lazy-load images below the fold.

### 8.9 内容红线（P0 规则）

- **AC-34** — The system shall not use any emoji character as a functional icon or UI affordance. All icons shall come from a single unified SVG icon library (library selection is an architecture decision, not a product decision).
- **AC-35** — The system shall not use a purple-to-pink gradient as the primary brand visual.
- **AC-36** — The system shall not display any placeholder or filler copy (including "Lorem ipsum", "Welcome to our website", "Sign up today") in any production-facing page or empty state.

### 8.10 真实数据门槛（新增，与设计师 §17 同口径）

- **AC-37** — If verified source data for a quantitative claim (SKU count, MOQ, price, lead time, country count, response time, workshop count) is not available, then the system shall render the approved structural fallback wording from §6.2 and shall not render a numeral, a placeholder token, or an empty slot.
- **AC-38** — If no third-party test report exists for a SKU, then the system shall render the compliance field as "On request — provided with your quotation" and shall not render any report number, issuing laboratory, or pass/fail verdict.
- **AC-39** — If a SKU-level compliance value is displayed, then the system shall display it together with the test standard, the issuing laboratory, the report number and the test date; a bare "pass" or "compliant" label without these four attributes shall not be rendered.
- **AC-40** — Where a product is an ear post or other pierced article, the system shall display the 0.2 µg/cm²/week nickel release limit, not the 0.5 µg/cm²/week limit applicable to prolonged skin contact.
- **AC-41** — The system shall not render any certification claim word (including "Certified", "Approved", "Tested", "Compliant"), any certificate image, any badge wall, or any laboratory logo while no corresponding test report exists for the referenced SKU or site-wide. Permitted alternatives are commitment wording ("Test reports issued per batch, provided with your quotation") and educational wording describing the standard itself.
- **AC-42** — The system shall render the home page trust band with five items that make no claim of held certification; where a report-dependent item is removed, the system shall replace it with a non-report-dependent commitment (e.g. "Spec sheet included with every quote") rather than leaving the slot empty or reducing the band to fewer items.

---

## 9. 边界条件

| 场景 | 处理要求 |
|---|---|
| **空状态** | 分类页无结果、RFQ 篮为空、Blog 无文章 —— 均须有实体文案的空状态（引导动作，非占位符），见 AC-04 / AC-13 / AC-36 |
| **规格缺失** | 七项字段任一缺失 → 显示「On request — ask with your RFQ」，禁止留空或填占位值（AC-06） |
| **错误状态** | RFQ 提交失败 → 保留篮内容 + 给出可用替代联系方式（AC-16）；表单字段校验错误 → 字段级内联提示，不清空已填内容 |
| **加载状态** | 图片懒加载 + 骨架屏；分类筛选结果异步加载时显示骨架，禁止白屏 |
| **边界值** | 数量档输入：允许 1-999999；MOQ 以下数量允许提交但提示「低于 MOQ，需确认」；样品申请款式数上限 5，超出提示 |
| **并发** | 同一访客多标签页操作 RFQ 篮 → 以最后一次提交为准，不做跨标签实时同步 |
| **离线** | 无网状态下 RFQ 篮不丢失（本地持久化 7 天）；提交时检测网络，失败明确提示 |
| **权限拒绝** | 无登录体系 → 不适用；图片/文件下载（检测报告 PDF）无需登录即可访问公开摘要，完整报告经 RFQ 提供 |
| **时区** | 询盘提交时间一律记录 UTC，展示时附带买家所在时区；响应承诺按「8 business hours（中国工作日 09:00-18:00 CST）」表述并附时区对照表 |
| **超长内容** | 产品名称 ≤ 80 字符截断加省略号；规格表字段值换行不截断；检测报告编号完整显示不截断 |
| **图片缺失** | 产品主图缺失 → 显示统一占位图（含产品线色块 + 文字标识），**不使用 emoji** |

---

## 10. 非功能需求

| 类别 | 要求 | 优先级 |
|---|---|---|
| **性能** | 首屏 FCP < 3s（4G 移动）；API p95 < 500ms；产品列表页 LCP < 2.5s | P0 |
| **可用性** | 静态化部署，无单点故障；RFQ 邮件通道失败时自动切备用通道；CDN 加速全球访问 | P0 |
| **安全** | 全站 HTTPS；RFQ 表单输入校验 + 速率限制（同 IP 每分钟 ≤ 3 次提交）；防垃圾询盘（基础 honeypot）；不采集隐私数据 | P0 |
| **兼容性** | Chrome/Safari/Firefox/Edge 最新两版；iOS/Android 微信最新版；移动优先（买家大量用手机初筛） | P0 |
| **SEO** | 语义化 URL、meta、Product + Organization 结构化数据、sitemap.xml、robots.txt、图片 alt 与文件名关键词化 | P0 |
| **可访问性** | WCAG 2.1 AA 基本合规（键盘可达 + 对比度 ≥ 4.5:1 + 图标有 aria-label） | P2 |
| **国际化** | URL 与内容结构预留 i18n（全站 `jewelry` 美式拼写，不混用 `jewellery`）；**前台 locale 只英文、后台 admin UI locale 为中文，两者解耦**（§6.5）；中文字体只在 `/admin` 加载，不得进前台 bundle | P0（概念分离）/ P1（多语言内容） |
| **内容合规** | 禁止 emoji 作功能图标（统一 SVG 图标库，库选型由架构师锁定）；禁止紫色→粉色渐变主视觉；禁止 AI 模板味占位文案 | **P0（团队级红线）** |
| **数据埋点** | 见第 11 节 | P1 |

---

## 11. 数据埋点方案

### 11.1 必埋事件

| 事件类别 | 事件名 | 触发时机 | 关键属性 |
|---|---|---|---|
| 获客 | `page_view` | 任意页面加载 | `page_type`, `product_line`, `referrer`, `market_hint`(IP 国家) |
| 获客 | `rfq_started` | 首次加入询价篮 | `sku`, `product_line` |
| 激活 | `rfq_submitted` | RFQ 提交成功 | `sku_count`, `total_qty_band`, `destination_market`, `has_company_name` |
| 激活 | `sample_requested` | 样品申请提交 | `style_count`, `destination_market` |
| 激活 | `contact_clicked` | 点击 WhatsApp / 邮箱 | `channel`, `page_type` |
| 留存 | `session_start` | 会话开始 | `device`, `version`, `landing_page` |
| 留存 | `catalog_viewed` | 进入分类页 | `product_line`, `filters_applied` |
| 转化 | `spec_field_viewed` | 展开规格表 / 查看检测报告 | `sku`, `field_name` |
| 转化 | `compliance_page_viewed` | 进入合规页 | `entry_source` |
| 异常 | `error_occurred` | 前端 JS 错误 / API 错误 / 表单校验失败 | `error_type`, `page_type` |

### 11.2 实现要求

- 前端轻量封装 `trackEvent(event, props)`，底层可接 Umami / Plausible / Mixpanel（**由架构师选型**），不绑定具体 SDK
- 事件命名规范：`{对象}_{动作}`（如 `rfq_submitted`、`sample_requested`）
- 每个事件自动附带：`timestamp`(UTC)、`session_id`、`device`、`page_url`、`site_version`
- **不采集隐私数据**：不上报 IP 明文（只上报国家粒度）、不存 RFQ 表单原始输入内容，只存结构化字段（数量档、目标市场）
- Cookie 合规：若面向欧盟流量，分析脚本需符合 GDPR 免同意或轻量同意要求（**架构师确认方案**）

### 11.3 北极星指标

**月度有效 RFQ 数**（有效 = 含目标市场 + 预估数量 + 企业邮箱）。次指标：样品申请转化率、询盘首响时长。

---

## 12. 站内内容策略（SEO 关键词方向）

### 12.1 关键词公式

> **材质/品类 + 修饰词（意图层）+ 过滤词（地缘/牌号/认证/MOQ）= 完整 B2B 长尾词**

- **Tier 1 修饰词（最高意图）**：manufacturer / factory / wholesale supplier / wholesale price / bulk order / OEM / custom manufacturing
- **Tier 2**：wholesale / supplier / sourcing / private label / MOQ / B2B
- **Tier 3**：catalog / price list / sample order / export
- **过滤词**：China、316L、surgical steel、certified、REACH、EN 1811、nickel free、PVD gold、low MOQ

> **拼写规则**：全站统一美式拼写 `jewelry`。全球 B2B 采购以美式拼写搜索为主，英式 `jewellery` 会漏掉大部分需求。

### 12.2 分产品线关键词方向

**产品线 ①：时尚合金 / 铜饰**
```
wholesale fashion alloy jewelry supplier China
brass statement necklace manufacturer low MOQ
chunky gold plated brass earrings bulk order
custom alloy jewelry OEM for boutique brands
gold tone alloy jewelry supplier Middle East
heavy gold PVD alloy jewelry 0.5 micron supplier
wholesale costume jewelry mixed sets 12 pcs
```
主攻意图：中东厚金需求 + 买手店混款小批量。

**产品线 ②：不锈钢 / 钛钢**
```
316L stainless steel jewelry manufacturer China
wholesale stainless steel jewelry supplier low MOQ
PVD gold plated stainless steel chain bulk order
waterproof non tarnish stainless steel jewelry wholesale
titanium steel ring manufacturer OEM private label
hypoallergenic stainless steel earrings wholesale supplier
EN 1811 nickel release compliant jewelry supplier
stainless steel jewelry supplier for Amazon sellers
316L vs 304 stainless steel jewelry what buyers should know   ← Blog
```
主攻意图：合规驱动（欧美）+ 防水驱动（东南亚）+ 亚马逊卖家。

**产品线 ③：天然石 / 人造宝石 / 珍珠**
```
natural gemstone bead jewelry manufacturer China
wholesale freshwater pearl jewelry supplier
natural stone pendant wholesale bulk
lab created gemstone jewelry OEM supplier
birthstone jewelry wholesale supplier private label
semi precious stone bracelet wholesale low MOQ
natural stone vs lab created gemstone for wholesale buyers     ← Blog
```
主攻意图：日韩澳洲精致款 + 买手店独特性 + 品牌贴牌。

**合规/信任类（低竞争、高意图，最高优先级）**
```
REACH compliant costume jewelry supplier
nickel free jewelry manufacturer EN 1811 test report
California Prop 65 compliant fashion jewelry supplier
SGS tested alloy jewelry supplier China
how to verify jewelry plating thickness                        ← Blog
gold plated vs PVD jewelry which lasts longer                  ← Blog
```

**交易条件类（拦截决策末端流量）**
```
jewelry supplier sample policy wholesale
wholesale jewelry MOQ 50 pieces mixed styles
FOB Shenzhen jewelry wholesale price list
DDP shipping jewelry supplier USA
what MOQ should I expect from a Chinese jewelry supplier       ← Blog
```

### 12.3 URL 与页面结构建议

```
/                                          首页（品牌词 + OEM/制造商定位）
/product-lines/fashion-alloy-brass/
/product-lines/stainless-titanium-steel/
/product-lines/natural-stone-gemstone-pearl/
/products/{sku-slug}/                      产品详情（承接材质+工艺词）
/compliance/                               合规与检测中心
/compliance/nickel-release-en-1811/        子专题
/sourcing-partners/                        合作产线与质控（替代"工厂实力"页）
/samples/                                  样品政策
/shipping-payment/                         物流与付款条款
/faq/
/markets/middle-east/                      P1
/markets/europe-uk/                        P1
/blog/                                     采购指南内容中心
```

### 12.4 内容排期建议

| 阶段 | 内容 | 目标 |
|---|---|---|
| V1 上线（6 篇种子） | ① EN 12472 与镀层磨损测试说明 ② 如何核验第三方检测报告 ③ 316L vs 304 买家须知 ④ 镀金 vs PVD 哪个更耐久 ⑤ 中国饰品供应商 MOQ 预期指南 ⑥ 中东买家为什么要求 0.5μm 厚金 | 承接合规类低竞争词，建立专业度 |
| V1.1（+6 篇） | 天然石分级、珍珠分级、HS 编码与清关、FOB/CIF/DDP 选择、亚马逊卖家合规清单、买手店混款采购指南 | 扩展至交易条件与品类知识 |
| 持续 | 每季新品线 + 每季市场趋势 | 复购与订阅留存 |

---

## 13. 文案基调与示例（避免 AI 模板味）

### 13.1 首屏（Hero）

> **Three product lines. Verified specs on every SKU.**
> Fashion alloy & brass · Stainless & titanium steel · Natural stone, lab gemstone & pearl
> We are a sourcing partner, not a factory owner. Here is exactly how we control quality instead.

### 13.2 信任条（Trust strip）

> - Spec sheet included with every quote — material grade, plating thickness, MOQ, lead time
> - Test reports issued per batch, provided with your quotation
> - Samples before bulk, sample fee credited to your first order
> - Quoted by a person, not a bot

注：原稿的 `First response within 8 business hours` 属未确认数字，按 §6.2 降级为 `Quoted by a person, not a bot`；客户确认可承诺的具体时长后，再换回带数字的表述。

### 13.3 规格字段示例（产品页）

> - Base material: 316L stainless steel
> - Plating: PVD, 18K gold tone, 0.30 µm
> - Dimensions: chain 45 + 5 cm, pendant 18 × 12 mm
> - Weight: 5.2 g
> - MOQ: 30 pcs per style (mixed sizes allowed)
> - Tiered price: 30-99 → USD 3.80-4.60 / 100-499 → USD 3.20-3.80 / 500+ → on request
> - Compliance: `On request — provided with your quotation`
> - On request — ask with your RFQ （规格缺失时的固定表述）

**重要**：客户目前暂无现成检测报告（§6.2.1）。因此 V1 的 Compliance 字段**一律渲染降级文案**，**不得出现** `EN 1811 ... 0.11 µg/cm²/week · Report SGS-2026-XXXXX` 这类带具体数值和编号的示例（AC-38 / AC-41）。带报告编号的写法是**客户补做检测之后**（见 §5.5）才启用的未来态，不是 V1 态。

### 13.4 首页 Trust Band 五项（报告依赖项的替代表述）

原设计中的 `REACH & CPSC REPORTS` 一项**必须替换**（不能删了留空，AC-42）。替换后的五项：

| # | 标签 | 说明文案 | 是否依赖报告 |
|---|---|---|---|
| 1 | `MOQ 12-120` | `Stated per style, not per order` | 否（客户已确认真实数据） |
| 2 | `SAMPLES FIRST` | `Sample before bulk, fee credited to your first order` | 否 |
| 3 | **`SPEC SHEET WITH EVERY QUOTE`** | **`Material grade, plating thickness and lead time, in writing`** | **否 —— 这就是替换项** |
| 4 | `WORLDWIDE SHIPPING` | `Ships worldwide`（覆盖国家数未确认，走 §6.2 降级） | 否 |
| 5 | `QUOTED BY A PERSON` | `No bot replies, no template quotes`（响应时长未确认，走 §6.2 降级） | 否 |

替换理由：`Spec sheet included with every quote` 传达的是**同一类价值**（我们把规格摊开给你），但**不依赖任何已持有的报告**，在客户补做检测前后都成立。

### 13.5 `/compliance/` 页定位（因报告暂缺而调整）

**定位从「我们有资质」改为「我们教你识别」。** 页面必须包含一段明示当前状态的诚实开场：

> **What we can and cannot show you today**
> We do not keep a library of finished test reports on this site. What we do is send every batch for testing and hand you the report with your quotation — linked to the exact alloy, plating and batch you are buying.
> Until then, here is how to read a report, and the three questions that separate a real one from a bought one.

页面正文仍按 §5.4 全量覆盖 REACH / EN 1811 / EN 12472 / CPSIA / Prop 65 / ASTM / HS 编码，但**通篇口气是教育 + 承诺**，不出现任何 `Certified / Approved / Tested / Compliant` 断言（AC-41）。

这个调整不是妥协，是**加强**：§4.1 已经论证过，买家的不信任已升级到「报告能不能核」。行业里假报告 400 元可买，**教买家识别真伪，比自证更有说服力，也是我们当下唯一诚实且可防御的立场**。

### 13.6 样品政策示例

> Order up to 5 sample styles at wholesale price plus shipping. The sample fee is credited in full to your first bulk order of USD 500 or more. Samples dispatch within 3 business days.

### 13.7 RFQ 引导示例

> Tell us your destination market and we will quote to the compliance standard that market requires — REACH and EN 1811 for the EU, CPSIA and Prop 65 for the US.

### 13.8 禁用清单

- 禁用：`Welcome to our website`、`Lorem ipsum`、`Sign up today`、`Your trusted partner`（无实证的形容词）、`Best quality`、`Factory direct`（客户无工厂）
- **禁用资质暗示词（客户暂无报告，AC-41）**：`Certified` / `Approved` / `Tested` / `Compliant` / 徽章墙 / 证书图 / 实验室 logo。允许的是**承诺式**（`Test reports issued per batch, provided with your quotation`）与**教育式**（讲标准、教核验）
- 禁用 emoji 作图标
- 禁用紫色→粉色渐变
- 禁用任何未经客户确认的具体数字（§6.2 / AC-37）：SKU 精确数、阶梯价、交期、响应时长、覆盖国家数、产线数量

---

## 14. 关键结论速览

| 结论 | 内容 |
|---|---|
| **市场空白点** | 所有竞品在「SKU 数量+价格+MOQ」维度内卷，**无人把「镀层厚度/基材牌号/镍释放/可核验报告编号」做成产品页标准字段**。行业已被媒体曝光（17/21 件镀层不达标、镉超标 9000 倍、400 元可买假报告），买家不信任已从「有没有报告」升级到「报告能不能核」 |
| **差异化** | Spec-First Sourcing：规格字段强制化 + 身份诚实化（无工厂但公开合作产线与 AQL 验货）+ 风险逆转（样品费抵首单、8 小时响应承诺） |
| **产品线→市场** | 合金/铜饰→中东+拉美+非洲；不锈钢/钛钢→欧美+东南亚；天然石/珍珠→日韩澳洲+欧美买手店 |
| **区域页** | V1 只做 2 个（中东、欧盟/英国），其余用 Blog 长尾覆盖；V1 站点只做英文（统一 `jewelry` 拼写） |
| **合规必写** | REACH 镍释放 0.5/0.2 µg/cm²/week、EN 1811、EN 12472、Pb≤0.05%、Cd≤0.01%、CPSIA 100ppm、CA Prop 65、ASTM F2999/F2923、HS 7117.19.55 |
| **转化关键** | 询盘首响 ≤ 8 小时（48h 未回复转化率跌破 5%）；MOQ 必须按款标注；阶梯价必须可见；样品费可抵首单 |
| **ARPU 参考** | 平台侧数据：Alibaba 珠宝类目平均订单 $1,200-5,000；JewelMaze 类高端平台平均客单价 >$3,500；本项目 V1 目标首单区间 $500-3,000（试单为主），复购目标 $2,000-10,000 |
| **转化率基准** | 外贸 B2B 询盘→订单行业平均 2%-15%（口径不同），优质供应商可达 22%；本项目 V1 目标：有效 RFQ ≥30 条/月，样品申请转化 ≥15% |
| **MVP** | P0 全部（F1-F11 + F3-a）+ Blog 框架与 6 篇种子文章。**不做支付、不做库存、不做登录、不做多语言全站、不做货币切换、不做清单导出** |
| **客户已确认（2026-10-01）** | ① 有几百款可商用实拍图（需按 §6.4 做可用图筛选）② **暂无检测报告，后续可做** → V1 全站报告走降级，定位改为「教你识别」，Trust Band 换 `Spec sheet with every quote` ③ SKU 数百款、**MOQ 按款 12-120 件** → MOQ 区间过滤为硬要求（AC-02a）④ **后台中文、前台英文** → 两个 locale 概念分离（§6.5） |
