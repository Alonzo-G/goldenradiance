# ADR-003: 内容源采用 Git 内 Content Collections，Phase 1 不接 Headless CMS

## Status

Accepted (2026-10-01)

## Background

客户是纯贸易公司 / SOHO 起步，无专业技术团队，长期需要自己添加 SKU（预期千级）。因此「非技术客户能否自己加产品」是一条真实的架构约束，而不是锦上添花。

调研中发现一个普遍被误传的说法需要先行澄清：

> 「接了 Headless CMS，编辑点保存，内容就自动上线了。」

这句话只有一半成立。Content Collections 是**构建期原语**——数据在 `astro build` 时被采集、Zod 校验、固化进产物。无论内容存在哪里（Git / Sanity / Strapi / Contentful），只要走 Content Collections，**新内容上线都必须重新构建**。接 CMS 只是把编辑地点从 GitHub 挪到了 CMS 后台，构建仍然要跑，靠 CMS 的 webhook 触发 CI。

因此真正的选择题是：**谁来编辑、用什么界面、值不值得为一个「每月加几十个 SKU、单人操作」的场景买一套 CMS 订阅费 + OAuth 维护面。**

## Decision

**Phase 1 采用 Git 内的 Content Collections 作为唯一内容源，配一个「受控编辑通道」把客户的实际操作门槛压到最低。不引入 Headless CMS。**

具体形态：

1. **产品数据统一入口**：`src/content/products/{line}/{sku}.md`。Frontmatter 字段由 Zod schema 钉死，**字段名写错则构建立即失败并指明文件**——这比 CMS 后台的模糊校验更可靠，且失败发生在上线之前。
2. **图片零配置关联**：图片拖入 `src/assets/products/{sku}/`，按 `{sku}-01.webp` 命名，由 loader 自动与 SKU 关联，客户无需手工填写图片路径。
3. **给客户一个不需要懂 Git 的界面**：使用 GitHub Web 端编辑界面（点击 "Add file" → 粘贴模板 → Commit）。对「加一个产品」这个动作，客户只需认识 8 个字段。
4. **由 PM 产出一份「加产品」图文 SOP**，含一个可复制的 YAML 模板。
5. **CI 在每次提交后自动构建部署**，客户提交后约 3-5 分钟上线，并收到 GitHub 的构建结果通知邮件（成功 / 失败）。

### 明确采用 Zod schema 而非自由格式（这条对我们自己的交付也是约束）

利益点在于「把内容错误挡在上线前」。对饰品 B2B 尤其重要：材质、镀层厚度、镍释放值、MOQ 这类字段一旦缺失或格式错误，买家会直接视为不专业甚至诈骗信号（PRD §2 明确把「规格缺失」列为竞品主要缺陷）。

## Consequences

### 正面

- **零订阅成本**。省下 CMS 月费与 OAuth 应用维护。
- **类型安全**：Zod schema 在构建期阻断字段错误。
- **版本历史与回滚**：内容在 Git 中，误删可恢复，这在单人 SOHO 场景下是刚需。
- **迁移成本低**：Content Layer 抽 Loader，将来换 CMS 只需替换 loader，页面代码不动（见 ADR-011）。
- **学习成本可控**：客户学习成本约 30 分钟（认识字段 + 复制模板）。

### 负面

- 客户必须接触 GitHub Web 界面。虽然有 SOP，但这不是「所见即所得」的后台体验。
- 无草稿流转、无定时发布、无编辑留痕、无多人协作权限。
- 内容上线有 3-8 分钟 CI 延迟（此延迟是所有静态站方案的共性，非本决策独有）。

### 触发重新评估 Headless CMS 的条件（写在此处以防随意漂移）

以下任一成立时重开此 ADR：

1. SKU 数 > 2000 且 Git 仓库体积 > 2 GB（图片归档到 R2 后此条件应可延后很久）。
2. 需要多人协作编辑、草稿流转、定时发布、编辑留痕。
3. 客户明确表示无法接受 GitHub 界面。

## Alternatives Considered

| 方案 | 否决理由 |
|---|---|
| Sanity / Strapi / Contentful 等 Headless CMS | 订阅成本 + OAuth 维护面 + 仍需触发 CI 构建；当前只有单人加 SKU，其治理价值无从兑现 |
| Git + MDX 直改、无受控通道 | 对非技术客户门槛过高（需懂 Git / MR 流程） |
| 纯 Astro markdown 自由格式、无 Zod schema | 失去「错误挡在上线前」的核心收益，而饰品规格容错率极低 |
| headless WordPress 作为 CMS | 为了内容编辑重新引入 WordPress 全部运维与安全面，与 ADR-001 / ADR-005 的零运维目标冲突 |

## Related ADRs

ADR-001（采用 Astro）、ADR-002（否决 Next.js）、ADR-011（v2 演进边界）
