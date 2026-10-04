# 饰品 B2B 外贸全球官网 — UI/UX 设计方向文档

> 阶段：Phase 1 设计调研与设计方向
> 负责人：颜好看（UI/UX Designer）
> 日期：2026-10-01
> 依据：用户需求三句话（全球市场 / 三大产品线分层 / 纯贸易公司无自有工厂）
> 配套产出：`docs/design-tokens.json`（Token 草案）
> **已与 PM 的 `docs/PRD.md` 对齐**（路由 / 英文站结论 / Ship-to 选择器 / 页面拆分），对齐表见附录 B

---

## 0. 元信息与三轴刻度

### 0.1 三轴设计刻度（本项目标定值）

| 维度 | 取值 | 说明 |
|---|---|---|
| `DESIGN_VARIANCE` | **6** | 允许非对称 Hero、混合长宽比网格、`2fr 1fr 1fr` 分数单位；但底层仍守 12 列网格。<768px 全部回退单列。 |
| `MOTION_INTENSITY` | **3** | 仅 hover/active/selected 反馈 + 抽屉/下拉位移。无滚动叙事编排、无持续脉冲、无轮播自动播放。 |
| `VISUAL_DENSITY` | **分层** | 品牌层页面（首页 / 产品线 Landing / About）= **3**；目录层页面（Catalog / PDP / RFQ）= **7**。密度随寄存器切换，不全局统一。 |

### 0.2 寄存器判定（本项目是混合寄存器，按页面分层）

这是本项目最重要的结构性判断：

| 页面层 | 寄存器 | 设计标杆 | 密度 | 图片策略 |
|---|---|---|---|---|
| 首页 / 三大产品线 Landing / About / Resources | **Brand（画册）** | Mejuri / Monica Vinader / Missoma 的节制感 | VISUAL_DENSITY 3 | 大图必须存在，零图片是 bug |
| Catalog / 搜索 / PDP / RFQ / Compliance / Policies | **Product（目录）** | Laravel/Nova 后台的精确感 + Faire 的策展感 | VISUAL_DENSITY 7 | 以数据表、规格、SKU 替代照片叙事 |

**同一站点内两套寄存器共存，靠一处刻意的「密度落差」衔接**：从首页进入 Catalog 时，容器从 `--container-wide`(1440px) 收到 `--container-max`(1280px)，节区间距从 80px 收到 32px，字号基准从 16px 收到 14px。用户感知到的是"从画册走进了档案室"，这是刻意设计的信息层级落差，不是风格漂移。

---

## 1. 设计调研：对标与结论

### 1.1 DTC 高端饰品品牌（视觉标杆层）

调研对象：**Mejuri（多伦多，2013）／Missoma（伦敦，2008）／Monica Vinader（伦敦，2008）**

| 品牌 | 分解结论 | 可迁移的部分 | 不可迁移的部分 |
|---|---|---|---|
| **Mejuri** | "日常可佩戴的细金饰"定位。极简产品词汇（细素圈、简单几何、吊坠小坠片），50+ photos 走日常佩戴场景而非奢华影棚。 | 「整套产品词汇保持一致，靠成套叠戴累积意义」→ 映射到本站：**三大产品线各自维持一套稳定的视觉词汇**，不混搭。 | 其 DTC 叙事（为自己买珠宝）是 B2C 语境，批发站不能用。 |
| **Missoma** | Demi-fine 定位；** Editorial 质感的杂志化产品摄影 胜过纯白底产品图 **；按材质/风格/情绪多维度筛选。 | 「按材质过滤」是饰品站的核心筛选轴（我们有天然优势，三大产品线就是材质分层）。杂志化排版用于 Landing 页，不用于 SKU 列表。 | 名人与联名带来的文化信用，SOHO 贸易公司没有。 |
| **Monica Vinader** | 极简布局 + 大尺寸产品图 + 详细参数说明；**雕刻定制工具直接内嵌在 PDP 上，而不是藏在 Tab 里**。 | 这条最有价值：**B2B 版的"定制入口"就是 RFQ 数量选择器 + 备注区，必须常驻 PDP 首屏，不能藏在"联系我们"里。** | 可持续发展叙事（回收金银）若无第三方背书不可声称。 |

**三条共性（决定我们的视觉底线）：**
1. 三家全部是**浅色底 + 极简布局 + 大量留白**，没有一家用深色主题。
2. 三家全部把**产品图放大到接近全宽**，文字退到次要层级。
3. 三家全部提供**多维度筛选**（材质 / 价格 / 风格），而不是让用户在瀑布流里翻。

### 1.2 B2B 批发与批发平台（信息效率标杆层）

调研对象：**NihaoJewelry（800K+ SKU，NO MOQ）／Alibaba 饰品类目／Faire（~100,000 品牌）／FashionGo（1,200+ 品牌，420,000 零售商）**

| 平台 | 分解结论 |
|---|---|
| **NihaoJewelry** | SKU 卡片的信息配方已经是被市场验证的：**产品图 + 长标题（材质+工艺+款式全塞进标题）+ `Min. order: N piece` + `US$ x.xx-y.yy` 区间价 + 评分**。密度极高，卡片几乎无留白。这是我们 SKU 层的下限标准——**低于这个信息量，专业买家会跳出**。 |
| **Faire** | 策展型批发市场（indie / gift / home），杀手锏是 Net 60 账期 + 首单免费退货。**它的页面密度明显低于 Nihao，因为它卖的是"发现感"而不是"找货效率"。** 这正好印证：密度是由商业模式决定的，不是由审美决定的。 |
| **FashionGo** | 趋势驱动 + Style Match+ 视觉搜索 + 实时热销榜。**B2B 平台真正的技术护城河在"找到它"而不是"展示它"**。→ 我们的 Search 必须支持 SKU 精确匹配（这是 professional buyer 的第一搜索方式）。 |
| **行业研究共识（DBS / WizCommerce / B2BWave / dazze.studio, 2026）** | ① **78% 的 B2B 买家在联系供应商前已经明确知道自己要买什么**；② 买家最痛的是"隐藏的 MOQ / 价格 / 交期"；③ **很多批发买家偏好列表视图下单，因为它像电子表格，是肌肉记忆**；④ 制造业 B2B 报价到订单转化率 20-35%，**响应速度是最大变量，35-50% 的单子给了最先回复的那家**；⑤ 80% 的 B2B 买家会用手机做采购调研。 |

**B2B 研究里最重要的一句话（直接决定我们的设计取向）：**
> "很多 B2B 站点把简化版的 B2C 模型照搬过来，把专业买家当成随便逛逛的消费者。" —— DBS Interactive《5 Key Design Strategies for B2B E-Commerce Websites》

**结论：批发站的设计缺陷不是"不够美"，而是"像个消费品站"。**

### 1.3 核心视觉判断：像「高级画册」还是像「高效目录」？

**我的判断：都不。要做「编辑感的目录」(Editorial Catalog) —— 目录的骨架，画册的皮肤；并且寄存器按页面分层切换。**

理由分三层：

**第一层：由买家的任务决定，不是由美学决定。**
78% 的买家进站时已经知道自己要什么。他要完成的是**确认规格 → 确认 MOQ → 确认阶梯价 → 凑单询价**这条链路，不是一个被品牌故事感动的过程。任何让他在 SKU 层多点一次、多滚一屏的设计，都是直接从转化率里扣的钱。所以 **SKU 层的骨架必须是目录**：表头、规格表、等宽数字、列表视图、可批量勾选。

**第二层：但纯目录会输掉「可信度」。**
客户是**无自有工厂的贸易公司/SOHO**。这是本次设计要解决的真实商业问题：他没有车间实拍、没有产线视频、没有 ISO 工厂认证。如果站做成纯目录的样子（密集网格 + 白底 + 参数），买家 3 秒内就会判定为"又一个倒货的中间商"，然后关掉。**缺少"信任"这一层，目录的效率再高也没人用。**
所以美术层面的"画册感"不是装饰，是**唯一的信任补偿机制**：统一质感的产品摄影、克制的配色、真正的负空间、像样的排版。这和 Mejuri/Monica Vinader 用 editorial 摄影建立溢价感的逻辑完全一致——**画册感是给"是否可信"这个问题提供答案的**。

**第三层：为什么不能反过来（用画册做 SKU 层）？**
行业数据已经给出答案：B2B 买家对自己的 catalog 期待明确包含 pack size、MOQ、availability、lead time、certification 五类信息，缺一类就等于"让他打电话来问"，而打电话这件事在跨境语境下会直接流失。画册式的大留白会把这五类信息挤出去。

**落地执行口径（给前端的具体指令）：**

| 判断 | 执行方式 |
|---|---|
| 骨架 = 目录 | SKU 层必须有：SKU 号、材质、电镀工艺、尺寸、MOQ、阶梯价、现货状态。行分隔用 1px `--border-soft`，**不用卡片盒子**。 |
| 皮肤 = 画册 | 图片必须统一抠/拍规范（见 §6），配色低饱和（见 §3），排版有完整层级（见 §4），节区间距 80px（Brand 层）。 |
| 不做画册式 SKU | 禁止：全屏产品图占 60% 以上再往下才是规格、隐藏阶梯价、隐藏 MOQ、"Login to see price"。 |
| 不做纯-wireframe 目录 | 禁止：无 Tokens 的裸 HTML 表格观感、系统默认字体、灰 `#808080` 直接用在标题上。 |

---

## 2. 设计语言定义

### 2.1 五个关键词

**精确 (Precise) · 抛光 (Polished) · 归档 (Filed) · 克制 (Restrained) · 克制之外——有货 (Stocked)**

三个作为品牌声音的**物理对象词**（不是"现代/优雅"这种空词）：
> **像一份 1970 年代的工业品供应目录**、**像珠宝托盘上的墨绿绒布**、**像报关单上的等宽数字**。

这三个物理对象直接推导出了本项目的字体、配色、密度三件事。

### 2.2 反义词（明确我们不是什么）

- 不是「生活方式品牌」→ 不用 dawn-filter 的网红沙滩场景图
- 不是「奢侈品珠寶行」→ 不用高对比 Playfair 衬线 + 全大写疏排 + 金色描边
- 不是「1688 式批发站」→ 不用三列同尺寸卡片 + 红黄促销标 + 无 Token 的紧凑堆砌
- 不是「AI 生成的 SaaS 官网」→ 无 Indigo→Pink 渐变、无毛玻璃卡片、无发光边框

### 2.3 无工厂叙事的视觉替代方案（客户特有约束）

客户无自有工厂、无产线实拍（PRD Out-of-Scope 第 3 条）。视觉信任改由这四件事承担：

| 信任来源 | 视觉载体 | 出现位置 | 数据状态 |
|---|---|---|---|
| **货盘规模** | 同批次 8–12 SKU 平铺实拍网格图（一张图证明手上有货） | 首页 §12[6]、三条产品线 Landing | **[已解锁]** 客户有几百款可商用实拍图 |
| **规格准确性** | PDP 的 definition-list 规格表（八项最小集）+ 等宽字 SKU | PDP | 逐款填写，不依赖整体数据 |
| **响应确定性** | `Quoted by a person, not a bot` + 真实在线时间（时区串待确认） | Utility bar、PDP、RFQ | [待确认] 可承诺时长未定 |
| **合规可验证** | `/compliance/` + `/compliance/nickel-release-en-1811/` + PDP 合规行 + 首页 §12[9] | 全站 | [待确认] **当前零报告**，走 AC-38 降级 |

> **真实性约束（红线，不随数据到位而松动）**：
> - 所有含数字的文案，要么是**客户已确认的量级 / 区间**（`Hundreds of styles`、`MOQ 12-120 pcs, stated per style`），要么必须是 PRD §6.2 降级对照表的左列表述。二者之外一律不写。
> - **禁止**把量级改写成精确数字（`Hundreds of styles` → `1,240 SKUs`），**禁止**把区间压缩成单点值（`MOQ 12-120 pcs` → `MOQ from 12 pcs`）。客户给的是量级与区间，写死即虚标。
> - 宁可删掉一项，不可虚标 —— 这是「Spec-First」定位的立身之本。全部待确认项见 §17。

---

## 3. 色彩方案

### 3.1 判断：主色应该是克制的深色还是干净的浅色？

**答案：都不是"主色" —— 面积主色必须是「干净的冷调浅中性色」，身份色是「一抹克制的深墨玉绿」，CTA 强调色是「一抹氧化黄铜」。**

三段式回答：

**(1) 舞台必须是干净的冷调浅色，不是暖白/米白。**
金属色（金 / 银 / 玫瑰金）本身就是高亮度、带相的高光；天然石要同时容纳紫晶、青金、绿松、粉晶、虎睛等全色相。**任何带明显色相倾向的背景都会和商品的色相打架，并系统性扭曲买家对颜色的判断——在饰品外贸里这等于批量退货。**
所以选**冷调 off-white**：`#F7F8F9`（OKLCH 约 L 0.98 / C < 0.004 / hue ≈ 250）。刻意**不用**米色/奶油色系（`OKLCH L 0.84–0.97, C<0.06, hue 40–100`）——那条色带已经被默认成"AI 站保底背景"，且会和金属暖调冲突。温暖感交给商品本身和黄铜强调色去传达，不由背景传达。

**(2) 身份色用一抹很暗、很低饱和的深墨玉绿 `#123A38`。**
实物依据：**珠宝实体展陈的标准托盘就是墨绿绒布（jeweller's baize）和炭灰绒布**——墨绿能让金银同时显色，这是物理行业的百年惯例，不是当季流行。这条色被选中，因为它有**实物依托**，所以有十年寿命。
同时它刻意避开 `#6366F1` 靛色（业界公认的 AI 首罪）、避开纯黑 `#000`（廉价）、避开任何 Indigo→Pink 渐变组合。

**(3) 明确的「不做全站深色」判断。**
三条理由：
- 800+ SKU 的产品图多半是浅底同质化管理。**深色全站会让每张图都需要重新去背或加边框**，后期成本成倍增加——SOHO 团队扛不住。
- "深色 + 发光边框 + 毛玻璃"三位一体是 AI 模板红线，必须避开。
- 采购行为发生在白天办公室 / 手机户外，**浅底在低端安卓屏和强光下的可读性显著更稳**。

**但保留一个"暗面"**：给品牌层页面的 Hero / 产品线 Landing 提供 `--surface-inverse: #123A38`，用于承载杂志感大图。这是**分层使用**，不是全局深色。

### 3.2 配色表（A1 / A2 / B-slot / C-extension）

#### A1 — Identity

| Token | Hex | 角色 |
|---|---|---|
| `--bg` | `#F7F8F9` | 页面背景（冷调 off-white） |
| `--surface` | `#FFFFFF` | 卡片 / 表格 / 抽屉背景 |
| `--surface-inverse` | `#123A38` | 暗面：Hero / Footer / 产品线 Landing Hero |
| `--fg` | `#14181C` | 主文本（深墨蓝炭，**不用纯黑**） |
| `--fg-inverse` | `#F4F6F5` | 暗面上的主文本（不用纯白） |
| `--muted` | `#5B6470` | 次级文本 / 规格标签 |
| `--border` | `#E3E6EA` | 默认边框 / 分隔线 |
| `--accent` | `#123A38` | 品牌身份色（深墨玉绿） |
| `--accent-metal` | `#7D6330` | CTA 强调色（氧化黄铜 / Antique Brass） |

#### A2 — Semantic / Structure

