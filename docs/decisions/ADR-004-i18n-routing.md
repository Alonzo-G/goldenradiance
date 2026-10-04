# ADR-004: V1 单层英文无前缀路由 + v2 最小 i18n 预埋

## Status

Accepted (2026-10-02)

> 本 ADR 取代 2026-10-01 版本（原方案为 `/{lang}/` 路径前缀 + V1 双语站）。旧方案经 Team Lead 裁决否决，否决理由见 Background。ARCHITECTURE.md §6.2 与本 ADR 同步生效。

## Background

原 ADR（2026-10-01）提出「单一域名 + `/{lang}/` 路径前缀，V1 即产出 EN / ZH 双语静态站」。该方案在评审中被否决，理由有三：

1. **目标访客是海外批发买家，中文落地页对转化零贡献。** 本站的业务目标是承接海外买家的搜索流量并转化为 RFQ 询盘。中文前台页面既不服务目标访客，也不承接目标搜索词，只会增加内容生产与 review 成本；而未经审校的低质量中文页还会反噬核心 SEO 资产（原 ADR 在翻译范围一节已承认此风险，却仍保留 `/zh/` 路由壳，自相矛盾）。
2. **多余的 URL 层级稀释 SEO 权重。** PRD §12.3 的 `/product-lines/{line}/`、`/compliance/{topic}/` 是语义化排名资产。给全部路径套一层 `/en/` 前缀，等于让每个 URL 都多一层对排名无贡献的目录，站内链接、canonical、sitemap、CDN 缓存规则全链路都要为这层前缀买单。
3. **客户要求的是中文后台 admin UI，不是中文前台。** admin UI locale 与前台 locale 是两个解耦的东西：前者是客户/运营登录后台管理内容时看到的界面语言（中文），后者是买家看到的站点语言（英文）。原方案把两者混为一谈。

因此 V1 只有一种语言（英文）。需要决策的只剩一件事：如何为 v2 的多语言扩展留下最低成本的上车口，同时不让 V1 为此支付任何运行时复杂度。

## Decision

### 1. URL 结构：单层英文，无语言前缀

```
https://example.com/product-lines/fashion-alloy-brass/
https://example.com/compliance/nickel-release-en-1811/
https://example.com/products/{sku-slug}/
```

即 PRD §12.3 的路由**原样落地**，不套任何 locale 前缀。已与 docs/UIUX.md §11 页面清单（15 页 + 2 个 P1 预留）逐条交叉核对，两侧路由完全一致，均为无前缀形态。

由于只有一种语言，原方案中「根路径 301 到默认语言」的逻辑**不再需要**——不存在任何需要协商或重定向的场景。

### 2. hreflang：仅注入一条 x-default，指向英文页面自身

```html
<link rel="alternate" hreflang="x-default" href="https://example.com/products/fb-2317/" />
```

V1 不注入 `en` / `zh` 等任何其他语种条目。每页保留这一处 `<link rel="alternate">` 注入位，v2 新增语言时在该位追加其余 hreflang 条目即可。

### 3. 文案字典：外置 JSON，V1 仅产出 en 一个字典

UI 文案单一真源为 `src/i18n/en.json`，经 `t(key)` 取值，`UiKey` 类型约束保证写错 key 编译期报错：

