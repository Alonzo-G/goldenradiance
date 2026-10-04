# 1688 批次素材清单

> 源目录 `D:\AAAAAAA外贸资料\饰品\产品(1)`　|　生成时间 2026-10-02　|　**产品粒度 = SKU（颜色变体）**
> 供应商：东莞市骏娅饰品有限公司、义乌市空屿饰品有限公司

> 本文由 `scripts/report-1688-sku.mjs` 从 `catalog-1688-sku.json` 生成，**请勿手改**。

## 一、总览

| 项 | 数量 |
|----|------|
| 扫描到的商品链接 | 52 |
| **已发布产品** | **41**（SKU 级 34 + 款式级 7） |
| 发布图片 | 44 |
| 扣住候选 | 65 |
| 已读出的尺寸/克重实测数据 | 3（源链接整体未发布，数据仅作内部留档） |

### 粒度口径（关键）

产品粒度取 **SKU（颜色变体）**，不取商品链接。同一链接下的每个颜色变体独立成一条产品，
SKU 编码 `RA-{品类码}-{链接号}{变体号}` 可回溯到 1688 offerId；款式族以 `styleFamily` 记录，不作为产品层。
链接下无可用 SKU 图时，降级为一条**款式级**条目并在 §五 标出。

### 筛选口径

- 每个通过审核的颜色变体独立成一条产品；SKU 编码 = RA-{品类}-{链接号}{变体号}，可回溯到 1688 offerId。
- 颜色名为依据图片判读的结果，**不是供应商官方 SKU 属性名**（目录导出未含 SKU 属性表），须客户核对。
- 所有面向站点的文案必须经 baseEn() 转成英文——中文基材直接入文案会把汉字带进英文站产物。
- 尺寸/重量标注图只作数据源；图上 0.xx 为盎司不是美元，但仍不作为商品图发布。
- 产品线归属必须有标题明示基材；S925 银不在现有三条线内，记 LINE_TAXONOMY_GAP。
- 价格/MOQ/材质牌号/镀层厚度一律留空。

### 方法

- `scripts/inventory-1688.mjs` —— 解析 `_URL.txt` 与中文标题，抽取品类 / 材质 / 风格 / 主题 / 色系关键词
- `scripts/skin-filter.mjs` —— **肤色占比**批量剔除真人佩戴照（RGB 肤色区间 + 色相 5°–52° + 饱和度 <0.62）
- `scripts/candidates-1688.mjs` —— 按确定顺序输出候选拼版，人工只判定「干不干净」
- `scripts/build-catalog-sku.mjs` —— 候选判定 → SKU 级台账，含基材英译闸门 `baseEn()`
- `scripts/ingest-1688-sku.mjs` —— 出 WebP + 写 `src/content/products/*.md`，并撤回被取代的链接级产品

### 已知陷阱

- **拼版缩略图上的标签读数不可靠**。曾据此把一款实为模特照的主图判成白底影棚图，肤色检测推翻了该判断。产品归属一律以**文件路径**为准，不靠肉眼辨认拼版标签；拼版只用于判断干不干净。
- 中文基材必须经 `baseEn()` 转英文后才允许入文案。曾因直接把「不锈钢」写进 `short_description` 造成 34 页汉字外泄，闸门即为此设：映射缺失则整条不外发。
- 撤回链接级产品时不能只按 slug 判归属（款式级回退会复用旧 slug），须按批次清单判定，否则留下无主图片目录。

## 二、已发布产品