| Token | Hex | 角色 | 白底对比度 |
|---|---|---|---|
| `--accent-hover` | `#0C2B29` | 身份色 hover | — |
| `--accent-active` | `#081E1D` | 身份色按下 | — |
| `--accent-metal-hover` | `#6A5327` | 黄铜 hover | — |
| `--accent-on` | `#FFFFFF` | 身份色上的前景 | 12.5:1 |
| `--metal-on` | `#FFFFFF` | 黄铜上的前景 | 5.7:1 |
| `--success` | `#1A6B4F` | 现货 / 已完成 | 5.4:1 |
| `--warn` | `#8A5A00` | 交期紧张 / 最低起订警告 | 4.9:1 |
| `--danger` | `#B42318` | 校验失败 / 缺货 | 5.9:1 |
| `--info` | `#1D4E6B` | 提示 / 说明 | 6.4:1 |
| `--focus-ring` | `#7D6330` @ 3px 40% | 键盘焦点环（黄铜，和 CTA 同色让焦点=行动语义统一） | — |

#### B-slot — 语义别名

| Token | 指向 | 用途 |
|---|---|---|
| `--fg-2` | `var(--fg)` @ 0.72 alpha 视觉等价 → 实际 `#3A4149` | 次标题 |
| `--surface-warm` | `#FBFCFC` | 产品图统一底色（比 surface 略暗一点，**刻意不用纯白**，避免浅色金属/银饰边缘丢失） |
| `--surface-sunken` | `#F0F2F3` | 表格斑马纹 / 代码块 / 二级容器 |
| `--meta` | `#79828E` | 三级前景 / 时间戳 / SKU 前的辅助 |
| `--border-soft` | `#EEF0F2` | 表格行内分隔（比 border 更轻） |
| `--border-inverse` | `#1F4A47` | 暗面上的边框 |

#### C-extension — 三大产品线专属色（本项目特有）

产品线色**只用于 Landing 页的材质识别带和 tagging**，绝不用于按钮或标题。

| Token | Hex | 产品线 |
|---|---|---|
| `--line-alloy` | `#6E6555` | 时尚合金 / 铜饰（暗黄铜灰） |
| `--line-steel` | `#4A5A63` | 不锈钢 / 钛钢（冷钢蓝灰） |
| `--line-stone` | `#5D5069` | 天然石 / 人造宝石 / 珍珠（暗紫灰） |

三条线都刻意用**低饱和中暗调**，因为线内的缤纷颜色由天然石自己的照片承担，UI 只提供中性的识别锚点。

### 3.3 「每屏 accent 使用 ≤2 处」的执行口径

- `--accent`（墨玉绿）：用于 Header 主导航激活态、**每屏最多 1 个**主 CTA、暗面背景块
- `--accent-metal`（黄铜）：**全局只有两种用法** —— ① RFQ 相关的主行动按钮 / 计数徽标；② 阶梯价表中"当前数量命中的那一档"的高亮。**这是全站唯一的暖色锚点，也是转化链路的视觉主线。**
- `--line-*` 产品线色：**每屏最多出现 3 次（=三条线各一次）**，只在 Landing 页与 tagging 处

### 3.4 为什么这套色能用十年不过时（可复用判据）

1. **色相取自实物，不取自趋势**：墨绿=珠宝绒布；黄铜=金属氧化这层真实存在；冷调白=无色竞争的中性舞台。流行色会死，实物不会。
2. **饱和度低于任何默认调色板**：全部语义色 C 值都很高但 V 值偏暗，不参与"谁更亮"的竞争，因此不会像 2020 年代的亮蓝/亮橙那样过期。
3. **不用纯黑也不用纯白**：`#14181C` / `#F7F8F9` 都有轻微色偏，避开 "#000 廉价、#FFF 刺眼"的两极化。
4. **冷暖分工明确**：底冷（德国式的「客观」）、商业动作暖（黄铜＝"成交"）。这套分工在任何时代都成立。

---

## 4. 字体方案

### 4.1 选型过程（反射检查）

直觉第一反应是"饰品 → 衬线体 → Playfair / Cormorant"。**拒绝**（两者都在训练数据默认值清单里）。第二反应是"编辑排版风 = 展示衬线 + 斜体 + 小型 mono 标签 + 分隔线"。**拒绝**（2026 年已被 AI 工具全量默认，且这里不是真杂志）。
第三反应是"Inter + DM Sans"。**拒绝**（两者均在反射拒绝清单）。

带着三个物理对象词（**70 年代工业品供应目录 / 墨绿绒布 / 报关单等宽数字**）重新找，落点在：

### 4.2 最终锁定（3 字族 + 1 中文）

| 角色 | 字体 | 字重 | 为什么是它 |
|---|---|---|---|
| **Display / 标题** | **Archivo** | 500 / 600 / 700 | 基于 grotesque 骨架但终端是方的、半封闭的字腔，天然就是"工业品目录/展会展位看板"的声音。 Used at ≥32px with `-0.02em` 它读起来像高端 trade fair booth，而不是科技 Landing。不在拒绝清单。覆盖 Latin-Ext（欧洲买家公司名里的 `Ł` `Ø` `Æ` `ß` 全有）。 |
| **Body / UI** | **Public Sans** | 400 / 500 / 600 | 为政府数据界面设计、仍在活跃维护的正文字体，**原生支持 tabular figures**，15px 以下依旧清晰——这是 dense catalog 的硬指标（价格对齐、MOQ 对齐、尺寸对齐全靠它）。绝不会在回答"这是不是准确数据"上拖后腿。不在拒绝清单。 |
| **规格 / 数字 / SKU** | **JetBrains Mono** | 400 / 500 | 只用于 SKU 编码、尺寸数字、MOQ、阶梯价表等数字密集型位置。SKU 如 `SS-E2407-18K` 用等宽后横向可扫读、可复制、不会在表格里跳位。拒绝清单里的是 IBM Plex Mono / Space Mono，JetBrains Mono 不在。 |
| **中文** | **HarmonyOS Sans SC**（首选）/ **Noto Sans SC**（兜底） | 400 / 500 / 700 | 中文优先选择。HarmonyOS Sans 的字面比 Noto Sans SC 开阔，屏幕渲染更现代；兜底 Noto（万一商务授权需要）。 |

**字族数量：2（Display + Body）+ mono（不计数）+ 中文 1。符合"最多 2 种字体配对"规则。**

### 4.3 引入

```css
/* 只对公开(英文)站点加载；Noto/HarmonyOS SC 仅中文 locale 或中文后台加载 */
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&family=Public+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
```

```js
// tailwind.config.js
fontFamily: {
  display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  sans:    ['Public Sans', 'HarmonyOS Sans SC', 'Noto Sans SC', 'ui-sans-serif', 'sans-serif'],
  mono:    ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
},
```

**性能硬要求：**
- `Noto Sans SC` / `HarmonyOS Sans SC` **不在前台英文页面加载**。仅在 zh-* locale 或 `/admin` 动态加载。中文字体全量 ≥1MB，会毁掉 LCP。
- 所有字体 `font-display: swap` + `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
- Public Sans 在价格/规格表上启用 `font-variant-numeric: tabular-nums`

### 4.4 字号阶梯（8 级，非 4px 倍数，按 2px 步进）

| Token | px | line-height | 用途 |
|---|---|---|---|
| `--text-xs` | 12 | 1.45 | Badge、ALL CAPS 微标签（tracking **+0.08em**） |
| `--text-sm` | 14 | 1.5 | SKU 名、表单、SKU 卡片正文（ catalog 默认正文） |
| `--text-base` | 16 | 1.6 | 品牌层页面正文、LP 说明段落 |
| `--text-md` | 18 | 1.55 | Landing 引导段 |
| `--text-lg` | 20 | 1.4 | H4（区块小标题 / Section 标题） |
| `--text-xl` | 24 | 1.3 | H3 |
| `--text-2xl` | 32 | 1.2 | H2 / 产品线标题（tracking -0.015em） |
| `--text-3xl` | 40 | 1.08 | H1 / Hero（tracking **-0.025em**，weight 700） |

**正文最小值 14px**（≥目录层）／**16px**（品牌层）。禁止任何低于 12px 的文字。

### 4.5 字重与字距

- 字重：**400 Read / 500 Emphasize / 600 Subhead / 700 Announce**（变量字体可以到 510/590，这里取 500/600 是因为 Google Fonts 的分档位，偏离标准 510/590 属有据调整）
- ALL CAPS：`letter-spacing: 0.08em`（超过 ≥0.06em 底线，因为我们的 -xs(12px) 更小）
- 标题 ≥32px：`letter-spacing: -0.015em` ～ `-0.025em`
- 正文：`letter-spacing: 0`
- 中英混排：中文字间距 `+0.02em`，英文保持 0；中文行高比英文行高 +0.1 补偿字面高度

---

## 5. 图标系统（全项目锁定一套）

### 5.1 锁定：**Lucide**（lucide.dev）

**选型理由（对比过 Lucide / Phosphor / Tabler / Heroicons 后的决定）：**

| 候选 | 结论 |
|---|---|
| **Lucide（选中）** | 1700+ 图标，**24px 画布 + 2px 描边统一网格**，ISC 许可（可商用可修改无需署名），React/Vue/Svelte/原生均有官方包，tree-shakable，周级维护。**线性 / 无填充 / 几何克制**，和"精密量具"的声音一致。饰品需要的 `gem`、`droplets`（防水）、`shield-check`（合规）、`ruler`、`package`、`layers`、`file-input`（RFQ）全都自带。 |
| Phosphor | 6 档字重很强，但**多重有效表达会让新手 devs 自由发挥** —— 混乱风险高于收益。放弃。 |
| Tabler | 5000+ 最多，但在 16px 时部分图标偏"忙"，不适合 Dense catalog。放弃（保留为缺字时的第二选项）。 |
| Heroicons | 仅 300+，筛选器、材质类图标不足，会被迫混第二套。放弃。 |

**红线：全项目只用 Lucide，禁止混任何其他图标库。缺图标时申请新增，不允许临时引入第二套。**

### 5.2 规范

| 项 | 值 |
|---|---|
| 画布 | 24×24 |
| 默认 strokeWidth | **1.5**（比 Lucide 默认 2 更细，对齐"精密"气质；24px 独立展示时才用 2） |
| 尺寸 | **16px** 行内 / **20px** 按钮内 / **24px** 独立图标（无其他尺寸） |
| 颜色 | 一律 `currentColor`，由父级 text token 决定。**禁止硬编码颜色** |
| linecap / linejoin | `round` / `round`（Lucide 默认值，不改） |
| 无障碍 | 装饰性图标 `aria-hidden="true"` + `focusable="false"`；表意性图标必须带 `<title>` 或父级 `aria-label` |

### 5.3 关键图标映射表（前端照此实现）

| 语义 | Lucide 图标名 | 尺寸 |
|---|---|---|
| RFQ 询价篮 | `file-input` | 20 / 24 |
| 搜索 | `search` | 20 |
| 筛选 | `sliders-horizontal` | 20 |
| 网格视图 / 列表视图 | `layout-grid` / `list` | 20 |
| 产品线：合金铜饰 | `anvil` | 24 |
| 产品线：不锈钢钛钢 | `droplets`（防水不掉色语义） | 24 |
| 产品线：天然石宝石珍珠 | `gem` | 24 |
| MOQ 起订量 | `ruler` | 16 |
| 现货状态 | `check-circle-2` / `circle-dashed` | 16 |
| 合规检测 | `shield-check` | 20 / 24 |
| 物流 | `truck` | 20 |
| 样品政策 | `package-search` | 20 |
| 阶梯价 | `trending-down` | 16 |
| 折叠展开 | `chevron-down` | 16 |
| 关闭 | `x` | 20 |
| 下载报告 | `download` | 16 |
| 删除 RFQ 条目 | `trash-2` | 16 |
| 数量步进 | `plus` / `minus` | 16 |

---

## 6. 产品摄影与图片系统规范（无产线、预算有限前提）

### 6.1 拍摄规范（客户可执行的最低标准）

**器材底线成本 ¥300–600**（桌面的、可复制的）—— 这是适合 SOHO 的真实门槛，不列伪专业设备清单。

| 项 | 规范 |
|---|---|
| **必备设备** | 桌面三脚架（可固定俯拍）、2 盏 5500K LED 面板、白色卡纸/亚克力 sweep、灰卡、**棉手套 + 气吹**（指纹和灰尘是饰品图第一杀手）、手机微距附加镜（¥10-30）+ 手机 Pro/RAW 模式足够 |
| **布光（金属/钛钢必守）** | **双柔光箱左右各 45° + 顶部条灯做 rim 分离**；镜面金属与钛钢类 **必须在扩散账篷/U 型半透明 sweep 内拍** —— 金属镜面会反射整个房间，只要环境中有一条窗户或一件彩色衣服，成品图上就会有色偏和硬反光。把摄影区三面用白板围出、关掉所有环境光（拉幕、关灯、移走彩色物件）。 |
| **相机锁定** | **关掉 Auto**。手动对焦锁定在产品、手动白平衡（灰卡自定义）、ISO 100–400、光圈 f/8–f/11（小饰品需要足够景深，必要时焦点堆叠 3–5 张合成）、**曝光补偿 +0.7～+1 EV**（大片浅背景会骗过测光导致欠曝）。整批档位不换。 |
| **背景** | 首选**无缝 sweep**（白卡纸从墙曲到桌面，不能有接缝线）；**明度中性的浅灰（#EEEEEE 实测值）比纯白更好控曝光**； **禁止使用米色/奶油色铺垫作为背景** —— 会和金属暖调直接打架，也属于 AI 默认审美。纯黑背景 **不使用**（灰尘/指纹致命，且和全站暗面 token 冲突）。 |

### 6.2 每个 SKU 的 4 帧规范（硬性）

| 帧 | 内容 | 长宽比 | 用途 |
|---|---|---|---|
| **A1 主图** | 无缝浅灰 sweep，产品占画幅 **62–70%**，统一视角（推荐 45° 三分视角或正俯视，二者产品线内必须统一） | **1:1** | Grid 卡片、RFQ 缩略图 |
| **A2 补充** | 平铺 / 挂置图，同系列排成一张网格图（8–12 SKU 同框）——**这是无工厂方最有效的"我有货盘"证明** | 4:5 | PDP Gallery、首页 §12.6 Section |
| **A3 比例尺** | 手持 / 标准 cm 卡尺边 + 产品同框。解决 B2B 最大痛点：**没有实物感的尺寸缺失** | 1:1 | PDP Gallery 第 3 帧 |
| **A4 微距细节** | 电镀层、包镶爪、抛光痕、天然石纹理、K 金色泽 | 1:1 | PDP Gallery 第 4 帧 |

**关于模特图与场景图：**
- **模特图**：仅限 3 条产品线 Landing 页的 Hero，每条线 1 张（可商用授权的手部/颈部特写即可）。**SKU 层不需要模特图**，成本不应该花在这里。
- **场景图（lifestyle/beach flat-lay）：明确不做。** 理由：通用的生活方式场景图是"假站/廉价站"的第一识别特征，且大概率侵权或与其他站撞图。这笔预算改投到"同批次实拍网格图"上，回报高一个数量级。

### 6.3 CSS 层的补救手段（无重拍资源时）

| 补救 | 做法 | 注意 |
|---|---|---|
| **尺寸参差 → 视觉整齐** | 图片容器强制 `aspect-ratio: 1/1` + `object-fit: contain` + 统一 `--space-*` padding（推荐 12px） | 比 crop 好：contain 不会切掉耳夹/吊坠这类细长件 |
| **浅色金属边缘丢失** | 图片容器背景用 `--surface-warm: #FBFCFC`（**刻意不用 `--surface: #FFFFFF`**）+ `border: 1px solid var(--border-soft)` | 银/钛钢/白色淡水珠在纯白上会糊边 |
| **批次白平衡不齐** | 极轻微的 `filter: saturate(0.98) contrast(1.02)`，**并且只对整批 >200 张的旧货统一套用一个 class** | **禁止上调饱和度或加锐化** —— 饰品颜色失真 = 客诉 = 退货。这条是设计红线不是美学建议。 |
| **加载性能** | 首屏首图 `fetchpriority="high"`，其余 `loading="lazy"`；WebP/AVIF + 最长边 1200px；LQIP/blurhash 占位（避免图片加载时的布局跳动，守住 CLS） | LCP < 2.5s 是无论手机性能的硬底线 |
| **绝对禁止** | 禁止用 CSS 渐变/发光模拟金属反光；禁止给产品图加 box-shadow 做"漂浮感"；禁止 `mix-blend-mode` 花活 | 这些是 AI 模板味 + 会被专业买家一眼识破 |

