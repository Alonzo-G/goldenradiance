# ADR-006: 询盘后端采用 Cloudflare Worker + D1 + Turnstile + Resend

## Status

Accepted (2026-10-01)

## Background

Phase 1 唯一的服务端需求是：**在不自建服务器的前提下，让 RFQ 表单能落库、防机器人、并通知到客户。**

调研边界技术约束：客户无专职后端、无服务器运维能力，月度成本要低。同时询盘是本站**唯一的业务资产**——这决定了「只发邮件不落库」这类最省事的方案必须被排除。

## Decision

采用 Cloudflare Worker + D1 + Cloudflare Turnstile + Resend 的组合：

```
POST /api/v1/rfq
  ├─ 1. Turnstile 服务端 siteverify（必做）
  ├─ 2. honeypot 非空判定 + formLoadedAt 时间阈值（< 2s 判机器人）
  ├─ 3. Zod 解析 body（失败返回 422 + 字段级明细，不吞异常）
  ├─ 4. D1 单事务写入 rfq_inquiries + rfq_items
  ├─ 5. ctx.waitUntil() 异步发两封邮件：客户通知 + 买家自动回执
  └─ 6. 返回 201 { id, reference, receivedAt, respondBy }
```

### 反垃圾三层，缺一不可

1. **Cloudflare Turnstile（主要防线）**：免费无上限，且不像 reCAPTCHA 那样受 10,000 次/月的免费额度限制（见 ADR-005）。**强制服务端 siteverify**——只检查前端 token 非空是纸糊防线。
2. **Honeypot 隐藏字段 + 时间阈值（零成本兜底）**：表单渲染时间戳，提交间隔 < 2s 判为机器人。
3. **Cloudflare WAF + IP 速率限制**（账户层配置，无需代码）：默认 5 次 / 10 分钟 / IP。

### 邮件

Resend（`resend@6.31.0`），发送两封：
- 内部通知：含完整 RFQ 明细与 reference。
- 买家自动回执：含 PRD §13.2 承诺的「8 工作小时响应」，这是信任兑现的一部分，不是可选的用户体验优化。

### 错误模型（关键决策，不得简化）

**D1 写入失败必须返回 500 + 告警，绝不允许返回 201。**

这是本 ADR 中最重要的一条。「写入失败但返回成功」是本项目最贵的沉默逻辑错误：客户永远不知道有一笔询盘丢了，且没有任何信号提示他去看。已在 ARCHITECTURE.md §12.9 列为必须逐条验证的 E6 用例。

同理，邮件发送失败（`MAIL_FAILED`）允许在记录已入库的前提下返回 201，但必须在后台标记 `mail_status` 供补发——因为此时询盘数据已安全落库，降级是可接受的。

## Consequences

### 正面

- 与静态站同账户、同 CI 流水线部署，运维面统一。
- D1 免费额度远超 MVP 量级（500 万行读/日 vs 每日数十笔询盘）。
- 询盘数据自有可控，可导出、可统计、可为 v2 的客户分层提供数据基础。
- Turnstile 免费无上限 + 隐私友好（目标市场含欧盟）。
- Worker 单次 CPU 预算（10ms）足以覆盖 Zod 校验 + Turnstile 校验 + D1 写入。

### 负面

- 相比纯表单 SaaS，多了大约 200 行自写代码与一个 D1 schema 需要维护。
- 需要处理 Turnstile 的单次有效语义：提交失败后必须重新渲染 widget，否则用户二次提交必然失败。这是一类极易在生成式实现中被漏掉的错误分支，已写进 ARCHITECTURE.md §12.9 E2。
- `wrangler dev` 下的本地 D1 需要单独执行 migration，本地与预览环境的初始化步骤不可省略。

### 数据合规

`audit_log` 表只存 `ip_hash` / `ua_hash`（不存明文 IP），保留 90 天后由定时任务清理。目标市场含欧盟，这是 GDPR 要求而非可选项。

## Alternatives Considered

| 方案 | 否决理由 |
|---|---|
| **纯邮件 API（Formspree / EmailJS 等），不落库** | 明确否决，且这是本 ADR 最想强调的一条。询盘是唯一业务资产，不落库等于无历史、无统计、无回溯、无法做 v2 客户分层。省下的代码远不足以弥补资产损失 |
| 第三方表单服务（Formspree 等带存储） | 免费额度有封顶且带品牌水印；RFQ 数据寄存在第三方、导出麻烦，核心资产不应外包 |
| Supabase | 能力强，但为一个表引入完整 Postgres + Row Level Security 学习面，是过度设计。v2 若做会员体系会重新评估（见 ADR-011） |
| Netlify Forms | 与 Netlify 一并被否决（见 ADR-005）；且数据导出与自有化能力弱 |
| Astro Actions / API Routes 承载 | 需要与 SSR 模式耦合，会牺牲全站静态性，与 ADR-001 冲突 |
| 自建 Node / NestJS 服务 | 违反「无服务器运维」前提 |

## Related ADRs

ADR-001（采用 Astro）、ADR-005（Cloudflare）、ADR-011（v2 演进边界）