| SKU | 英文标题 | 品类 | 产品线 | 粒度 | 图 | 源链接 |
|----|----------|------|--------|------|----|--------|
| RA-B-0506 | Silver-Tone Heart Zircon Link Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1014151915792](https://detail.1688.com/offer/1014151915792.html) |
| RA-B-112 | Five-Clover Bracelet | bracelet | stainless-titanium-steel | 款式 | 2 | [601257629759](https://detail.1688.com/offer/601257629759.html) |
| RA-B-1403 | Emerald Six Flower Paved Bracelet (Variant 03) | bracelet | stainless-titanium-steel | SKU | 1 | [1057118037330](https://detail.1688.com/offer/1057118037330.html) |
| RA-B-1404 | Emerald Six Flower Paved Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1057118037330](https://detail.1688.com/offer/1057118037330.html) |
| RA-B-1406 | Emerald Six Flower Paved Bracelet (Variant 06) | bracelet | stainless-titanium-steel | SKU | 1 | [1057118037330](https://detail.1688.com/offer/1057118037330.html) |
| RA-B-1701 | Wine Chunky Chain Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1056732738890](https://detail.1688.com/offer/1056732738890.html) |
| RA-B-1704 | Gold-Tone Chunky Chain Bracelet (Variant 04) | bracelet | stainless-titanium-steel | SKU | 1 | [1056732738890](https://detail.1688.com/offer/1056732738890.html) |
| RA-B-1705 | Silver-Tone Chunky Chain Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1056732738890](https://detail.1688.com/offer/1056732738890.html) |
| RA-B-1706 | Multi-Colour Chunky Chain Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1056732738890](https://detail.1688.com/offer/1056732738890.html) |
| RA-B-1708 | Gold-Tone Chunky Chain Bracelet (Variant 08) | bracelet | stainless-titanium-steel | SKU | 1 | [1056732738890](https://detail.1688.com/offer/1056732738890.html) |
| RA-B-1709 | Gold-Tone Chunky Chain Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1056732738890](https://detail.1688.com/offer/1056732738890.html) |
| RA-B-1710 | Gold-Tone Chunky Chain Bracelet (Variant 10) | bracelet | stainless-titanium-steel | SKU | 1 | [1056732738890](https://detail.1688.com/offer/1056732738890.html) |
| RA-B-3516 | Silver-Tone Heart Zircon Tennis Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1012708332205](https://detail.1688.com/offer/1012708332205.html) |
| RA-B-3517 | Silver-Tone Heart Zircon Tennis Bracelet (Variant 17) | bracelet | stainless-titanium-steel | SKU | 1 | [1012708332205](https://detail.1688.com/offer/1012708332205.html) |
| RA-B-3518 | Silver-Tone Heart Zircon Tennis Bracelet (Variant 18) | bracelet | stainless-titanium-steel | SKU | 1 | [1012708332205](https://detail.1688.com/offer/1012708332205.html) |
| RA-B-3520 | Gold-Tone Heart Zircon Tennis Bracelet | bracelet | stainless-titanium-steel | SKU | 1 | [1012708332205](https://detail.1688.com/offer/1012708332205.html) |
| RA-E-2605 | Gold-Tone Textured Clover Stud Earrings | earrings | stainless-titanium-steel | SKU | 1 | [975939071429](https://detail.1688.com/offer/975939071429.html) |
| RA-N-0401 | Gold-Tone Zircon Leaf Pendant Necklace (Variant 01) | necklace | stainless-titanium-steel | SKU | 1 | [1010121080773](https://detail.1688.com/offer/1010121080773.html) |
| RA-N-0402 | Gold-Tone Zircon Leaf Pendant Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1010121080773](https://detail.1688.com/offer/1010121080773.html) |
| RA-N-101 | White Zircon Square Pendant Necklace | necklace | stainless-titanium-steel | 款式 | 1 | [831029923232](https://detail.1688.com/offer/831029923232.html) |
| RA-N-104 | Butterfly Tassel Pendant Necklace | necklace | stainless-titanium-steel | 款式 | 2 | [829910594261](https://detail.1688.com/offer/829910594261.html) |
| RA-N-108 | Two-Face Clover Pendant Necklace | necklace | stainless-titanium-steel | 款式 | 1 | [793981197471](https://detail.1688.com/offer/793981197471.html) |
| RA-N-109 | Shell Butterfly Pendant Necklace | necklace | stainless-titanium-steel | 款式 | 2 | [833705936284](https://detail.1688.com/offer/833705936284.html) |
| RA-N-114 | Black Round Pendant Necklace | necklace | stainless-titanium-steel | 款式 | 1 | [724392151093](https://detail.1688.com/offer/724392151093.html) |
| RA-N-117 | Pavé Clover Pendant Necklace | necklace | stainless-titanium-steel | 款式 | 1 | [672681508520](https://detail.1688.com/offer/672681508520.html) |
| RA-N-1502 | Silver-Tone Open Ring and Bar Letter Pendant Necklace | necklace | stainless-titanium-steel | SKU | 1 | [613958313968](https://detail.1688.com/offer/613958313968.html) |
| RA-N-2103 | Silver-Tone Six Stone Disc Pendant Necklace | necklace | stainless-titanium-steel | SKU | 1 | [975288015907](https://detail.1688.com/offer/975288015907.html) |
| RA-N-2301 | Burgundy Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2302 | Coffee-Brown Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2303 | Jet-Black Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2304 | Emerald Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2305 | Steel-Blue Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2306 | Purple Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2307 | Olive Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2308 | Tan Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2309 | Rose-Red Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2310 | Orange Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2311 | Tan Beaded Y Necklace (Variant 11) | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-2312 | Champagne Beaded Y Necklace | necklace | stainless-titanium-steel | SKU | 1 | [1055528081583](https://detail.1688.com/offer/1055528081583.html) |
| RA-N-3103 | Silver-Tone Black Ceramic Bead Necklace | necklace | stainless-titanium-steel | SKU | 1 | [975878746905](https://detail.1688.com/offer/975878746905.html) |
| RA-N-3702 | Rose-Gold Square Plate Snake Chain Necklace | necklace | stainless-titanium-steel | SKU | 1 | [729631868541](https://detail.1688.com/offer/729631868541.html) |

分布：品类 bracelet 16 / earrings 1 / necklace 24；产品线 stainless-titanium-steel 41。

### 原始中文标题对照

| SKU | 原始中文标题 | 英文标题 |
|----|--------------|----------|
| RA-B-0506 | 超闪几何爱心锆石拼接手链女欧美跨境气质不锈钢饰品现货批发 | Silver-Tone Heart Zircon Link Bracelet |
| RA-B-112 | 日韩时尚钛钢四叶草五花手链女幸运草亚克力18K玫瑰金手链手环 | Five-Clover Bracelet |
| RA-B-1403 | 跨境新款欧美热销不锈钢手链镀18K金六花立体满钻手链女钛钢饰品 | Emerald Six Flower Paved Bracelet (Variant 03) |
| RA-B-1404 | 跨境新款欧美热销不锈钢手链镀18K金六花立体满钻手链女钛钢饰品 | Emerald Six Flower Paved Bracelet |
| RA-B-1406 | 跨境新款欧美热销不锈钢手链镀18K金六花立体满钻手链女钛钢饰品 | Emerald Six Flower Paved Bracelet (Variant 06) |
| RA-B-1701 | 欧美跨境粗链钛钢手轻奢小众高级感手饰18K金情侣首饰 厂家直批 | Wine Chunky Chain Bracelet |
| RA-B-1704 | 欧美跨境粗链钛钢手轻奢小众高级感手饰18K金情侣首饰 厂家直批 | Gold-Tone Chunky Chain Bracelet (Variant 04) |
| RA-B-1705 | 欧美跨境粗链钛钢手轻奢小众高级感手饰18K金情侣首饰 厂家直批 | Silver-Tone Chunky Chain Bracelet |
| RA-B-1706 | 欧美跨境粗链钛钢手轻奢小众高级感手饰18K金情侣首饰 厂家直批 | Multi-Colour Chunky Chain Bracelet |
| RA-B-1708 | 欧美跨境粗链钛钢手轻奢小众高级感手饰18K金情侣首饰 厂家直批 | Gold-Tone Chunky Chain Bracelet (Variant 08) |
| RA-B-1709 | 欧美跨境粗链钛钢手轻奢小众高级感手饰18K金情侣首饰 厂家直批 | Gold-Tone Chunky Chain Bracelet |
| RA-B-1710 | 欧美跨境粗链钛钢手轻奢小众高级感手饰18K金情侣首饰 厂家直批 | Gold-Tone Chunky Chain Bracelet (Variant 10) |
| RA-B-3516 | 新款欧美方形几何爱心锆石不锈钢时尚潮人满钻项链 厂家直批 | Silver-Tone Heart Zircon Tennis Bracelet |
| RA-B-3517 | 新款欧美方形几何爱心锆石不锈钢时尚潮人满钻项链 厂家直批 | Silver-Tone Heart Zircon Tennis Bracelet (Variant 17) |
| RA-B-3518 | 新款欧美方形几何爱心锆石不锈钢时尚潮人满钻项链 厂家直批 | Silver-Tone Heart Zircon Tennis Bracelet (Variant 18) |
| RA-B-3520 | 新款欧美方形几何爱心锆石不锈钢时尚潮人满钻项链 厂家直批 | Gold-Tone Heart Zircon Tennis Bracelet |
| RA-E-2605 | 时尚百搭镭射四叶花套装钛钢项链女网红气质高级感锁骨链手链耳钉 | Gold-Tone Textured Clover Stud Earrings |
| RA-N-0401 | 不锈钢欧美锆石树叶项链多肥胺波西 | Gold-Tone Zircon Leaf Pendant Necklace (Variant 01) |
| RA-N-0402 | 不锈钢欧美锆石树叶项链多肥胺波西 | Gold-Tone Zircon Leaf Pendant Necklace |
| RA-N-101 | 不锈钢白色方糖项链小众设计师款项链可滑动锆石吊坠 厂家直批 | White Zircon Square Pendant Necklace |
| RA-N-104 | 法式轻奢蝴蝶流苏钛钢项链女百搭高级感18K金锁骨链 厂家直批 | Butterfly Tassel Pendant Necklace |
| RA-N-108 | 欧美跨境热销钛钢双面四叶草项链女时尚轻奢一款两戴幸运草锁骨链 | Two-Face Clover Pendant Necklace |
| RA-N-109 | 欧美跨境时尚新款白贝蝴蝶吊坠项链个性百搭锁骨链不锈钢设计饰品 | Shell Butterfly Pendant Necklace |
| RA-N-114 | 钛钢项链别针罗马数字黑白卫衣新款小众轻奢高级感18K锁骨毛衣链 | Black Round Pendant Necklace |
| RA-N-117 | 新款钛钢项链女满钻心形一款多戴磁铁爱心四叶花项链 厂家直批 | Pavé Clover Pendant Necklace |
| RA-N-1502 | 罗马双环项链轻奢小众锁骨链设计数字吊坠颈链钛钢项链 厂家直批 | Silver-Tone Open Ring and Bar Letter Pendant Necklace |
| RA-N-2103 | 欧美轻奢六钻大饼项链女小众高级感时尚百搭钛钢不掉色锁骨链饰品 | Silver-Tone Six Stone Disc Pendant Necklace |
| RA-N-2301 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Burgundy Beaded Y Necklace |
| RA-N-2302 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Coffee-Brown Beaded Y Necklace |
| RA-N-2303 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Jet-Black Beaded Y Necklace |
| RA-N-2304 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Emerald Beaded Y Necklace |
| RA-N-2305 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Steel-Blue Beaded Y Necklace |
| RA-N-2306 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Purple Beaded Y Necklace |
| RA-N-2307 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Olive Beaded Y Necklace |
| RA-N-2308 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Tan Beaded Y Necklace |
| RA-N-2309 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Rose-Red Beaded Y Necklace |
| RA-N-2310 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Orange Beaded Y Necklace |
| RA-N-2311 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Tan Beaded Y Necklace (Variant 11) |
| RA-N-2312 | 欧美时尚花朵不锈钢项链轻奢高级感Y型项链镀18K金百搭饰品批发 | Champagne Beaded Y Necklace |
| RA-N-3103 | 钛钢项链女小蛮腰黑陶瓷项链毛衣链高级感长款配饰吊坠女锁骨链 | Silver-Tone Black Ceramic Bead Necklace |
| RA-N-3702 | LOVE方块蛇骨项链2023年新款复古小众设计高级手饰钛钢 厂家直批 | Rose-Gold Square Plate Snake Chain Necklace |

## 三、扣住候选

### NO_BASE_MATERIAL —— 53 格

> 标题未声明基材（不锈钢 / 钛钢 / 合金），无法判定产品线归属，按不编造原则扣住。

| 位号 | offerId | 供应商 | 源图 |
|------|---------|--------|------|
| 骏娅:P15 | [831675167269](https://detail.1688.com/offer/831675167269.html) | 骏娅 | SKU 属性图_03.jpg |
| 骏娅:P16 | [831675167269](https://detail.1688.com/offer/831675167269.html) | 骏娅 | SKU 属性图_04.jpg |
| 骏娅:P21 | [1069640007246](https://detail.1688.com/offer/1069640007246.html) | 骏娅 | SKU 属性图_03.jpg |
| 骏娅:P22 | [1069640007246](https://detail.1688.com/offer/1069640007246.html) | 骏娅 | SKU 属性图_06.jpg |
| 骏娅:P23 | [1069640007246](https://detail.1688.com/offer/1069640007246.html) | 骏娅 | SKU 属性图_09.jpg |
| 骏娅:P24 | [1069640007246](https://detail.1688.com/offer/1069640007246.html) | 骏娅 | SKU 属性图_08.jpg |
| 空屿:P00 | [1076493585997](https://detail.1688.com/offer/1076493585997.html) | 义乌市空屿饰品有限公司 | SKU 属性图_01.jpg |
| 空屿:P01 | [1076493585997](https://detail.1688.com/offer/1076493585997.html) | 义乌市空屿饰品有限公司 | SKU 属性图_03.jpg |
| 空屿:P02 | [1076493585997](https://detail.1688.com/offer/1076493585997.html) | 义乌市空屿饰品有限公司 | SKU 属性图_21.jpg |
| 空屿:P06 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_01.jpg |
| 空屿:P07 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_05.jpg |
| 空屿:P08 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_09.jpg |
| 空屿:P09 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_12.jpg |
| 空屿:P10 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_20.jpg |
| 空屿:P11 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_21.jpg |
| 空屿:P12 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_22.jpg |
| 空屿:P13 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_33.jpg |
| 空屿:P14 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_36.jpg |
| 空屿:P15 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_41.jpg |
| 空屿:P16 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_52.jpg |
| 空屿:P17 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_55.jpg |
| 空屿:P18 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_03.jpg |
| 空屿:P19 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_04.jpg |
| 空屿:P20 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_08.jpg |
| 空屿:P21 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_53.jpg |
| 空屿:P22 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_10.jpg |
| 空屿:P23 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_15.jpg |
| 空屿:P24 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_32.jpg |
| 空屿:P25 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_38.jpg |
| 空屿:P26 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_13.jpg |
| 空屿:P27 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_31.jpg |
| 空屿:P28 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_02.jpg |
| 空屿:P29 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_16.jpg |
| 空屿:P30 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_48.jpg |
| 空屿:P31 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_07.jpg |
| 空屿:P32 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_40.jpg |
| 空屿:P33 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_35.jpg |
| 空屿:P34 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_50.jpg |
| 空屿:P35 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_54.jpg |
| 空屿:P36 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_06.jpg |
| 空屿:P37 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_49.jpg |
| 空屿:P38 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_14.jpg |
| 空屿:P39 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_42.jpg |
| 空屿:P40 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_37.jpg |
| 空屿:P41 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_28.jpg |
| 空屿:P42 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_19.jpg |
| 空屿:P43 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_25.jpg |
| 空屿:P44 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_27.jpg |
| 空屿:P45 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_46.jpg |
| 空屿:P46 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_26.jpg |
| 空屿:P47 | [890256254975](https://detail.1688.com/offer/890256254975.html) | 义乌市空屿饰品有限公司 | SKU 属性图_11.jpg |
| 空屿:P123 | [822882810086](https://detail.1688.com/offer/822882810086.html) | 义乌市空屿饰品有限公司 | SKU 属性图_16.jpg |
| 空屿:P129 | [822882810086](https://detail.1688.com/offer/822882810086.html) | 义乌市空屿饰品有限公司 | SKU 属性图_81.jpg |

### TEXT —— 12 格

> 图上叠加供应商中文水印（「东莞市骏娅饰品有限公司」），去字后不可用。

| 位号 | offerId | 供应商 | 源图 |
|------|---------|--------|------|
| 骏娅:P03 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_06.jpg |
| 骏娅:P04 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_05.jpg |
| 骏娅:P05 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_11.jpg |
| 骏娅:P06 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_10.jpg |
| 骏娅:P07 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_01.jpg |
| 骏娅:P08 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_04.jpg |
| 骏娅:P09 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_09.jpg |
| 骏娅:P10 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_08.jpg |
| 骏娅:P11 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_02.jpg |
| 骏娅:P12 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_07.jpg |
| 骏娅:P13 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_03.jpg |
| 骏娅:P14 | [771710194959](https://detail.1688.com/offer/771710194959.html) | 骏娅 | SKU 属性图_12.jpg |

## 四、已读出的尺寸 / 克重实测

来源为供应商 SKU 属性图上的**英文尺寸标注图**（保留原图，不作为商品图发布）。
所属链接（空屿 listing 39）因标题未声明基材整条扣住，故这些数据**未挂到任何已发布产品上**，仅作内部留档。

| 位号 | 品类 | 克重 | 尺寸 | 原始数据串 |
|------|------|------|------|------------|
| 空屿:P03 | earrings | 5.46 g/pair | 9.7cm x 4.3cm | `weight=5.46/pair;dims=9.7cm x 4.3cm` |
| 空屿:P04 | earrings | 3.75 g/pair | 0.9cm x 4.2cm | `weight=3.75/pair;dims=0.9cm x 4.2cm` |
| 空屿:P05 | earrings | 7.7 g/pair | 1.2cm x 4.2cm | `weight=7.7/pair;dims=1.2cm x 4.2cm` |

## 五、待客户确认

### 5.1 同款式同色变体差异

- **RA-B-1403 Emerald Six Flower Paved Bracelet (Variant 03)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-B-1406 Emerald Six Flower Paved Bracelet (Variant 06)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-B-1704 Gold-Tone Chunky Chain Bracelet (Variant 04)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-B-1708 Gold-Tone Chunky Chain Bracelet (Variant 08)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-B-1710 Gold-Tone Chunky Chain Bracelet (Variant 10)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-B-3517 Silver-Tone Heart Zircon Tennis Bracelet (Variant 17)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-B-3518 Silver-Tone Heart Zircon Tennis Bracelet (Variant 18)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-N-0401 Gold-Tone Zircon Leaf Pendant Necklace (Variant 01)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。
- **RA-N-2311 Tan Beaded Y Necklace (Variant 11)** —— 与同款式同色其它 SKU 的差异（长度/尺寸维度）待客户确认；目录导出未含 SKU 属性表。

### 5.2 链接无可用 SKU 图，降级为款式级条目

- **RA-B-112 Five-Clover Bracelet** —— 该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。
- **RA-N-101 White Zircon Square Pendant Necklace** —— 该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。
- **RA-N-104 Butterfly Tassel Pendant Necklace** —— 该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。
- **RA-N-108 Two-Face Clover Pendant Necklace** —— 该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。
- **RA-N-109 Shell Butterfly Pendant Necklace** —— 该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。
- **RA-N-114 Black Round Pendant Necklace** —— 该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。
- **RA-N-117 Pavé Clover Pendant Necklace** —— 该链接本轮无可用 SKU 图（SKU 图为真人照或带中文水印），暂以干净主图保留款式级条目；颜色变体待客户确认。

### 5.3 未决事项

- **空屿整批 47 格扣住**：该供应商 3 个链接的标题均未声明基材，无法判定产品线。若客户确认基材（如均为不锈钢 / 合金），可批量解锁。
- **S925 银分类缺口**：清单中 listing 51 / 52 标题写明「S925 银针」，但现有三条产品线（合金 / 天然石珍珠 / 不锈钢钛钢）均不覆盖 S925 银，`lineFor()` 返回 null 并记 `LINE_TAXONOMY_GAP`，需客户裁决归属。
- **第三方品牌水印**：空屿 listing 41 等图片带 MILanTing / LALIAN components 水印并叠加 USD 引流单价，涉商标风险，不随基材确认一并解锁。

## 六、字段缺失说明

下列字段在本批次**一律留空**，站点按「Price on request」「Confirmed with your quotation」降级渲染，未做任何推测填充：

| 字段 | 状态 | 原因 |
|------|------|------|
| 价格 / 阶梯价 | 留空 | 1688 目录未提供可信批发价；站内出现过的 USD 单价均为引流价，不可作报价依据 |
| MOQ | 留空 | 目录未标注起订量 |
| 材质等级 | 留空 | 标题仅写「不锈钢 / 钛钢」，未给牌号（如 304 / 316L） |
| 镀层规格 | 留空 | 标题仅写「镀 18K 金」，未给厚度 |
| 尺寸 / 重量 | 留空 | 已发布产品所对应的链接未含可用尺寸标注图（见 §四） |