### 6.4 交付前图片筛选口径（客户待办，已与 PRD §6.4 对齐）

客户已有几百款可商用实拍图，但**其中符合 §6.1 最低拍摄标准的数量未知**。上线前须由客户按以下口径逐款判定「可用 / 需补拍 / 弃用」：

| 检查项 | 判定标准 | 不通过的处理 |
|---|---|---|
| **主图背景** | 是否去背干净 / 背景是否统一干净 | 背景杂乱但产品清晰的 → 走 §6.3 的 CSS 补救；背景脏且无法修的 → 弃用 |
| **光位一致性** | 同一产品线内是否同一光位、同一色温 | 色温不一致的 → 归到同一批次分组展示，**不要跨批次混排**（会暴露图片来源不一） |
| **撞图 / arbitrage 风险** | 该图是否是从供应商 / 同行处直接拿的公开图（买家反向搜图能搜到别家在用） | **高风险图一律不用**。这直接摧毁「Spec-First」的可信度 —— 客户无工厂，若买家发现图是搬来的，等于坐实「二道贩子且无质控」 |
| **每 SKU 帧数** | 是否满足 §6.2 的 4 帧规范（主图 / 细节 / 佩戴或比例 / 背面或扣件） | 缺帧的 → 标为「需补拍」，优先补齐主推款 |
| **分辨率** | 主图长边是否 ≥1500px（低于此值，Google 图片搜索曝光显著下降） | 不足的 → 弃用或补拍 |

**给客户的交付要求**：筛选后按三分类给出清单，**可用图数量必须覆盖 V1 首页 Hero（3 条线各 3-4 张）+ 三条产品线 Landing + 全部上线 SKU 的主图与细节帧**。若可用图不足以覆盖全部 SKU，**宁可先上线图齐的那一批 SKU，也不要用不合格图凑数**。

> 这条直接支撑 §2.3「信任替代方案」的第一根柱子（货盘规模）。图不齐就少上 SKU，是比凑数更专业的做法 —— 与「Spec-First」定位自洽。

---

## 7. 卡片与列表：千级 SKU 的密度设计

### 7.1 卡片承载字段（三层级，认知负荷受控）

工作记忆规则：一个决策点可见选项 ≤4。所以**卡片上的"核心决策信息"只有 4 项**，其余降维成一组。

**一级（必可见，构成买家决策的 4 项）：**
1. 产品图
2. SKU 编码（JetBrains Mono 14px，`--meta`）
3. **参考价格区间**（tabular-nums，如 `USD 3.80-4.60 / pc`）
   [硬性] **币种写进价格串本身**，不做独立货币切换器（PRD Out-of-Scope 第 12 条）
   [硬性] 价格与 MOQ 合并为**同一视觉单元**，规格见 §7.5
4. **MOQ**（`MOQ 24 pcs`，tabular-nums）

> [已裁决] **价格区间与 MOQ 是 P0 必显字段，不是可选装饰。**
> 依据：PM 调研硬证据 —— 海外批发买家最痛的正是隐藏 MOQ / 价格 / 交期。
> 边界：**精确阶梯价表不上公共页**，只走 RFQ / 报价环节（给议价留空间，客户是贸易公司）。
> 英文限定语以 PM 给的为准：`Reference range — quoted per order`。

**二级（一行 spec strip，视觉上算 1 组，不是 3 项）：**
`304 Stainless · PVD 18K Gold · 8mm` —— 12px `--muted`，用 `·` 分隔，单行，溢出 `text-overflow: ellipsis`。

**三级（按下/列表视图/RFQ 抽屉内才出现）：**
现货状态（`In stock` / `Made to order` / `Low stock`，**必须 icon + 文字，不只靠颜色**）、所属产品线 tagging、认证标记（`shield-check` 表示有 REACH 报告）。

### 7.2 卡片结构（ASCII 草图）

```
┌───────────────────────────────┐
│                               │
│        [A1 主图 1:1]          │  ← 容器 bg: --surface-warm
│                          [+RFQ]  │  ← 右上角：hover 才出现的 RFQ 勾选
│  [In stock]                   │  ← 左上角：状态 pill（可空）
└───────────────────────────────┘
 SS-E2407-18K                      ← mono 12px --meta
 Geometric open ring, minimalist   ← 14px --fg，2 行截断
 304 Steel · PVD 18K · 8mm         ← spec strip 12px --muted 单行
 ───────────────────────────────  ← 1px --border-soft
 USD 0.47-0.59      MOQ 12 pcs      ← tabular-nums / 右对齐 meta
 ┌─────────────────────────────┐
 │  + Add to RFQ               │  ← hover 显示；secondary 描边态
 └─────────────────────────────┘
```

**明确的"不做"：**
- [禁止] 不用 `border-left: 3px solid var(--accent)` 彩色左边框（AI 特征 + 我的红线）
- [禁止] 不用 ≥16px 大圆角（卡片圆角上限 12–16px；本项目取 **6px**，理由见 §9.2）
- [禁止] 不用 ≥16px blur 的大阴影 + 1px 边框同时出现（幽灵卡片）
- [禁止] 不用全站同尺寸卡片无限重复（打破手法见下）

**打破"相同卡片网格"的三种手法（不同时使用，按位置选一）：**
1. **混合长宽比**：New Arrival 位用 4:5 竖版，常规位用 1:1，系列故事位用 16:9（`<768px` 全部回退 1:1）
2. **分数单位网格**：Landing 页用 `grid-template-columns: 2fr 1fr 1fr`，把主推产品线做成一张大卡
3. **横向 Rail 替代无限网格**：`New this week` 用 12 SKU 的横向滚动 rail（左右箭头 + 拖拽），而不是 12 列的瀑布

### 7.3 双视图：Grid（浏览） + List（下单）

行业依据：**多数批发买家偏好列表视图下单因为它像电子表格，是肌肉记忆**（B2BWave 2026 引述的实测）。

| 视图 | 形态 | 默认场景 |
|---|---|---|
| **Grid** | 桌面 4–5 列；用于视觉浏览、发现、选款 | 首次进入 / 移动端唯一视图 |
| **List** | 数据表：缩略图 48px + SKU + 名称 + spec 三列 + MOQ + 阶梯价 + **行内数量输入 + 行内 Add to RFQ**，行高 44–56px，`border-bottom: 1px solid --border-soft` | 桌面端记住偏好（localStorage 记忆），老买家默认 |

切换控件置于工具栏右侧（`layout-grid` / `list` 图标 toggle），移动端隐藏 List 视图。

### 7.4 工具栏与筛选器（千级 SKU 的命脉）

**筛选轴（只做买家真的会用的，不做满）：**
① 产品线（3 项，最高层）② 材质/基材 ③ 电镀工艺 ④ 品类（耳/项/手/戒/饰扣）⑤ 尺寸区间 ⑥ MOQ 区间 ⑦ 现货/可订 ⑧ 有无合规报告

**形式：**桌面左侧常驻 sidebar 筛选（宽 240px，可折叠）+ 顶部 active-filter chips（可单个 ×，可 Clear all）；移动端底部 sticky `[Filters (n)] [Sort]` 按钮 → 全屏筛选 sheet。

**搜索：**必须支持 **SKU 精确匹配**（这是职业买家第一搜索方式），并支持 typo 容错 + "did you mean"。搜索框 placeholder 文案：`Search by SKU, material or style — e.g. SS-E2407`。

### 7.5 价格 + MOQ 组合块的视觉承重（P0 必显字段）

> [已裁决] 列表卡片与 PDP **必须显示该款参考价格区间 + MOQ**。
> 依据：PM 调研硬证据 —— 海外批发买家最痛的正是隐藏 MOQ / 价格 / 交期。
> 边界：**精确阶梯价表不上公共页**，只走 RFQ / 报价环节（给议价留空间，客户是贸易公司）。

#### (1) 为什么价格与 MOQ 必须打包成「一个单元」

买家从来不是分别评估这两个数 —— **低单价配 500 MOQ，与低单价配 24 MOQ，是两个完全不同的采购决策**。
所以两者在视觉上合并为 **1 组**，卡片的一级决策信息仍是 4 项，不触发工作记忆过载。

#### (2) 卡片层视觉规格

| 元素 | 字号 | 字重 | 颜色 | 说明 |
|---|---|---|---|---|
| `USD` 币种前缀 | 16px | 500 | `--fg` | 币种是价格串的一部分，**不弱化** |
| `3.80-4.60` 数字 | 16px | 600 | `--fg` | **tabular-nums**，卡片内最强文本 |
| `/ pc` 单位 | 12px | 400 | `--muted` | 刻意弱化，不与价格抢 |
| 分隔竖线 | 1px × 16px | — | `--border` | 左右各 `--space-3` (12px) |
| `MOQ 24 pcs` | 13px | 500 | `--fg-2` | tabular-nums，次级但**同行** |
| 限定语 | 11px | 400 | `--meta` | `Reference range — quoted per order` |

```
┌───────────────────────────────┐
│        [A1 主图 1:1]     [+RFQ]│
│  [In stock]                   │
└───────────────────────────────┘
 SS-E2407-18K                      ← mono 12px --meta
 Geometric open ring, minimalist   ← 14px --fg，2 行截断
 304 Steel · PVD 18K · 8mm         ← spec strip 12px --muted 单行
 ───────────────────────────────  ← 1px --border-soft
 USD 3.80-4.60 / pc  │  MOQ 24 pcs   ← 价格 + MOQ 组合块（视觉算 1 组）
 Reference range — quoted per order ← 限定语，必须可见
```

- 用 **1px 竖线**分隔价格与 MOQ，**不用卡片级彩色左边框**（红线 #7）
- 价格数字启用 `font-variant-numeric: tabular-nums`，**币种前缀恒为 3 字母 `USD`** → 保证整列小数点纵向严格对齐
- 限定语 11px 是**有据偏离**（§4.4 禁止 <12px 针对正文），因其为价格性质说明、非阅读性文字；**不得再小**

#### (3) List 视图列宽与对齐

| 列 | 宽度 | 对齐 | 说明 |
|---|---|---|---|
| 缩略图 | 48px | — | |
| SKU | 140px | 左 | JetBrains Mono |
| 名称 | flex | 左 | |
| 规格（材质 / 电镀 / 尺寸） | 3 列 | 左 | |
| **MOQ** | 96px | **右** | tabular-nums |
| **参考价格区间** | 152px | **右** | tabular-nums，`USD 3.80-4.60 / pc` |
| 数量输入 | 88px | 右 | |
| Add to RFQ | 自动 | 右 | |

- 价格与 MOQ **右对齐**，与数量输入、按钮形成一条纵向的**行动轴**
- 限定语 `Reference range — quoted per order` **只在表头下方出现一次**（11px `--meta`），不逐行重复 —— 重复会造成视觉噪音并抬高认知负荷

#### (4) PDP 购买面板

```
── Reference Price ─────────────────
  USD 3.80-4.60 / pc         ← 24px Archivo 600 --fg   tabular-nums
  MOQ 24 pcs                 ← 16px Public Sans 500 --fg-2  tabular-nums
  Reference range — quoted per order   ← 12px --meta

  [Request the tiered price table →]   ← 引导进 RFQ；公共页不渲染精确阶梯表
```

- **公共页只到「参考区间」为止**，逐档固定单价不渲染
- 既守住「不隐藏价格」的转化底线，也给客户（贸易公司）留下议价空间

#### (5) 与 PRD AC-07 的口径（[待 team-lead 确认]）

AC-07 要求 PDP 展示**至少 3 档、每档为区间**的阶梯价表。本裁决「不上精确阶梯价表」与 AC-07 **不冲突**——只要每档显示的是**区间**而非固定单价。

| 项 | 口径 |
|---|---|
| PDP 是否出现档位表 | **是**，3 档（对齐 PRD AC-02a 的 `12-30 / 31-60 / 61-120` 或按款实际档位） |
| 每档单价形态 | **区间**（`USD 3.80-4.60 / pc`），**禁止固定单价** |
| 精确阶梯价 | **不渲染**，走 `[Request the tiered price table →]` 进 RFQ |
| 限定语 | 每张价格块旁可见：`Reference range — quoted per order` |

> 我按此口径执行。若 team-lead 判定「PDP 完全不出现档位表」，请回复，我改为单区间版（仅显示 `USD 3.80-4.60 / pc` + MOQ）。

---

## 8. RFQ 询价篮交互（转化核心）

### 8.1 形态判断：三层的「抽屉 + 浮动条 + 行内数量」

**结论：不是购物车页，是「右侧抽屉 + 底部浮动条 + 列表视图行内数量」。**

不做独立 `/cart` 页面的理由：B2B 询价是**采购过程的中断而非终点**，买家会边看边加、加到一半停下来去核实采购经理的意见。任何让他离开当前浏览语境（跳页）的设计都会导致半途流失。做浮动层可以让"加款"和"继续选"在同一个视口内完成。

### 8.2 三层结构

**第 1 层 — 入口（任何页面可见）**
- Header 常驻：`file-input` 图标 + `RFQ` 文字 + **计数徽标（n 个 SKU）**，徽标底色 `--accent-metal`（黄铜），数字 tabular-nums，最大显示 `99+`
- 卡片 hover 时出现 `+ Add to RFQ`（secondary 描边按钮，44px 高）
- 点击后：卡片右上角出现已加入标记，维持 **800ms**（不弹跳）+ 左下角 toast：`Added to RFQ — 12 items minimum` → 附带 `[Open RFQ]` 快捷链接
- 过渡：150ms `--ease-out`；**禁止任何弹跳/回弹缓动**

**第 2 层 — 抽屉（桌面 420px 右侧 slide-in，300ms；移动端全屏 sheet 上滑）**

```
┌─────────────────────────────────────────┐
│ RFQ  ×                                  │  ← 28px, --text-lg, weight 600
│ 12 SKUs · 486 pcs total                 │  ← 12px --meta, tabular-nums
├─────────────────────────────────────────┤
│ [img] SS-E2407-18K                      │
│       Geometric open ring               │
│       MOQ 12          [−] 48 [+]        │  ← 默认填 MOQ，步进 = MOQ 倍数
│       Target price (optional)  $____    │
│       Add note              [chevron-down]    │  ← 折叠：颜色/尺寸/OEM 需求
│                            [trash-2]    │
│ ─────────────────────────────────────── │
│ [img] NS-P1442-AM                       │
│       Amethyst bead bracelet 6mm        │
│       MOQ 30         [−] 30 [+]         │
│ ...                                     │
├─────────────────────────────────────────┤  ← sticky bottom
│  Submit RFQ                             │  ← 主按钮 --accent-metal 满宽 48px
│  Continue browsing                      │  ← ghost
└─────────────────────────────────────────┘
```

- 抽屉打开时：背景 `--overlay: rgba(20,24,28,0.32)`，**纯粹半透明遮罩，不加 blur**（blur = AI 套路 + 高端安卓机掉帧）
- Esc 关闭，点击遮罩关闭，焦点移入抽屉并对首个可聚焦元素自动聚焦，Tab 在抽屉内循环（focus trap）

**第 3 层 — 提交表单（抽屉内第二步，非跳页，300ms step transition）**

字段 ≤7，按 **≤4 项/组** 分三组（认知负荷规则）：