```json
// src/i18n/en.json —— V1 唯一字典。组件禁止硬编码英文串，一律 t('...')
{
  "rfq.title": "Request a quote",
  "product.moq": "MOQ",
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

**不引入** i18next / FormatJS / Lingui / astro-i18next 等 i18n 库（理由同原 ADR：UI 词汇量约 300-500 条，静态字典足够；i18n 库的核心能力本站用不上；少一个依赖少一层 API 幻觉风险）。**产品名、SKU、型号、规格数值一概不翻译。**

**V1 不产出任何 `/zh/` 路由或页面。** 原 ADR 中「SKU 页分批补译 + sitemap 动态排除 + noindex」一整套机制随本裁决一并作废——v2 真正引入中文时再按当时的流量数据设计，不做提前实现。

### 4. 明确禁止项（违反即退回）

| 禁止项 | 原因 |
|---|---|
| 产出任何 `/zh/`（或其他语种）路由或页面 | 本次裁决核心：低质量/未审校的非英文页会反噬核心 SEO 资产 |
| **渲染语言切换器，包括禁用态下拉** | 禁用态等于暗示「即将上线」，是虚假承诺，违反 PRD §13.6 的「无实证不宣称」原则 |
| 引入运行时 i18n 中间件 | V1 只有一种语言，无任何东西需要协商；中间件还会引入 Vary 头与 CDN 缓存正确性问题 |
| 引入 locale 重定向层 / 根路径语言跳转 | 同上，且纯增故障面 |
| 引入 `negotiator` / `@formatjs/intl-localematcher` 等语言协商依赖 | 幻觉依赖与安全问题高发区，V1 无消费场景 |

### 5. v2 预埋最小清单（只做这三条，不多做）

| 预埋项 | V1 做法 | v2 启用时的工作量 |
|---|---|---|
| 文案字典外置 | 所有 UI 文案走 `src/i18n/en.json`，统一经 `t(key)` 取值 | 加一个 `{lang}.json` + 组件零返工 |
| hreflang 注解预留位 | 每页一处注入位，仅 1 条 `x-default` 指向自身 | 加语言时在原位追加条目 |
| Pagefind 语言锚 | 每个 layout 输出 `<html lang="en">` | v2 分语言索引直接复用 |

预埋到此为止。运行时中间件、重定向、语言协商均属 v2 范畴（对齐 ADR-011 的 v2 边界）。

### 6. 翻译成本影响

原 ADR 认定的最大持续成本项——SKU 标题/描述的人工翻译——在 V1 被完全移除。V1 只剩一份英文 UI 字典，成本极低。饰品行业专业术语（316L、PVD、EN 1811、镍释放量、镀层厚度）的机器翻译禁令维持不变（见原 ADR §5 的论证），v2 引入其他语言时只能人工翻译或延后。

## Consequences

### 正面

- PRD §12.3 的语义化路径以最短 URL 形态直接承载排名权重，全站链接/canonical/sitemap 无冗余层级。
- UI 翻译漂移由 TypeScript 类型系统在编译期拦截，零 i18n 库依赖、零运行时中间件、零协商重定向。
- 内容侧翻译成本归零，PM 排期中不再需要预留翻译人力。
- `admin UI locale`（中文后台）与前台 locale（英文）解耦，互不牵制。

### 负面

- 中文市场在 V1 完全没有承接面（无 `/zh/` 路由），这是有意识的业务取舍，需 PM 与客户保持知会。
- v2 若为中文单独加 `/zh/` 路由，届时需为新路由做 sitemap 与 Search Console 收录监控；英文路径保持无前缀不动，不产生历史 URL 301。
- 前台组件必须经 `t(key)` 取值的纪律需要 code review 把关，漏网硬编码文案会让 v2 字典替换变贵。

## Alternatives Considered

| 方案 | 否决理由 |
|---|---|
| **`/{lang}/` 路径前缀（原 ADR-004，2026-10-01）** | 产出客户明确排除的 `/zh/` 前台路由；`/en/` 层稀释 PRD §12.3 语义化路径的排名权重；把「中文后台」误当「中文前台」实现 |
| 子域名 `en.example.com` | 需额外 DNS 与配置；搜索引擎部分视为独立站点，权重分散；客户维护成本高 |
| 多 ccTLD（`example.cn` 等） | 多域名注册 + 各自 Search Console 验证；与单一域名权重集中策略冲突 |
| i18next / FormatJS / astro-i18next 等库 | 本站用不上其核心能力；多一层依赖与 API 幻觉风险；V1 单语言无协商场景 |
| 全自动机器翻译上线多语种子 | 术语错误率高，低质量页面反噬 SEO |
| 根目录无前缀 + 子目录带前缀（`prefixDefaultLocale: false`） | 英文无前缀、中文带前缀的不对称结构在 V1 仅有英文时毫无意义；是否采用留给 v2 按当时语种数量决策 |

## Related ADRs

ADR-001（采用 Astro）、ADR-003（内容源）、ADR-007（搜索）、ADR-011（v2 演进边界）

## References

- docs/PRD.md §12.3（URL 结构）、§13.6（无实证不宣称）、Out-of-Scope 第 13 条
- docs/UIUX.md §11（页面清单，路由已核对一致）
- docs/ARCHITECTURE.md §6.2、§10.1（NO-7 / NO-13 / NO-14）、§12.5（SEO 断言）