| 组 | 字段 |
|---|---|
| **A. Who**（4 项，全部必填） | Business type（Select: Amazon seller / Boutique buyer / Chain retail / Private label / Other）· Company name · Contact name · Email |
| **B. Where & when**（3 项） | Country/Region（Select）· WhatsApp (optional) · Target delivery date (optional, date picker) |
| **C. Extra**（1 项） | Notes（textarea，placeholder 用真实语境：`e.g. Need custom packaging, FOB Shenzhen, nickel-free required`） |

必须有进度指示（Step 2 of 2）+ 底部 `[Back to list]`。

**提交后：** 不是 "Thank you for your submission"。必须给出**可验证的承诺**：
> `RFQ #RF-2481 received. We reply within 1 business day (Asia/Shanghai). A copy has been sent to your email.`
+ `[Add another line]` `[Download RFQ summary (PDF)]`

### 8.3 空状态与其它 5 态

| 态 | 设计 |
|---|---|
| **Empty** | `file-input` 24px 图标 + 真实文案：`Your RFQ list is empty. Start one of two ways —` + **两个 V1 入口按钮**：`Browse a product line` / `Paste SKU codes`。**粘贴框是老买家高频行为，远优于"去看看产品吧"的空洞引导。**（*`Upload a CSV` 已降 P1，V1 不渲染*） |
| **Loading** | 抽屉内列表用骨架屏（3 行 1:1 缩略图 + 两行文字带），不做全屏 spinner |
| **Error** | 字段级：错误信息紧贴输入框下方（`--danger` 14px），同时输入框 `border-color: --danger` + `aria-invalid="true"`；网络级：抽屉内 inline error block + `[Retry]` |
| **Populated** | 见 §8.2 结构 |
| **Edge** | SKU 数 >99 → 徽标显示 `99+`；单 SKU 数量 >99999 → 输入框拒绝并 toast 提示；已下架 SKU → 抽屉内该行变灰 + `Discontinued` badge + `[Remove]`，不静默删除 |
| **Success** | 见 §8.2 提交后 |

### 8.4 持久化
`localStorage`（key: `rfq_v1`）+ 跨标签页同步；登录后与后台同步（若后期有账号体系）。**未登录也能继续攒 RFQ 是硬要求** —— 强制注册会直接把买家逼走。

---

## 9. Design Token 草案

### 9.1 `design-tokens.json` 结构（完整文件见 `docs/design-tokens.json`）

```jsonc
{
  "$meta": {
    "version": "0.1.0-draft",
    "phase": "Phase 1",
    "owner": "颜好看",
    "axes": { "variance": 6, "motion": 3, "density": "3 (brand) / 7 (catalog)" },
    "locked": { "icons": "Lucide 24px @ strokeWidth 1.5", "fonts": ["Archivo", "Public Sans", "JetBrains Mono", "HarmonyOS Sans SC"] }
  },
  "color": {
    "bg":              { "value": "#F7F8F9", "type": "color", "layer": "A1" },
    "surface":         { "value": "#FFFFFF", "type": "color", "layer": "A1" },
    "surface-inverse": { "value": "#123A38", "type": "color", "layer": "A1" },
    "surface-warm":    { "value": "#FBFCFC", "type": "color", "layer": "B" },
    "surface-sunken":  { "value": "#F0F2F3", "type": "color", "layer": "B" },
    "fg":              { "value": "#14181C", "type": "color", "layer": "A1" },
    "fg-inverse":      { "value": "#F4F6F5", "type": "color", "layer": "A1" },
    "fg-2":            { "value": "#3A4149", "type": "color", "layer": "B" },
    "muted":           { "value": "#5B6470", "type": "color", "layer": "A1" },
    "meta":            { "value": "#79828E", "type": "color", "layer": "B" },
    "border":          { "value": "#E3E6EA", "type": "color", "layer": "A1" },
    "border-soft":     { "value": "#EEF0F2", "type": "color", "layer": "B" },
    "border-inverse":  { "value": "#1F4A47", "type": "color", "layer": "B" },
    "accent":          { "value": "#123A38", "type": "color", "layer": "A1" },
    "accent-hover":    { "value": "#0C2B29", "type": "color", "layer": "A2" },
    "accent-active":   { "value": "#081E1D", "type": "color", "layer": "A2" },
    "accent-on":       { "value": "#FFFFFF", "type": "color", "layer": "A2" },
    "accent-metal":    { "value": "#7D6330", "type": "color", "layer": "A1" },
    "accent-metal-hover": { "value": "#6A5327", "type": "color", "layer": "A2" },
    "metal-on":        { "value": "#FFFFFF", "type": "color", "layer": "A2" },
    "success":         { "value": "#1A6B4F", "type": "color", "layer": "A2" },
    "warn":            { "value": "#8A5A00", "type": "color", "layer": "A2" },
    "danger":          { "value": "#B42318", "type": "color", "layer": "A2" },
    "info":            { "value": "#1D4E6B", "type": "color", "layer": "A2" },
    "overlay":         { "value": "rgba(20,24,28,0.32)", "type": "color", "layer": "A2" },
    "line-alloy":      { "value": "#6E6555", "type": "color", "layer": "C" },
    "line-steel":      { "value": "#4A5A63", "type": "color", "layer": "C" },
    "line-stone":      { "value": "#5D5069", "type": "color", "layer": "C" }
  },
  "font": {
    "family": {
      "display": { "value": "Archivo, HarmonyOS Sans SC, Noto Sans SC, sans-serif", "type": "fontFamily" },
      "body":    { "value": "Public Sans, HarmonyOS Sans SC, Noto Sans SC, sans-serif", "type": "fontFamily" },
      "mono":    { "value": "JetBrains Mono, ui-monospace, monospace", "type": "fontFamily" }
    },
    "size": {
      "xs":  { "value": "12px", "type": "dimension" },
      "sm":  { "value": "14px", "type": "dimension" },
      "base":{ "value": "16px", "type": "dimension" },
      "md":  { "value": "18px", "type": "dimension" },
      "lg":  { "value": "20px", "type": "dimension" },
      "xl":  { "value": "24px", "type": "dimension" },
      "2xl": { "value": "32px", "type": "dimension" },
      "3xl": { "value": "40px", "type": "dimension" }
    },
    "weight": {
      "read": { "value": "400", "type": "fontWeight" },
      "emphasize": { "value": "500", "type": "fontWeight" },
      "subhead": { "value": "600", "type": "fontWeight" },
      "announce": { "value": "700", "type": "fontWeight" }
    },
    "leading": {
      "hero":  { "value": "1.08", "type": "number" },
      "tight": { "value": "1.25", "type": "number" },
      "snug":  { "value": "1.4",  "type": "number" },
      "body":  { "value": "1.6",  "type": "number" },
      "ui":    { "value": "1.45", "type": "number" }
    },
    "tracking": {
      "caps":    { "value": "0.08em",  "type": "dimension" },
      "hero":    { "value": "-0.025em","type": "dimension" },
      "heading": { "value": "-0.015em","type": "dimension" },
      "body":    { "value": "0",       "type": "dimension" },
      "cjk":     { "value": "0.02em",  "type": "dimension" }
    }
  },
  "space": {
    "1": {"value":"4px","type":"dimension"},   "2": {"value":"8px","type":"dimension"},
    "3": {"value":"12px","type":"dimension"},  "4": {"value":"16px","type":"dimension"},
    "5": {"value":"20px","type":"dimension"},  "6": {"value":"24px","type":"dimension"},
    "8": {"value":"32px","type":"dimension"},  "10":{"value":"40px","type":"dimension"},
    "12":{"value":"48px","type":"dimension"},  "16":{"value":"64px","type":"dimension"},
    "20":{"value":"80px","type":"dimension"}
  },
  "radius": {
    "none":{"value":"0","type":"dimension"},
    "xs":  {"value":"2px","type":"dimension"},
    "sm":  {"value":"4px","type":"dimension"},
    "md":  {"value":"6px","type":"dimension"},
    "lg":  {"value":"8px","type":"dimension"},
    "pill":{"value":"9999px","type":"dimension"}
  },
  "elevation": {
    "flat":   {"value":"none","type":"boxShadow"},
    "ring":   {"value":"0 0 0 1px var(--border)","type":"boxShadow"},
    "raised": {"value":"0 1px 2px rgba(20,24,28,0.04), 0 4px 10px rgba(20,24,28,0.06)","type":"boxShadow"},
    "drawer": {"value":"-8px 0 32px rgba(20,24,28,0.10)","type":"boxShadow"}
  },
  "motion": {
    "duration": {
      "instant":{"value":"80ms","type":"duration"},
      "fast":   {"value":"150ms","type":"duration"},
      "base":   {"value":"240ms","type":"duration"},
      "slow":   {"value":"300ms","type":"duration"},
      "timeout":{"value":"800ms","type":"duration"}
    },
    "easing": {
      "out":    {"value":"cubic-bezier(0.2, 0, 0, 1)","type":"cubicBezier"},
      "inOut":  {"value":"cubic-bezier(0.4, 0, 0.2, 1)","type":"cubicBezier"}
    }
  },
  "zIndex": {
    "base":"0","header":"200","stickyPanel":"210","dropdown":"300",
    "overlay":"400","drawer":"410","modal":"500","toast":"600"
  },
  "container": {
    "max":   {"value":"1280px","type":"dimension"},
    "wide":  {"value":"1440px","type":"dimension"},
    "gutter-desktop":{"value":"24px","type":"dimension"},
    "gutter-tablet": {"value":"16px","type":"dimension"},
    "gutter-phone":  {"value":"12px","type":"dimension"}
  },
  "sectionY": {
    "desktop":{"value":"80px","type":"dimension"},
    "tablet": {"value":"56px","type":"dimension"},
    "phone":  {"value":"40px","type":"dimension"}
  },
  "icon": {
    "inline":{"value":"16px","type":"dimension"},
    "button":{"value":"20px","type":"dimension"},
    "standalone":{"value":"24px","type":"dimension"},
    "strokeWidth":{"value":"1.5","type":"number"}
  },
  "touchTarget": { "min": {"value":"44px","type":"dimension"}, "gap": {"value":"8px","type":"dimension"} }
}
```

### 9.2 圆角为什么取 6px（刻意偏离 8–12 常规）

**刻意更小。**Dense catalog（VISUAL_DENSITY 7）配 12–16px 圆角会显得"软"，和"精密 / 归档"的品牌声音冲突。6px 卡片 + 4px 按钮 + 2px badge，整体读起来像仪器面板和纸质说明书。**且在圆角较灵敏的场景下：卡片圆角上限依旧守 16px，6px 只是我们的下方选择，未越红线。**

### 9.3 CSS 变量（前端直接 import 的那一层）

```css
:root {
  /* A1 Identity */
  --bg:#F7F8F9; --surface:#FFFFFF; --surface-inverse:#123A38;
  --fg:#14181C; --fg-inverse:#F4F6F5; --muted:#5B6470;
  --border:#E3E6EA; --accent:#123A38; --accent-metal:#7D6330;

  /* A2 Semantic/Structure */
  --accent-hover:#0C2B29; --accent-active:#081E1D; --accent-on:#FFFFFF;
  --accent-metal-hover:#6A5327; --metal-on:#FFFFFF;
  --success:#1A6B4F; --warn:#8A5A00; --danger:#B42318; --info:#1D4E6B;
  --overlay:rgba(20,24,28,0.32);

  /* B-slot */
  --surface-warm:#FBFCFC; --surface-sunken:#F0F2F3;
  --fg-2:#3A4149; --meta:#79828E;
  --border-soft:#EEF0F2; --border-inverse:#1F4A47;

  /* C-extension */
  --line-alloy:#6E6555; --line-steel:#4A5A63; --line-stone:#5D5069;

  /* Typography */
  --font-display:"Archivo","HarmonyOS Sans SC","Noto Sans SC",sans-serif;
  --font-body:"Public Sans","HarmonyOS Sans SC","Noto Sans SC",sans-serif;
  --font-mono:"JetBrains Mono",ui-monospace,monospace;
  --text-xs:12px; --text-sm:14px; --text-base:16px; --text-md:18px;
  --text-lg:20px; --text-xl:24px; --text-2xl:32px; --text-3xl:40px;
  --leading-hero:1.08; --leading-tight:1.25; --leading-snug:1.4; --leading-body:1.6; --leading-ui:1.45;
  --tracking-caps:0.08em; --tracking-hero:-0.025em; --tracking-heading:-0.015em; --tracking-cjk:0.02em;

  /* Space / Radius / Elevation */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px; --space-5:20px;
  --space-6:24px; --space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px; --space-20:80px;
  --radius-xs:2px; --radius-sm:4px; --radius-md:6px; --radius-lg:8px; --radius-pill:9999px;
  --elev-flat:none; --elev-ring:0 0 0 1px var(--border);
  --elev-raised:0 1px 2px rgba(20,24,28,.04), 0 4px 10px rgba(20,24,28,.06);
  --elev-drawer:-8px 0 32px rgba(20,24,28,.10);

  /* Motion */
  --motion-instant:80ms; --motion-fast:150ms; --motion-base:240ms; --motion-slow:300ms; --motion-timeout:800ms;
  --ease-out:cubic-bezier(0.2,0,0,1); --ease-in-out:cubic-bezier(0.4,0,0.2,1);

  /* Layout */
  --container-max:1280px; --container-wide:1440px;
  --container-gutter-desktop:24px; --container-gutter-tablet:16px; --container-gutter-phone:12px;
  --section-y-desktop:80px; --section-y-tablet:56px; --section-y-phone:40px;

  /* Focus */
  --focus-ring:0 0 0 3px rgba(125,99,48,.4);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-instant:0ms; --motion-fast:0ms; --motion-base:0ms;
    --motion-slow:0ms; --motion-timeout:0ms;
  }
  *, *::before, *::after { animation-duration:.01ms !important; transition-duration:.01ms !important; scroll-behavior:auto !important; }
}
```

---

## 10. 组件规范与 9 态矩阵

### 10.1 按钮

| 变体 | bg / border / fg | 圆角 | padding | 高度 |
|---|---|---|---|---|
| **Primary (RFQ 行动)** | `--accent-metal` / none / `--metal-on` | `--radius-sm` 4px | 0 20px | 48px（桌面）/ 44px（移动） |
| **Secondary (产品线 CTA)** | transparent / 1px `--accent` / `--accent` | 4px | 0 20px | 48 / 44 |
| **Ghost** | transparent / none / `--fg` | 4px | 0 12px | 40 |
| **Destructive** | transparent / 1px `--danger` / `--danger` | 4px | 0 16px | 44 |

**9 态强制要求：** Default / Hover(150ms) / Focus-visible(3px `--focus-ring`，不可用 `outline: none` 干掉) / Active(80ms 反馈) / Disabled(opacity .45 + `pointer-events:none` + `aria-disabled`) / Loading(inline spinner 16px + 文案变 `Submitting…` + 禁用重复点击) / Error / Empty（不适用）/ Success(短暂显示 check-circle-2 图标 + 文案 `Added` 800ms 后复位)

### 10.2 输入框 / 步进器

- Default：`--surface` bg + 1px `--border` + 4px radius + 14px 文字
- Focus：边框 `--accent` + `--focus-ring`
- Error：边框 `--danger` + `aria-invalid="true"` + 下方 12px `--danger` 文案
- Disabled：`--surface-sunken` bg + `--meta` 文字
- **数量步进器**：48×48px 触控区，`-` 在左 `+` 在右，中间数字输入 tabular-nums；**步进粒度 = MOQ**（如 MOQ 12 → 12/24/36…），输入非倍数时 **自动向上取整到最近的 MOQ 倍数 + 下方 hint `Adjusted to MOQ multiple (12)`**

### 10.3 状态标签（Table Tag）

全部 **icon + 文字成对**，禁止只靠颜色：
`check-circle-2 In stock`（success）／`circle-dashed Made to order`（muted）／`alert-triangle Low stock`（warn）／`x-circle Discontinued`（meta + 删除线）

### 10.4 表格（阶梯价 / 规格）

- `--text-sm`(14px) + tabular-nums + 行高 44px
- 行分隔 `border-bottom: 1px solid var(--border-soft)`，**无外框盒子**（VISUAL_DENSITY 7 的要求）
- **阶梯价表中"当前输入的件数命中的那一档"用 `--accent-metal` 左侧 2px 竖标记 + 底色 `--surface-sunken`**（这是 `--accent-metal` 的第二种全局用法）
- 表头：12px ALL CAPS tracking 0.08em `--muted`

---

## 11. 页面清单（V1 共 15 个 + 2 个 P1 预留）

> 路由已与 PM 的 `docs/PRD.md` §12.3 对齐（不再是本文档早期的草稿路由）。
> 比 Team Lead 要求的 8–12 个多，是因为 PRD 把「样品政策」与「物流与付款」拆成两页（两者 search intent 完全不同），并新增了「镍释放 / EN 1811」合规子专题——这是 PM 认定的差异化核心内容资产，必须有独立落点。
> **多语言结论沿用 PRD：V1 只做英文站**，全站统一美式拼写 `jewelry`。
>
> [已裁决 · Team Lead 2026-10-01] **URL 不加语言前缀**。架构师 `ADR-004` 原提的 `/{lang}/` 前缀方案已否决：
> 它会产出 PRD Out-of-Scope 第 13 条明确排除的 `/zh/` 前台路由，且与 PRD §12.3 的路由表冲突。
> **执行口径**：上表路由即最终 URL；i18n 仅作 v2 预埋（翻译字典外置、`hreflang="x-default"` 预留位），
> **V1 不产出第二语言路由、不渲染语言切换器、禁用态下拉也不渲染**。ADR-004 由架构师重写。

| # | 页面 | 路由 | 一句话说明 | 核心区块构成 |
|---|---|---|---|---|
| 1 | **首页** | `/` | 用"三条产品线并行"的非对称 Hero 直接展示真实货盘，3 秒回答"你是谁、有什么、起订多少" | Utility bar（含 Ship-to / Compliance-for 选择器）/ Header / 非对称三产品线 Hero / 产品线三分 Bento / 深墨玉信任条 / New this week rail / 同批实拍网格图 / 按买家类型导航 / 三步流程 / Compliance preview / Blog preview / Final CTA / Footer |
| 2 | **产品线 Landing — 时尚合金 / 铜饰** | `/product-lines/fashion-alloy-brass/` | 讲"SKU 广度 + 上新速度"，强调低价走量 | 产品线 Hero（暗面 + `--line-alloy`）/ 定位数据条（在售 SKU / 起 MOQ / 上新周期）/ 材质工艺说明 / 镀层厚度说明（中东线重点，接 EN 12472 教育）/ 子品类导航 / 本线热销 rail / Cross-line 推荐 |
| 3 | **产品线 Landing — 不锈钢 / 钛钢** | `/product-lines/stainless-titanium-steel/` | 讲"防水不掉色 + PVD 电镀 + 欧美热销"，有 technical 说服力 | 产品线 Hero / PVD vs 水电镀对比表 / 耐腐蚀实测说明（有报告链接）/ 厚度 μm 数据 / 316L vs 304 说明 / 子品类导航 / 本线热销 rail |
| 4 | **产品线 Landing — 天然石 / 人造宝石 / 珍珠** | `/product-lines/natural-stone-gemstone-pearl/` | 讲"故事性 + 天然差异"，用 editorial 大图承载 | 产品线 Hero（大图占比 ≥50%）/ 石种字典（每种石一张特写 + 学名 + 产地 + 莫氏硬度）/ 天然差异说明（纹理/色差非瑕疵）/ 系列 rail / 定制与配石说明 |
| 5 | **全站目录 / 搜索** | `/products/` | 千级 SKU 的采买主场，密度最高 | 左侧筛选 sidebar（含按市场过滤 "Compliant for: EU / US / Middle East"）/ 顶部 toolbar（视图切换 + 排序 + 结果数）/ Active Filter Chips / Grid or List 画布 / 批量加入 RFQ / 空结果处理（放宽建议 + 联系） |
| 6 | **产品详情** | `/products/{sku-slug}/` | 一次性给出"能下单"所需的全部信息 | Breadcrumb / Gallery(4 帧) / sticky 购买面板（Ship-to / Compliance-for 选择器 + SKU + 状态 + 规格表 + 阶梯价表 + 数量 + Add to RFQ + Request sample）/ 三条 accordion / 同系列 rail / Cross-line 推荐 / Compliance mini-block / 移动端 sticky bottom bar |
| 7 | **RFQ 询价篮** | `/rfq/` | 转化终点；桌面为抽屉形态，独立路由用于分享/回头访问 | 见 §8，桌面抽屉 + `/rfq/` 独立页（同内容，便于书签和邮件回跳） |
| 8 | **合作产线与质控** | `/sourcing-partners/` | **无工厂方的关键诚实页**：用"sourcing partner"替代"工厂实力"，不伪造车间 | 开篇自述（明确定位：trading & sourcing partner）/ 合作产线网络与各自擅长品类 / 三步 QC 流程（进料检 / 产中检 / 出货前验）/ 团队与客户经理介绍 / 真实办公与验货场景图（若有，**若无则在 ethnography 上用箱体堆放/验货台替代，不借图库车间图**）/ 服务过的买家类型 / CTA |
| 9 | **合规与检测中心** | `/compliance/` | 专业买家的第一道门槛；成熟购买商会主动索要这一页 | 标准清单（REACH 附件 XVII Entry 27 镍释放 / Entry 63 铅 / Entry 23 镉 / EN 1811 / EN 12472 / CPSC / Prop 65）/ 每项一句话说明 + 限值数字 + 报告 PDF 下载卡 / 第三方检测机构名（若可公开）/ 批次追溯说明 / 索取最新报告表单 |
| 10 | **合规子专题：镍释放与 EN 1811 / EN 12472** | `/compliance/nickel-release-en-1811/` | PRD 认定的核心差异化内容资产；买家最不懂、最该被教育的一点 | 长文教学（镀层制品为什么要先模拟磨损再测 EN 12472）/ 一边 --surface-sunken 的限值表格 / 我们按什么频次送检 / 常见失败原因 / RFQ 时怎么要求这一项 / 相关 SKU rail |
| 11 | **样品政策** | `/samples/` | 把"样品怎么拿"讲清楚，这是 B2B 成交前最卡的一步 | 样品单价规则 / 运费谁承担 / 样品可否退 / 样品交期 / 混装箱规则 / 下单后样品费是否抵扣 / `[Request samples]` CTA |
| 12 | **物流与付款条款** | `/shipping-payment/` | 把"隐藏的费用与交期"前置公开，直接解决 B2B 最大痛点 | MOQ 规则 / 阶梯折扣表 / 生产与发货交期（按线区分）/ DDP / FOB / EXW 说明 / 承运商与时效对照表 / 付款方式（T/T、L/C、PayPal、信用卡）与账期 / 退换与破损赔付流程 |
| 13 | **常见问题** | `/faq/` | 覆盖采购前的疑虑，降低「必须邮件来回」 | 分组 accordion（MOQ & Pricing / Samples / Shipping & Lead time / Customization & OEM / Payment & Terms / Compliance）/ 顶部搜索框 / 未解决 → Contact CTA |
| 14 | **Blog / 采购指南内容中心** | `/blog/` | SEO 与专业度资产；也是无工厂方最可持续的信任来源 | 列表页（分类 filter：Material guides / Plating & care / Buying guides / Compliance explainers）/ 文章页（长文 16px 正文 + 目录 + 相关 SKU rail）/ 邮件订阅（放在文末，不跳出弹窗） |
| 15 | **联系我们** | `/contact/` | 收口页，给"不习惯自助询价"的买家一条路 | 联系渠道卡（Email / WhatsApp / WeChat，各带图标与在线时间）/ 结构化询盘表单（字段 ≤6）/ 时区对照（买家所在地 vs 我们的工作时间 GMT+8）/ 期望响应时间承诺 |

**P1 预留（V1 不做页面，但要在 IA 里留位置）：**

| # | 页面 | 路由 | 什么时候做 | 预留方式 |
|---|---|---|---|---|
| 16 | 区域页：中东 | `/markets/middle-east/` | P1 | 中东镀层厚度诉求（0.3–0.5μm）与欧美差异最大。V1 先由 Utility bar 的 Ship-to 选择器承载差异内容 |
| 17 | 区域页：欧洲 / 英国 | `/markets/europe-uk/` | P1 | 承载 REACH / EN 1811 专章；V1 由合规子专题页（#10）先接住这批关键词 |

**跨页面的一致组件（新增，V1 P0）：**
- **`ShipToSelector`（Ship to / Compliance for）**：Utility bar 上一个 `globe` + 下拉（United States / EU & UK / Middle East / Rest of world）。选定后全站产品卡片与 PDP 的合规标签随之变化（例：选 EU 时展示 "EN 1811 nickel release: pass"）。这是 PRD §5.3 定义的 P0 且是本最强的差异化组件，需要一个跨页面的 `ComplianceContext`。**形态必须是下拉选择器，不是弹窗，也不能强制登录。**

**页面间转化动线：** 任何页面 Header 都能看到 `RFQ (n)` → 任何 SKU 卡都能加入 → `/rfq/` 完成提交。三条产品线 Landing 之间在页脚互链 + PDP 内的 Cross-line 推荐做横向导流；`/compliance/` 与 `/samples/` 是 PDP 购买面板下方的两个信任出口。

---

## 12. 首页信息架构草图

```
[0] Utility Bar  h=36px  bg=--surface-inverse  fg=--fg-inverse
    Ship to: United States ▾   |   Mon–Fri 09:00–18:00 (GMT+8)   |   [file-input] RFQ (0)
    ↑ 只有 3 项。**禁止放「EN / USD」语言或币种下拉**（PRD Out-of-Scope 第 12/13 条）。
      即使将来也不做禁用态下拉 —— 禁用态 = 暗示"即将支持多语言/多币种" = 虚假承诺。
      时区那串是占位，须客户确认（§17 第 4 项）。

[1] Header  sticky=true  h=64px  bg=--surface  border-bottom=1px --border
    LOGO        Product Lines ▾   All products   Compliance   Sourcing   Blog   Contact
                                        [搜索框 + search 20px] "Search by SKU…"   [file-input RFQ (0)]

────────────────────────────── HERO ──────────────────────────────
[2] Hero  非对称两栏  max-w 1440  py=--space-20 (80px)
    ┌──────────────────────────┬─────────┬─────────┬─────────┐
    │ 左：文案 40%             │ 切条 1  │ 切条 2  │ 切条 3  │
    │                          │ 合金/铜 │ 不锈钢  │ 天然石  │
    │ H1 40px Archivo 700      │┌───────┐│┌───────┐│┌───────┐│
    │ tracking -0.025em        ││实拍图│││实拍图│││实拍图││
    │                          ││  4:5  │││  4:5  │││  4:5  ││
    │ "Three product lines.    │├───────┤│├───────┤│├───────┤│
    │  Verified specs on       ││实拍图│││实拍图│││实拍图││
    │  every SKU."             │├───────┤│├───────┤│├───────┤│
    │                          ││实拍图│││实拍图│││实拍图││
    │ Sub 18px --muted         │└───────┘│└───────┘│└───────┘│
    │ "Fashion alloy & brass · │ Fashion │Stainless│ Natural │
    │  Stainless & titanium    │ Alloy   │& Titan. │ Stone,  │
    │  steel · Natural stone,  │ & Brass │ Steel   │Gem&Pearl│
    │  lab gemstone & pearl    │         │         │         │
    │  — hundreds of styles,   │ Zinc    │ 316L /  │ By lot: │
    │  MOQ 12-120 pcs, stated  │ alloy & │ titanium│ no two  │
    │  per style."             │ brass,  │ · PVD   │ stones  │
    │                          │ plated  │ plating │ alike   │
    │                          │         │         │         │
    │ [Browse the catalog]     │         │         │         │
    │ [Start an RFQ]           │         │         │         │
    └──────────────────────────┴─────────┴─────────┴─────────┘
     ↑ Secondary(--accent)      ↑ Primary(--accent-metal)
    说明：Hero 展示真实产品实拍图，不是抽象图形。三条竖切条不等高（4:5 + 高度微差），
         满足 DESIGN_VARIANCE=6 的非对称要求，并直接完成"产品线分层"的信息传达。

    [已解锁] 客户已确认有几百款可商用实拍图（§17 第 9 项）—— 本方案**定稿执行**。
             前置待办：客户按 §6.4 口径做一轮「可用 / 需补拍 / 弃用」筛选，
             可用图须覆盖 Hero（3 条线各 3-4 张）+ 三条 Landing + 全部上线 SKU 的主图与细节帧。

    [硬性] 文案取自 PRD §6.2.1 客户已确认数据：
             `Hundreds of styles` —— 量级表述，**禁止改写成精确数字**（如 1,240 SKUs）。
             `MOQ 12-120 pcs, stated per style` —— 区间表述，**禁止压缩成单点值**（如 MOQ from 12 pcs）。
             原因：客户给的是量级 / 区间，不是确数，写死数字即虚标。

    [硬性] 价格仍是未确认项：Hero 与卡片**不得写 `From USD 0.38/pc` 这类具体单价**，
             降级为 `Priced by tier — see each collection`（PRD §6.2 降级对照表）。

[3] Three Lines  Bento  grid-template-columns: 2fr 1fr 1fr  gap=--space-6
    ┌──────────────────────────┬───────────────┬───────────────┐
    │ [材质特写大图 16:9]       │ [材质图 4:5]  │ [材质图 4:5]  │
    │ H3 "Fashion Alloy & Brass"│ Stainless...  │ Stone, Gem... │
    │ 14px 文案: 低价走量、      │ 防水不掉色、   │ 每颗石头都不  │
    │ 每周上新、SKU 深度。      │ PVD 电镀、     │ 一样，按批次  │
    │                          │ 欧美热销款。   │ 走货、讲得出  │
    │ 三个数据点 + link        │ （同上）      │ 产地。        │
    │ [--line-alloy 识别带]     │ [--line-steel]│ [--line-stone]│
    └──────────────────────────┴───────────────┴───────────────┘

    [硬性] 「三个数据点」在对应数据到位前**不得写数字**。按 PRD §6.2 对照表降级：
             SKU 深度 → `Catalogue depth varies by line`（各线分布确认后可写量级）
             起订量   → `MOQ 12-120 pcs, stated per style`（已确认，可用）
             上新周期 → 未确认，先用产品线描述文案占位，不写「weekly」这类频率承诺

[4] Trust Band  bg=--surface-inverse  py=--space-12
    **5 项横排**（每项 icon 24px + 12px ALL CAPS 微标签 + 14px 说明）
    [ruler]          MOQ 12-120 PCS, STATED PER STYLE
    [package-search] SAMPLE BEFORE BULK
    [file-check]     TEST REPORTS ISSUED PER BATCH
    [clock]          QUOTED BY A PERSON, NOT A BOT
    [globe]          SHIPS WORLDWIDE

    ↑ 第 1 项取自 PRD §6.2.1 客户已确认数据，是**区间表述**，禁止压缩成单点值。
      第 2-5 项为降级写法，对应数据到位后按 PRD §6.2 对照表升级（见 §17）。
    [硬性] 本区块**不出现任何证书图形 / 徽标墙 / 实验室 logo**（PRD AC-41）。
          报告到位后若要加回第 3 项的具体编号，必须四要素齐全（AC-39）。

[5] New This Week  横向 rail，12 SKU，4:5 卡，左右箭头 + 拖拽
    Section title 24px Archivo 600 / 右侧 "View all new →"

[6] One Batch, Photographed  同一批实拍网格图（8–12 SKU 平铺一张）
    左：大图 (70%)   右：文案 (30%)
    H3 "One batch, one light, photographed together."
    14px "Grid shots are the honest way to show a range: same light, same day,
          same background. You get the parcel you would actually receive,
          not one hero SKU dressed up for the camera."

    [已解锁] 客户有几百款可商用实拍图 —— 本模块**上线**，定稿执行。
             它是全站最有效的「我有真实货盘」证明，优先排在首屏之后的第一屏。
    [硬性] **不得写 `Photographed in-house`**。客户是贸易商（PRD Out-of-Scope 第 3 条），
             图片来源须经 §6.4 筛选后才能确认；在确认自有拍摄之前，
             "in-house" 属于可证伪的产地声称，与「诚实表述」定位冲突。

[7] Buyer Types  4 卡，**非同尺寸**（2×2 中左上 16:9、其余 1:1）
    Amazon sellers / Boutique buyers / Chain retail sourcing / Private label & OEM
    每卡：一句话击中该买家类型的核心顾虑 + link

[8] How It Works  3 步，竖向连接线 + icon，**不用 01/02/03 编号**
    [file-input] Pick your SKUs  →  [package-search] Approve a sample  →  [truck] We ship & document
    每步一句，放不可逆应当承担的说明

[9] Compliance Preview  **教育式，不是证书墙**（客户暂无任何现成报告，见 §17 第 5 项）

    [禁止] 报告缩略图 / [download] 直链 / 证书图形 / 徽标墙 / 实验室 logo
           —— PRD Out-of-Scope 第 15 条 + AC-41。
              当前零报告，画出来即虚假陈述；买家一索要编号就穿帮，
              直接摧毁 §4 的核心差异化「可验证」。

    [允许] 3 张「标准说明卡」，每张只讲一件事：
           ┌──────────────┬──────────────┬──────────────┐
           │[shield-check]│ [file-text]  │ [microscope] │
           │ NICKEL       │ LEAD &       │ HOW TO READ  │
           │ RELEASE      │ CADMIUM      │ A REPORT     │
           │              │              │              │
           │ EN 1811（无 │ REACH Annex  │ 标准 / 机构 /│
           │ 镀层）/ EN  │ XVII Entry   │ 编号 / 日期  │
           │ 12472（有镀 │ 63 & 23，    │ 四要素，缺一 │
           │ 层，先模拟  │ ≤0.05% /     │ 即不可信。   │
           │ 磨损）      │ ≤0.01% w/w   │              │
           │ 限值 0.5；  │              │              │
           │ 穿刺类 0.2  │              │              │
           │ µg/cm²/week │              │              │
           └──────────────┴──────────────┴──────────────┘

    并在此处明示 Ship-to 选择器（见 §11 的 ShipToSelector），切换的是**卡片末行文案**：
       选 EU & UK   →  "Nickel release — EN 1811 / EN 12472"
       选 US        →  "CPSC lead limits — Prop 65"
       选 Other     →  "Test reports issued per batch"
    ↓ 卡片下方统一一行降级文案（任何情况下都渲染）：
       "Test reports issued per batch and provided with your quotation."

    [已裁决] 以上属 PRD 允许的两类表述（承诺式 + 教育式），符合 AC-38 / AC-39 / AC-41。
             AC-39 四要素（标准 + 机构 + 编号 + 日期）缺一即整条落到降级文案，不渲染半截承诺。

[10] Blog Preview  3 篇（Material / Plating care / Compliance explainer）

[11] Final CTA  bg=--surface-inverse，居中容器但文案左对齐，避免过度对称
    H2 32px "Tell us which lines you buy. We will send a quote, not a brochure."
    [Start an RFQ]  [Request samples]

[12] Footer  4 列 + 底部合规 icon 行 + 版权
    列 1: Fashion Alloy & Brass / Stainless & Titanium Steel / Stone, Gem & Pearl / All products
    列 2: Compliance center / Nickel release (EN 1811) / Samples / Shipping & payment
    列 3: Sourcing partners & QC / Blog / FAQ / Contact
    列 4: newsletter 订阅（单字段）
    [已裁决] V1 **不做语言切换、不做货币切换**（PRD Out-of-Scope 第 12/13 条）。
           价格一律写成 `USD 3.80-4.60` 形式 —— 币种是价格串的一部分，不是可切换控件。
           Utility Bar 上**不允许出现禁用的 EN / USD 下拉**，因为禁用态会被误读为"即将支持"。
           时区文案 `Mon–Fri 09:00–18:00 (GMT+8)` 为占位，须客户确认（§17 第 4 项）。
```

**首屏硬要求：** Hero 必须在 6 秒内传达"你是谁、做什么、为谁做"；首屏 CTA 上方 ≤2 个链接；LCP < 2.5s。

---

## 13. 产品详情页信息架构草图

```
[Breadcrumb]  Home / All products / Stainless & Titanium Steel / SS-E2407-18K

[主区]  grid-template-columns: 1.2fr 1fr   gap=--space-10   max-w=1280
┌──────────────────────────────────┬────────────────────────────────┐
│ Gallery (左侧 55%)                │ Buy Panel (右侧 45%)            │
│                                  │ position: sticky; top: 88px     │
│                                  │                                │
│ ┌──────────────────────────────┐ │ Compliance for: [EU & UK    ▾]  │ ← ShipToSelector，全站共享状态
│ │  A1 主图  1:1                 │ │ （选不同市场，下方 Compliance 行与 │
│ │  bg=--surface-warm           │ │   卡片/PDP 的合规标签同步变化）    │
│ │  (hover: 容器内微 zoom 1.04,  │ │                                │
│ │   240ms --ease-out)          │ │ [pill] In stock   [pill] New    │
│ └──────────────────────────────┘ │                                │
│  [A1] [A2] [A3] [A4]  缩略条     │ SS-E2407-18K                    │
│   60×60  --radius-sm  1px border │ mono 14px  --meta               │
│   选中: border=--accent 2px      │ Geometric Open Ring, Adjustable │
│                                  │ Archivo 600  24px  --fg         │
│                                  │ ── Specifications ───────────── │
│ 点击 → Lightbox                  │ definition list，2 列，14px     │
│  · 左/右箭头 + Esc 关闭          │ row 分隔 1px --border-soft      │
│  · 不被 hype 的 zoom lens        │ Material     304 Stainless Steel│
│  · 移动端改为全屏 swipe          │ Plating      PVD 18K Gold, 0.03μm│
│                                  │ Stone        None               │
│                                  │ Size         8 mm band, adj.    │
│                                  │ Weight       3.2 g              │
│                                  │ Nickel       EN 1811 ≤0.5 µg/cm²/wk│
│                                  │   (耳针/穿刺类: ≤0.2)  │
│                                  │ Lead         REACH Pb ≤0.05% w/w│
│                                  │ Finish       Brushed + polished │
│                                  │                                │
│                                  │ ── Reference Price ─────────── │
│                                  │                                │
│                                  │  USD 3.80-4.60 / pc            │
│                                  │   ↑ 24px Archivo 600 --fg      │
│                                  │   ↑ tabular-nums               │
│                                  │                                │
│                                  │  MOQ 24 pcs                    │
│                                  │   ↑ 16px --fg-2 tabular-nums  │
│                                  │                                │
│                                  │  Reference range —              │
│                                  │  quoted per order              │
│                                  │   ↑ 12px --meta（可见）        │
│                                  │                                │
│                                  │ [Request the tiered price      │
│                                  │  table →] ← 进 RFQ            │
│                                  │                                │
│                                  │ Quantity  [−] 24 [+]            │
│                                  │   hint: 步进=MOQ，自动取整      │
│                                  │                                │
│                                  │ ┌────────────────────────────┐ │
│                                  │ │  Add to RFQ                │ │ Primary 48px
│                                  │ └────────────────────────────┘ │
│                                  │ ┌────────────────────────────┐ │
│                                  │ │  Request a sample          │ │ Secondary 48px
│                                  │ └────────────────────────────┘ │
│                                  │                                │
│                                  │ [ruler] MOQ 12 pcs            │
│                                  │   ↑ 该款的具体 MOQ，逐款填    │
│                                  │ [clock] Lead time quoted      │
│                                  │         per order             │
│                                  │ [globe] Ships worldwide       │
│                                  │ [rotate-ccw] After-sales on   │
│                                  │         defects               │
└──────────────────────────────────┴────────────────────────────────┘

[下方 全宽]
 ├ Accordion ×3：Product details / Plating & care / Packaging & labeling
 │   每项：标题 16px weight 500 + chevron-down 16px，展开 240ms
 ├ Same series — 6 SKU rail
 ├ Often paired with — 4 SKU rail（Cross-line 推荐，导流到另外两条产品线）
 ├ Compliance mini-block：shield-check + 合规行（渲染规则见下方 [合规行渲染规则]）
 │   合规行仅两种合法形态：
 │     (a) 有报告 → `EN 1811 / EN 12472 · <机构名> · Report #<编号> · <YYYY-MM>`
 │     (b) 无报告 → `Test reports issued per batch — provided with your quotation`
 │   [硬性] 禁止只写 "pass" / "compliant" / "REACH available"；四要素缺一即降级为 (b)
 │   + [Download PDF] **仅在四要素齐全时渲染**（客户当前零报告 → V1 不渲染）
 │   + 一行 link "How we test this →"（指向 /compliance/nickel-release-en-1811/）
 └ 移动端 sticky bottom bar： [Qty 200 ▾]  [Add to RFQ]   高 64px + safe-area-inset
```

**PDP 硬性要求：** 不得隐藏 MOQ、不得隐藏阶梯价、不得用 "Login to see price"、不得 require 注册才能加 RFQ、合规标签必须按 Ship-to 选择器联动。这五条违背任何一条，都会直接触发 B2B 买家的跳出。

**Specifications 表的最少字段（对齐 PRD §13.3）：** Material / Plating（含厚度 μm）/ Stone / Size / Weight / Nickel / Lead / Finish。八项缺一不可——这是「规格可验证」差异化的最小集，也是 PM 认定的市场空白点。

### 13.1 Specifications 八字段版式骨架（结构已知，值待填）

这张表是「规格可验证」差异化的最小集。**版式先定、值后灌** —— 客户数字一到即可直接填充，不需要重新排版。这是我被要求 standby 期间唯一可推进且不依赖待确认数据的部分。

**字段清单与顺序（固定，不得增删）**

| # | Key | Label | 值形态 | 样式 |
|---|---|---|---|---|
| 1 | `material` | Material | 文本（含牌号） | Public Sans 14px `--fg` |
| 2 | `plating` | Plating | 工艺 + 厚度 μm | 14px `--fg`，数字 tabular-nums |
| 3 | `stone` | Stone | 文本（`None` 亦须渲染） | 14px `--fg` |
| 4 | `size` | Size | 数值 + 单位 | 14px `--fg`，tabular-nums |
| 5 | `weight` | Weight | 数值 + 单位 | 14px `--fg`，tabular-nums |
| 6 | `nickel` | Nickel release | 合规行（渲染规则见 §13） | 14px |
| 7 | `lead` | Lead & cadmium | 合规行（渲染规则见 §13） | 14px |
| 8 | `finish` | Finish | 文本 | 14px `--fg` |

**版式规格**

| 项 | 值 |
|---|---|
| 结构 | `<dl>` 两列 definition list（`dt` 标签 / `dd` 值） |
| 标签列宽 | **40% 固定** → 保证所有行的值列左对齐在同一纵向轴上 |
| 行高 | `min-height: 36px`，`padding: 8px 0` |
| 行分隔 | `border-bottom: 1px solid var(--border-soft)`，**最后一行无边框** |
| 标签样式 | 12px `--muted`，正常大小写（**不加 ALL CAPS / letter-spacing** —— 表格标签不是 section eyebrow，套用会违反红线 #9） |
| 值样式 | 14px `--fg`；所有数值 `tabular-nums` |
| 产品线识别色 | 值列左侧 2px 竖线用 `--line-alloy` / `--line-steel` / `--line-stone`，**仅作分组识别，不作状态传达** |

**值缺失时（对齐 PRD AC-06）**

**禁止省略该行、禁止填占位符**。缺值行统一渲染为：
```
  Nickel release        On request — ask with your RFQ
```
即标签正常显示，值用 `--meta` 14px 渲染降级文案。**八行始终全部存在** —— 行数本身就是「规格完整性」的视觉承诺，缺行会被专业买家解读为「规格不全」。

**响应式**

| 断点 | 行为 |
|---|---|
| `≥1024px` | 两列 `<dl>`，标签列 40%，位于购买面板内 |
| `768–1023px` | 两列 `<dl>`，标签列 36% |
| `<768px` | **单列堆叠**：标签 12px `--muted` 在上、值 14px `--fg` 在下，行间距 12px；整体移入 `Product details` Accordion，默认折叠 |

**无障碍**

- 用原生 `<dl>` / `<dt>` / `<dd>`，**不要用 `<table>` 或 `<div>` 拼** —— 屏幕阅读器依赖 dt-dd 的配对关系才能读出「Material: 304 Stainless Steel」
- 合规行若含图标，图标 `aria-hidden="true"`，语义由相邻文本承载（状态一律图标 + 文字成对，红线 #4）

**Nickel / Lead 两行的渲染规则（最易踩坑，单独钉死）：**

| 情况 | 合法渲染形态 |
|---|---|
| 该 SKU 有四要素齐全的报告（标准 + 机构 + 编号 + 日期） | `EN 1811 · <机构名> · Report #<编号> · <YYYY-MM>` |
| 无报告（**客户当前全部 SKU 均为此状态**） | `Test reports issued per batch — provided with your quotation` |

- 限值 `0.5 µg/cm²/week` 是**标准科普**，只写在合规教育页 `/compliance/nickel-release-en-1811/`；
  **禁止写在 PDP 规格行里** —— 那会被买家读成「本款已实测且合格」，而我们没有报告可给。
- 穿刺 / 耳针类的 `0.2 µg/cm²/week` 同理，只在教育页按品类区分说明（PRD AC-40）。
- PDP 的 `[Download PDF]` **仅在四要素齐全时渲染**，V1 一律不渲染。

---

## 14. Do's & Don'ts

### [Do] 应该做的

1. **每个页面底层 container 和 gutter 都取自 Token**（`--container-max/--container-gutter-*`），不写死宽度
2. **所有颜色、间距、圆角、阴影、时长都走 Token**，唯一例外是 `#fff` / `#000`
3. **图片统一 `aspect-ratio` + `object-fit: contain` + `--surface-warm` 底色**，让 batch 不齐的图也能排整齐
4. **状态一律「图标 + 文字」成对**，不靠颜色单独传达含义
5. **价格 / MOQ / 尺寸用 `tabular-nums` 对齐**，纵向不跳位
6. **字重只用 400/500/600/700**，标题 ≥600，正文 400
7. **所有交互元素 ≥44×44px**，相邻按钮间距 ≥8px
8. **每条`:focus-visible` 用 3px `--focus-ring`**，不允许 `outline: none`
9. **动效只在 80/150/240/300ms 四档**，`prefers-reduced-motion` 下全部归零
10. **SKU 层的 DEPTH（MOQ / 阶梯价 / 交期 / 现货 / 认证）必须全部公开**，这是本项目转化率的第一变量
11. **`ShipToSelector`（Ship to / Compliance for）做成全站共享的 ComplianceContext**，不得在每个页面各自实现一份；选定市场后卡片、目录筛选、PDP 的合规标签必须一起变
12. **V1 不做语言切换、不做货币切换**（PRD Out-of-Scope 第 12 条）。若后期加语言，走 `/es/` `/fr/` 子路径 + hreflang，由架构师给方案
13. **禁止把语言/币种选择器渲染成禁用态** —— 禁用态 = 暗示"即将上线" = 虚假承诺（PRD Out-of-Scope 第 13 条）
14. **合规标签四要素齐全才渲染**：测试标准 + 出具机构 + 报告编号 + 测试日期，缺任一即降级为 `Test reports issued per batch`（PRD AC-38 / AC-39）
15. **耳针/穿刺类镍释放限值为 0.2 µg/cm²/week，非 0.5**，必须按品类区分渲染（PRD AC-40）
16. **目录工具栏不加导出（CSV/PDF）出口** —— PRD 判定为 P2 backlog（F21）
17. **文案只使用两种合法形态**：① PRD §6.2.1 客户已确认的量级 / 区间表述；② PRD §6.2 降级写法对照表的左列。禁止把量级改写成精确数字，禁止把区间压缩成单点值
18. **合规区块一律「教育式 + 承诺式」**：讲标准是什么、买家怎么核验报告、我们按批出具。禁止证书图形 / 徽标墙 / 实验室 logo（PRD AC-41）
19. **Hero 与产品线 Landing 只放经 §6.4 筛选合格的实拍图**；图不齐就少上 SKU，不用不合格图凑数
20. **卡片与 PDP 必须显示参考价格区间 + MOQ**（P0 必显字段）。格式：`USD 3.80-4.60 / pc` + `MOQ 24 pcs`，区间旁**可见**限定语 `Reference range — quoted per order`
21. **价格与 MOQ 打包为同一视觉单元**（视觉算 1 组）：同行、同区块、右对齐；纵向扫视时小数点严格对齐 —— 靠 `tabular-nums` + **恒 3 字母 `USD` 前缀**共同保证

### [Don't] 严禁（违反即重做）

1. **禁止任何 emoji 作为功能图标**（`[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]` 扫描必须为零）。图标只有 Lucide
2. **禁止 Indigo→Pink / Purple→Pink 渐变**，禁止 `#7C3AED` `#A855F7` `#9333EA` `#EC4899` 之间的任何渐变组合，禁止"渐变 + 发光边框 + 毛玻璃"三位一体
3. **禁止硬编码颜色**（`#fff` `#000` 除外）
4. **禁止空洞文案**：无 "Welcome to" / "Lorem ipsum" / "Sign up today" / "Get started" / "Elevate" / "Seamless" / "Unleash" / "Next-Gen"
5. **禁止抽象 Hero**：Hero 必须展示真实产品/真实数据，不放无意义的 3D 抽象图形和大色块
6. **禁止弹跳缓动** `cubic-bezier(0.68,-0.55,0.265,1.55)` 及任何 spring overshoot
7. **禁止卡片彩色左边框** `border-left: 3px solid <color>`
8. **禁止 ≥16px 模糊阴影与 1px 边框同时出现在同一元素**（幽灵卡片）
9. **禁止每个 section 都挂小型大写追踪标签**（"OUR PROCESS" / "ABOUT" 这种 eyebrow）
10. **禁止编号 section 脚手架**（"01 · 关于 / 02 · 流程"）。真流程用 icon + 连接线表达
11. **禁止奶油/米色背景**（`OKLCH L 0.84–0.97, C<0.06, hue 40–100`）——那是 AI 默认。温暖感由金属商品本身 + 黄铜 CTA 传达
12. **禁止默认 Indigo `#6366F1`** 作强调色（业界公认 AI 首罪）
13. **禁止虚构数字**（"10,000+ customers" / "99.9% uptime" 类）。所有示例数字在本文档中均为占位槽，须替换或删除
14. **禁止给产品图上调饱和度/锐化/加渐变模拟金属光泽**——颜色失真 = 退货
15. **禁止 gradient text**（`background-clip: text`）
16. **禁止全站同尺寸卡片重复铺满**：必须用混合长宽比 / 分数单位网格 / 横向 rail 至少一种打破
17. **禁止把已确认的量级 / 区间改写成精确数字或单点值**（`Hundreds of styles` → `1,240 SKUs`；`MOQ 12-120 pcs` → `MOQ from 12 pcs`）—— 客户给的是量级与区间，写死即虚标
18. **禁止任何证书图形 / 徽标墙 / 实验室 logo / [download] 报告直链** —— 客户当前零报告，画出来即虚假陈述（PRD Out-of-Scope 第 15 条 + AC-41）
19. **禁止 `Photographed in-house` 及任何可证伪的产地 / 自有产能声称** —— 客户是贸易商，无自有工厂（PRD Out-of-Scope 第 3 条）
20. **禁止隐藏价格或 MOQ** —— 不得把 `"Login to see price"` / `"Contact us for pricing"` 作为唯一价格信息（PM 调研硬证据：隐藏 MOQ / 价格 / 交期是海外批发买家首要痛点）
21. **禁止在公共页渲染精确阶梯价表**（逐档固定单价）—— 只走 RFQ / 报价环节，给客户（贸易公司）留议价空间

### P0 自检清单（每次交付必跑）

- [ ] 全文 emoji 正则扫描结果为 **0**
- [ ] 无 `#7C3AED`/`#A855F7`/`#9333EA`/`#EC4899` 之间任何渐变
- [ ] 无 AI 模板味：无 Welcome to / Lorem ipsum / 抽象 Hero
- [ ] 硬编码颜色数 = 0（除 `#fff` / `#000`）
- [ ] 间距全为 4 的整数倍
- [ ] 图标库仅 Lucide，尺寸仅 16/20/24px，strokeWidth 1.5
- [ ] 每屏 `--accent` ≤ 2 处 / `--accent-metal` ≤ 2 处
- [ ] 对比度：`--fg` on `--bg` ≥ 16:1；`--muted` ≥ 5.6:1；`--metal-on` on `--accent-metal` ≥ 5.6:1（全部手工验算通过）
- [ ] 无 `cubic-bezier(0.68,...)` 弹跳缓动
- [ ] `@media (prefers-reduced-motion: reduce)` 块存在且覆盖全部 transition
- [ ] **无虚构数字**：页面上每个数字都能追溯到 PRD §6.2.1 客户已确认数据，否则已删除
- [ ] **量级 / 区间表述未被改写成精确数字或单点值**（`Hundreds of styles` / `MOQ 12-120 pcs` 保持原样）
- [ ] **无证书图形 / 徽标墙 / 实验室 logo / 报告下载直链**（客户当前零报告，AC-41）
- [ ] **无 `in-house` 及任何可证伪的产地 / 自有产能声称**（客户无工厂，Out-of-Scope 第 3 条）
- [ ] **卡片与 PDP 均显示参考价格区间 + MOQ**，且限定语 `Reference range — quoted per order` 可见
- [ ] **公共页无精确阶梯价表**（逐档固定单价），仅保留 `[Request the tiered price table →]` 入口
- [ ] **价格与 MOQ 同行成组**，tabular-nums 生效，整列小数点纵向对齐

---

## 15. 响应式与无障碍

### 15.1 断点与行为

| 断点 | 布局 | 关键行为 |
|---|---|---|
| `<640`（手机） | 4 列，单列 | 侧筛选改底部 sticky `[Filters]` → 全屏 sheet；无 List 视图；RFQ 改全屏上滑 sheet + 底部 sticky bar；Gallery 改全屏 swipe；节区间距 40px；gutter 12px |
| `≥640` | 单/双列 | RFQ 仍为 sheet |
| `≥768`（平板） | 8 列 | 筛选 sidebar 出现（可折叠为 drawer）；Gallery 与 Buy Panel 仍上下堆叠 |
| `≥1024` | 12 列 | PDP 转左右两栏 + Buy Panel sticky；RFQ 转右侧抽屉 420px；Grid 4 列 |
| `≥1280` | 完整 | Grid 5 列；container 1280（品牌层 1440）；节区间距 80px |

> **移动端独立的 CTA 要求：** 底部 sticky bar 常驻 `[n SKUs · total pcs | Submit RFQ]`，这是移动端转化第一抓手，不允许只在 Header 有入口。

### 15.2 无障碍硬指标

- 正文对比度 ≥ 4.5:1，大字 ≥ 3:1（本项目实际最低 4.9:1，见 §14 P0 清单）
- 所有交互元素键盘可达，Tab 顺序符合视觉顺序
- Drawer / Modal：`role="dialog"` + `aria-modal="true"` + focus trap + Esc 关闭 + 关闭后焦点归还原触发元素
- 所有 Lucide 图标：装饰性 `aria-hidden="true" focusable="false"`；表意性带 `<title>`
- 所有表单 `<label for>` 可见（**禁止只用 placeholder 当 label**）；错误 `aria-describedby` 关联到错误文案
- 数量步进器：`role="spinbutton"` + `aria-valuenow/min/max`
- 视图切换：`role="radiogroup"` + `aria-checked`
- 图片 alt：产品图 alt = `{Product name}, {material}, {finish}`（真实描述，不是 "product image"，也不是塞关键词）
- `prefers-reduced-motion` 全套归零（见 §9.3）
- 触摸目标 ≥44×44px，间距 ≥8px

---

## 16. 给前端 Agent 的实现注意（与设计开发交接）

1. **Token 消费方式**：`import tokens from './design-tokens.json'`，并通过 CSS 变量层消费。**禁止在组件里写死 hex。**
2. **图片组件必须封装**：一个 `<ProductImage>` 组件统一负责 `aspect-ratio` / `object-fit` / `--surface-warm` 底色 / `loading` / `srcset` / `fetchpriority` / LQIP。不要在每个页面重复拼这些属性。
3. **竖起来 80% 的界面由 10 个基础组件构成**：Button(4 变体 × 9 态) / Input / Stepper / Badge / Tag / Table / Card / Drawer / Sheet / Accordion。这 10 个做扎实了，页面就是拼装。
4. **Lucide 的接入方式按架构师锁定走 `astro-icon`**：`<Icon name="lucide:shopping-bag" />`，构建期把单个图标 path 内联进 HTML，**不产生运行时 JS、不产生额外请求**。**不要用 `lucide-react`**（需 React 运行时，会破坏「默认 0 KB JS」预算）。禁止手粘 SVG 源码、禁止全量 import、禁止引入第二个图标源。
5. **`tabular-nums` 是全局 CSS 声明**：在 `.price, .spec-value, .moq, .qty, td, th` 上加 `font-variant-numeric: tabular-nums`。这是 dense catalog 观感的分水岭。
6. **把 emoji / 渐变自检加进 CI**：建议在 CI 里加一条 `grep -P '[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]' src/` 的 lint，以及 `#([0-9a-fA-F]{3,6})` 在非 token 文件的扫描。
7. **性能预算**：图片最长边 ≤1200px；WebP/AVIF；首屏 <=3 张图片；中文字体不在英文路由加载；LCP < 2.5s / CLS < 0.1 / INP < 200ms。
8. **设计与实现不一致时**：由 Team Lead 找我 review，不要前端自行"改个颜色圆角"。
9. **`ShipToSelector` 不要渲染成禁用态下拉**。若暂不需要，直接不渲染；禁用态会被买家读成"还有其他语言/币种可选"。
10. **价格字符串自带币种**（`USD 1.29-3.40`）。不要另外做货币切换器，也不要在价格后补一个可点的币种 chip。
11. **合规标签走"四要素校验函数"再渲染**：`标准 + 机构 + 报告编号 + 测试日期`，缺一即落到降级文案 `Test reports issued per batch`。建议做成 `renderComplianceTag(data)` 单函数，避免各页面各写一份判断。
12. **目录工具栏不要加导出出口**（PRD 已判 P2），RFQ 抽屉里保留 `Paste SKU codes`（V1）/ `Upload a CSV`（P1，V1 不画）。

### 16.1 已锁定的技术栈与对设计的反向约束（来源：架构师 ARCHITECTURE.md）

| 层 | 选型 | 对设计执行的约束 |
|---|---|---|
| 渲染框架 | **Astro 7.3.5**（静态优先，默认 0 JS） | 所有首屏文案必须**静态 HTML 直出**，不得依赖 JS 执行才有内容。LCP 元素（Hero 实拍图）必须预置 `<img>` 尺寸属性，首屏首图**禁止** lazy。 |
| 样式 | **Tailwind CSS 4.3.3**（CSS-first 配置） | Token 经 `@theme` 注入，组件里只写 `bg-surface` / `text-fg` / `rounded-md` 等语义类；**禁止 `bg-[#F7F8F9]` 这类任意值**绕过 Token。 |
| 图标 | **astro-icon 1.2.0 + `@iconify-json/lucide` 1.2.138** | `<Icon name="lucide:xxx" />`；尺寸走 Tailwind `size-*`（16/20/24px），不在 `<Icon>` 上写死 `width`/`height`。每张交互图标配 `aria-hidden="true"` + `.sr-only` 文本。 |
| 客户端状态 | **Nanostores + `@nanostores/persistent` 1.3.5** | RFQ 篮 key 严格为 `rfq_v1`；ComplianceContext key 为 `compliance_v1`，默认值 `eu_uk`。跨标签页同步靠 `listen: true`。 |
| 检索 | **Pagefind 1.5.2**（extended 版，含 CJK 分词）+ SKU 双层索引 | 筛选 / 搜索须能**无 JS 降级**（URL query 驱动），否则 SEO 与首屏不可控。 |

**三条最关键、最容易踩的硬约束：**

1. **SSR / 预渲染阶段不得触碰 `window` / `localStorage`。** `persistentAtom` 在构建期读不到值，**首次渲染必须输出确定默认值**（RFQ 计数渲染 `0`，合规上下文渲染 `eu_uk`），水合后再更新。这是静态站 + 客户端持久化最常见的水合失配来源 —— 若在 SSR 阶段读 localStorage，首屏会闪错误数字，直接触发 CLS。
2. **中文字体只在 `/admin` 加载。** 前台英文路由产物**不得包含** HarmonyOS Sans SC / Noto Sans SC 字体文件，否则白给全球访客加几百 KB（PRD §6.5）。构建产物需有断言检查。
3. **交付图片最长边 ≤1200px**（架构侧 CI 门禁）。§6.4 的 1500px 是**拍摄与归档**要求，不是交付尺寸 —— 拍摄留余量，交付走构建期 sharp 压缩。设计稿评审时不要因为"图上看着不够锐"就要求提高交付分辨率。

---

## 17. 待确认清单（需要客户提供真实数据，不臆测）

| # | 事项 | 状态 | 影响的区块 / 落定写法 |
|---|---|---|---|
| 1 | 各产品线的**上新周期**（每周 / 每月 / 按季）；各线各自的 **SKU 分布**与**典型 MOQ 档位** | [待确认] | 首页 [3] Three Lines 数据点、产品线 Landing、Footer |
| 2 | **阶梯价档位**（每线的真实分档与折扣率） | [待确认] | PDP 参考阶梯区间表（≥3 档 × 每档区间）、卡片价格行。**未到位前按 §7.5 只显示限定语 `Reference range — quoted per order`，不写具体数字**（[已裁决]：价格与 MOQ 必显，但精确阶梯价表不上公共页） |
| 3 | **真实生产 / 发货交期**（按产品线区分） | [待确认] | PDP 购买面板、`/shipping-payment/`、首页 [4]。未到位前写 `Lead time quoted per order` |
| 4 | **可承诺的询价响应时间** | [待确认] | Utility Bar 时区串、RFQ 提交后、首页信任条。未到位前写 `Quoted by a person, not a bot` |
| 5 | **已具备的合规认证清单**与可公开下载的报告 PDF | **[已答复]**：暂无现成报告，客户承认后续可做 | 继续降级：合规页与 PDP **不得出现任何报告编号 / 机构 / 日期**，一律写 `On request — provided with your quotation`（PRD AC-38）。补做优先级见 PRD §5.5 |
| 6 | **覆盖的国家 / 地区数**、物流方式（DDP / FOB / EXW）、承运商 | [待确认] | 首页 [4]、`/shipping-payment/`、PDP。未到位前写 `Ships worldwide` |
| 7 | **样品政策**（是否收费、可否退、运费谁承担） | [待确认] | `/samples/`、PDP `Request a sample` |
| 8 | 品牌**中英文名 / Logo / 主张 slogan** | [待确认] | Header、Hero 文案、Footer |
| 9 | **可商用授权的产品摄影 / 模特图**（现有素材盘点） | **[已解锁]**：有几百款可商用实拍图，质量尚好 | §12[2] Hero 三竖切条、**§12[6] One Batch 模块**、三条产品线 Landing Hero **均按真图设计并上线**。前置待办：客户按 §6.4 口径做一轮「可用 / 需补拍 / 弃用」筛选 |
| 10 | **后台 / 内容运营是否需要中文界面** | **[已裁决]**：需要中文后台 | 前台仍只英文。HarmonyOS Sans SC **只在 `/admin` 加载**，前台 bundle 不得包含（PRD §6.5） |
| 11 | **货币切换是否进 V1** | **[已裁决]**：不进 V1 | 全站只标 USD，一律写作 `USD 3.80-4.60`；币种是价格串的一部分，不是可切换控件。**禁用态下拉也不渲染**（PRD Out-of-Scope 第 12 条） |
| 12 | **前台语言切换器** | **[已裁决]**：不做 | V1 只做英文站。UI 上不出现语言选择器，禁用态同样不渲染（PRD Out-of-Scope 第 13 条） |

> **红线（不随数据到位而松动）**：上表标 [待确认] 的项，在拿到客户真实数字前，**任何页面禁止写入具体数字**，一律采用 PRD §6.2 降级写法对照表。宁可写结构性文案，不可虚标 —— 这是「Spec-First」定位的立身之本。

---

## 附录 A：真实语境英文文案库（可直接用，非占位）

> 以下文案全部是饰品外贸真实语境，无空洞修饰词。数字部分仍需按 §17 替换。

**Hero（采用 PRD §13.1 官方定稿文案，不再自造）**
- H1: `Three product lines. Verified specs on every SKU.`
- Line 2: `Fashion alloy & brass · Stainless & titanium steel · Natural stone, lab gemstone & pearl`
- Line 3: `We are a sourcing partner, not a factory owner. Here is exactly how we control quality instead.`
- 已确认数据补入（可选，接在 Line 3 之后）：`Hundreds of styles · MOQ 12-120 pcs, stated per style`
- CTA: `Browse the catalog` / `Start an RFQ`

> [注意] 早期草稿的 `Three jewelry lines, one sourcing desk.` 已作废，以 PRD §13.1 为准。
>       同理，Hero 与卡片**不写具体单价**（如 `From USD 0.38/pc`）—— 价格档位仍待客户确认，
>       公共页统一降级为 `Reference range — quoted per order`。

**产品线标语**
- 合金/铜饰：`Breadth and speed. New drops weekly, priced for volume.`
- 不锈钢/钛钢：`Waterproof, non-tarnish, PVD-plated. Built for everyday wear in the EU and US.`
- 天然石/宝石/珍珠：`No two stones are identical. We photograph the lot you are buying, not a sample shot.`

**信任条（V1 现行版 —— 可直接用）**

```
[rule]         MOQ 12-120 PCS, STATED PER STYLE
[package-search] SAMPLE BEFORE BULK
[file-check]     TEST REPORTS ISSUED PER BATCH
[clock]          QUOTED BY A PERSON, NOT A BOT
[globe]          SHIPS WORLDWIDE
```

| 项 | 状态 | 说明 |
|---|---|---|
| `MOQ 12-120 pcs, stated per style` | **已升级** | PRD §6.2.1 客户确认。区间表述，**禁止压缩成 `MOQ from 12 pcs`** |
| `Sample before bulk` | 能力表述 | 不涉及数字，可直接用 |
| `Test reports issued per batch` | 降级（AC-38） | 暂无报告。**禁止**写成 `REACH and CPSC reports available` —— 那是对全站货盘的一刀切合格声明，与 AC-18 冲突 |
| `Quoted by a person, not a bot` | 降级 | 可承诺响应时长未确认。**禁止**写 `Quote within one business day` |
| `Ships worldwide` | 降级 | 覆盖国家数未确认。**禁止**写 `Ships to 60+ markets` |

> 含具体数字的写法（阶梯价、交期、响应时长、覆盖国家数）**在客户数据到位前一律不进文案库**，仅保留在 §17 待确认清单里作为「数据到位后的升级目标」。

**价格与 MOQ（[已裁决] P0 必显，卡片与 PDP 通用）**

| 位置 | 文案 |
|---|---|
| 卡片价格行 | `USD 3.80-4.60 / pc` |
| 卡片 MOQ | `MOQ 24 pcs` |
| 卡片限定语（可见） | `Reference range — quoted per order` |
| List 视图表头 | `Reference price / pc` |
| PDP 价格块标题 | `Reference Price` |
| PDP 引导入口 | `Request the tiered price table` |

- **公共页只到「参考区间」为止**，逐档固定单价不渲染（给客户留议价空间）
- 币种恒写作 3 字母 `USD`，是价格串的一部分 —— 既是「不做货币切换器」的落地方式，
  也是整列小数点纵向对齐的前提（配合 `tabular-nums`）
- 限定语**必须可见**，不得收进 tooltip —— 它是价格性质的法律声明，不是辅助说明

**RFQ 空状态**
`Your RFQ list is empty. Start one of two ways —`
→ `Browse a product line` / `Paste SKU codes`（V1 只做这两个入口）
→ `Upload a CSV`：**P1 预留，V1 不画**（PM 裁决：需先有 CSV 模板页与解析失败边界，先用纯文本粘贴验证需求真实性）

**RFQ 提交后**
`Received. Your enquiry is queued for a named account manager.`（无数字版，直接可用）
`RFQ #RF-2481 received. We reply within one business day (Asia/Shanghai).`（有响应时间承诺后的升级版）

**`/sourcing-partners/` 页诚实的开场（关键 —— 这是无工厂方唯一该说的话）**
`We do not own a factory. We work with eleven workshops we have bought from since 2019, and we inspect every lot twice before it ships. What we sell is specification accuracy and reply speed.`
[注意] `eleven workshops` / `since 2019` / `every lot twice` 都是待客户的真实数据替换（§17 第 8 项的同链条内容），
拿到真实数据前不能上线。句式本身可以直接用：承认不拥有工厂 + 说明怎么控质量 + 声明卖点是什么。

**表单 placeholder**
`e.g. Need custom packaging, FOB Shenzhen, nickel-free required`

**合规表述示例（对齐 PRD §5.4 / AC-38~AC-40）**
- 卡片/PDP 合规行分两类品类渲染，**限值不同**：
  - 长期接触皮肤类（项链/手链/戒指/耳夹）：`EN 1811 + EN 12472 · <机构> · Report #<编号> · <YYYY-MM>`
  - **穿刺 / 耳针类：限值为 ≤0.2 µg/cm²/week**（不是 0.5，PRD AC-40）
- 无报告时的统一降级文案：`Test reports issued per batch — provided with your quotation`
- Compliance 子专题导语：`Most suppliers test the base metal. EN 12472 requires simulating wear first, then testing what actually touches skin. That is where thin plating fails.`

---

## 附录 B：与 PM 的 `docs/PRD.md` 对齐情况（供 Team Lead 审阅）

| 项 | PRD 结论 | 本文档处理 | 状态 |
|---|---|---|---|
| V1 只做英文站、全站美式拼写 `jewelry` | §5.3 | §11 全部路由与文案统一英文；前台不做语言切换（已写进 §14 Do 第 12 条） | 已对齐 |
| 路由结构 | §12.3 | §11 页面清单全部改用 PRD 路由（`/product-lines/*`、`/products/`、`/sourcing-partners/`、`/samples/`、`/shipping-payment/`、`/compliance/nickel-release-en-1811/`、`/blog/`） | 已对齐 |
| 样品政策 / 物流付款拆两页 | §12.3 | 拆成 #11 `/samples/` 与 #12 `/shipping-payment/` 两张 Landing | 已对齐 |
| Ship-to / Compliance-for 全站选择器 | §5.3 P0 | §11 定义为全站 `ComplianceContext`；§12[0] Utility Bar、§13 PDP 购买面板、§7.4 筛选侧栏三处均已画出 | 已对齐 |
| 「规格可验证」是差异化核心 | §4.1 | §13 PDP 定义 Specifications 八字段最小集；§1.3 把"规格表"列为目录骨架的一部分 | 已对齐 |
| 禁止"工厂实力"叙事 | §1 / §13.6 | §11 #8 明确改为 `Sourcing partners & QC`；§8 首段注释"不借图库车间图" | 已对齐 |
| 区域 Landing（中东 / 欧洲）是 P1 | §5.3 | §11 列为 16/17 号 P1 预留，V1 由 Ship-to 选择器与合规子专题先接住 | 已对齐 |
| 产品线分类导航 F1 | §8.1 | §12[2] 三竖切条 Hero + §12[3] Bento 承接；`/product-lines/*` 三页 | 已对齐 |
| RFQ 询价篮 F3 | §8.3 | §8 完整给出三层交互 + 6 态 | 已对齐 |
| 内容红线（禁用词） | §13.6 | §14 Don't 第 4 条 + 附录 A 真实文案库覆盖 | 已对齐 |

**两个待决问题 —— 已由 PM 裁决（2026-10-01）：**

| # | 问题 | 裁决 | 本文档落点 |
|---|---|---|---|
| 1 | 货币切换是否进 V1 | **不进 V1，V1 只 USD**。价格一律把币种写进价格串本身（`USD 3.80-4.60`），不做独立切换器 | §12[0] Utility Bar 已删除 `EN ▾ USD ▾`；§7.1 价格项加硬性规则；§14 Do 第 12/13 条；§16 第 10 条 |
| 2 | SKU 清单导入导出 | **输入侧做，输出侧不做**：①`Paste SKU codes` 进 V1（编号 F3-a，RICE 6.4）②`Upload a CSV` 降 P1，V1 不画 ③**导出（CSV/PDF）进 P2，V1 不加工具栏 download 出口**（编号 F21，RICE 0.5） | §8.3 RFQ 空状态已改为两个入口；§7.4 明确不加导出；§14 Do 第 16 条；§16 第 12 条 |

**PM 裁决带来的两处文案修正（已落地）：**
1. `REACH and CPSC reports available` → `Test reports issued per batch`（前者是对全站货盘的一刀切合格声明，与 PRD AC-18 冲突）
2. 合规标签**四要素齐全才渲染**：`测试标准 + 出具机构 + 报告编号 + 测试日期`，缺任一即降级；且**穿刺 / 耳针类镍释放限值为 0.2 µg/cm²/week，非 0.5**（PRD AC-39 / AC-40）
3. 首页 §12[4] Trust Band 的 `REACH & CPSC REPORTS` 项**在报告到位前删除**，不留硬承诺

**客户真实数据答复（PRD §6.2.1，2026-10-01）—— 本文档的落点：**

| 客户答复 | 对设计的解锁 | 落点 |
|---|---|---|
| 产品图：有几百款可商用实拍图，质量尚好 | **解锁唯一 P0 硬卡点**（§17 第 9 项） | §12[2] Hero 三竖切条、§12[6] One Batch 模块、三条产品线 Landing Hero **定稿上线**；新增 §6.4 图片筛选口径（客户待办） |
| 检测报告：暂无现成报告，承认后续可做 | **不解锁**，继续降级 | §12[9] 合规预览由「证书墙」改为「教育式三卡」；PDP 规格行的 Nickel / Lead 渲染规则钉死（AC-38 / AC-39 / AC-40） |
| SKU 规模：数百款 | 可写**量级**表述 | §12[2] Hero 用 `Hundreds of styles`；§12[3] 数据点用 `Catalogue depth varies by line` |
| MOQ：按款 12–120 件 | 可写**区间**表述 | §12[2] Hero、§12[4] Trust Band 第 1 项、§13 PDP 购买面板一律写作 `MOQ 12-120 pcs, stated per style`；单款页可填该款具体值 |
| 后台：需要中文后台 | 影响字体加载，不影响前台 | §16.1 第 2 条：中文字体只在 `/admin` 加载，前台 bundle 不得包含 |

> **仍未确认、继续走降级的项**：阶梯价档位、真实交期、可承诺响应时长、覆盖国家 / 地区数、物流方式与承运商、样品政策、品牌名与 Logo、合作产线数量与年限。明细见 §17。

---

## 附录 C：文档版本


| 版本 | 日期 | 变更 |
|---|---|---|
| v0.5 | 2026-10-01 | 落实 Team Lead 两项裁决与一项交办：① **i18n 冲突结案** —— 采纳无前缀英文路由，ADR-004 由架构师重写，§11 页面清单不动；② **新增 §7.5「价格 + MOQ 组合块的视觉承重」** —— 卡片与 PDP 必显参考价格区间（`USD 3.80-4.60 / pc`）+ MOQ（`MOQ 24 pcs`），限定语 `Reference range — quoted per order` 可见，精确阶梯价表不上公共页（驳回架构师"完全不标价"方案，依据 PM 调研硬证据）；③ **新增 §13.1「Specifications 八字段版式骨架」** —— 结构已知、值待填，客户数字到位即可直接灌，不依赖 §17 待确认项。同步修正附录 A 的 Hero 文案（改用 PRD §13.1 官方定稿）。 |
| v0.4 | 2026-10-01 | 落实客户真实数据答复（PRD §6.2.1）：① **§17 第 9 项产品摄影硬卡点解锁** —— 客户有几百款可商用实拍图，§12[2] Hero 三竖切条与 §12[6] One Batch 模块**定稿上线**；② 新增 §6.4 图片交付筛选口径（客户待办）；③ 修正 Hero 草图中的虚构数字 —— `1,240 SKUs` 等改为客户已确认的量级/区间表述 `Hundreds of styles` / `MOQ 12-120 pcs, stated per style`，并撤除未确认的具体单价；④ §12[9] 合规预览**由证书墙改为教育式三卡**（客户零报告，AC-41）；⑤ §16 对齐架构师锁定技术栈（Astro 7.3.5 / Tailwind 4.3.3 / astro-icon），修正原「用 lucide-react」的错误指引；⑥ §17 清单重排为「待确认 / 已答复 / 已裁决」三态。 |
| v0.3 | 2026-10-01 | 落实 PM 三项裁决：① 删除 Utility Bar 的 `EN ▾ USD ▾` 下拉，**禁用态也不渲染**；② 价格串自带币种（`USD 3.80-4.60`），不做货币切换器；③ RFQ 导入导出分开处理（粘贴 SKU 进 V1，上传 CSV 降 P1，导出进 P2 且工具栏不加出口）。同时修正合规文案：去掉一刀切合格声明、补四要素渲染规则、区分穿刺类 0.2 限值。 |
| v0.2 | 2026-10-01 | 与 PM 的 `docs/PRD.md` 对齐：全部路由改用 PRD 方案；页面清单 13→15 + 2 个 P1 预留；新增 `ShipToSelector` / ComplianceContext 组件定义与首页/PDP 两处落点；新增附录 B（PRD 对齐表 + 2 个待决问题）。 |
| v0.1 | 2026-10-01 | Phase 1 设计调研与方向初稿。锁定：Lucide 图标库、Archivo/Public Sans/JetBrains Mono/HarmonyOS Sans SC 字体、冷调浅底 + 深墨玉 `#123A38` + 氧化黄铜 `#7D6330` 配色、混合寄存器策略。Token 为草案，待 Phase 2 确认后转正式 DESIGN.md + MASTER.md。 |
