# Golden Radiance — 上线排障全记录（shipin.md）

> 项目：B2B 饰品外贸官网「Golden Radiance」
> 域名：goldenradiance.fun
> 记录范围：从 Cloudflare 构建失败到询盘邮件送达的完整排障复盘
> 最后更新：2026-10-05

---

## 一、技术栈一览

| 层 | 选型 | 说明 |
|----|------|------|
| 前端 | Astro（SSG + Cloudflare 适配器） | `@astrojs/cloudflare`，`session: false` + `imageService: 'passthrough'` |
| 后端 | Cloudflare Worker + D1 | 无自建服务器的最小可信闭环 |
| 反垃圾 | Cloudflare Turnstile | sitekey + secret 配对，服务端 siteverify |
| 邮件 | Resend `6.31.0` | 双邮件：买家回执 + 内部通知 |
| 部署 | GitHub Actions + wrangler | push main 自动构建部署 |

---

## 二、排障时间线（按根因归类）

### 1. CI 构建失败：npm ci 缺跨平台依赖

**现象**：Cloudflare Pages 构建日志报 `Missing from lock file`，34 个包缺失。

**根因**：Windows 上生成的 `package-lock.json`（lockfileVersion 3）缺 Linux/Darwin 平台的 optional 依赖实体（`@astrojs/compiler-binding-*`、`@tailwindcss/oxide-*`、`@cloudflare/workerd-*`、`fsevents` 等）。

**修复**：Node 脚本从 npm registry 拉取 34 个缺失包元数据，按现有 win32 条目格式补全（version/cpu/os/license/optional/engines），`npm ci --dry-run` 验证通过。

---

### 2. 部署失败：KV namespace 撞名 + Worker 名不匹配

**现象**：`npm ci` 通过后，部署报 KV namespace 撞名（10014）+ Worker 名 warning。

**根因**：`@astrojs/cloudflare` 适配器默认注入 KV Session 和 Cloudflare Images 两个项目不需要的 binding。

**修复**：
- `astro.config.mjs` 加 `session: false` + `imageService: 'passthrough'`
- `wrangler.jsonc` name 改 `goldenradiance` 对齐 Workers Builds

---

### 3. 部署失败：D1 database_id 占位符

**现象**：报 D1 database_id 全零占位符（10181）。

**修复**：`wrangler d1 create` 取真实 ID `f06bbd60-9156-4e5c-b1d1-e18d23fd2a7c` 回填；顺带删掉交互自动追加的重复条目（binding 名 `jewelry_b2b_global_db` 与代码使用的 `DB` 不符）。

**关键边界**：4 个敏感密钥（ADMIN_SECRET/ADMIN_PASSWORD/TURNSTILE_SECRET_KEY/RESEND_API_KEY）从 `vars` 移出，纯 `wrangler secret put` 注入——配置文件里的同名空串 var 会遮蔽 secret，导致密钥永远不生效。

---

### 4. 域名 ERR_CONNECTION_CLOSED

**根因**：zone 未连接 Worker，DNS 无 A 记录。

**修复**：用户删残留自定义域后重新「连接 Worker」，SSL 生效。

---

### 5. SEO 旧域名 + 联系页假信息

**现象**：全站 canonical 指向旧域名 `rayan-accessories.com`，联系页挂假联系方式。

**修复**：
- 三处单一真源切域名：`astro.config.mjs` 的 `site` / `src/lib/seo/site.ts` 的 `DEFAULT_SITE` / `public/robots.txt` 的 Sitemap
- 联系页填真实值：email `hiruiyang@gmail.com`、WhatsApp `+86 19603969780`、微信 `gogo66dashun`，加空值过滤

---

### 6. 询盘提交失败（核心，多轮深挖）

这是最曲折的一段，共挖出 **4 个叠加 bug**，前三个都是「必要但不充分」：

#### Bug A：sitekey 被当 token 提交

- **RFQ 主表单**：用户点「提交」的瞬间才 `renderTurnstile`，token 还没生成，`getToken()` 恒空 → 永远失败；slot 在 `hidden` 表单内，尺寸为 0 无法完成挑战。
- **newsletter**：widget 渲染进离屏临时 div，token 空时兜底 `?? TURNSTILE_SITEKEY` 把**公钥当 token** 提交 → siteverify 必然 invalid。

#### Bug B：sitekey OCR 抄错

`0x4AAAAAAAFNrqMuBQzU6nO8t` 少抄了 `AAA`，正确值是 `0x4AAAAAAFNrqMuBQzU6nO8t`。

#### Bug C：store 无订阅，表单不重绘

`renderItems()` 只在初始化时跑一次，没有任何 store 订阅触发重跑。用户加 SKU → store 更新 → 但表单 `hidden` 状态、条目列表、widget 渲染全都不刷新 → 「看不到验证弹窗、看不到提交按钮」。

#### Bug D（终极根因）：hidden 属性 vs class

RfqPanel 的 form 是 SSR 输出 `<form data-rfq-form hidden ...>`——初始隐藏用的是 **HTML `hidden` 属性**；而 `renderItems` 只 toggle **`hidden` class**。SKU 入篮后 class 移除了，但 attribute 永远挂着 → 表单从上线第一天起 `display:none`。

**修复**：`renderItems` 同步 `form.hidden = !hasItems`。

---

### 7. 三态同屏 UX bug

**现象**：提交成功后「Received.」成功提示与「Your RFQ list is empty」空状态同屏。

**根因**：`submitRfq` 成功后 `clearRfq()` → store 订阅触发 `renderItems()` → 篮空显示空状态，与成功提示无互斥。

**修复**：`renderItems` 三态互斥——success 显示时空状态隐藏；重新入篮自动收起 success 回到表单视图。

---

### 8. 邮件未送达（最后一环）

**现象**：提交成功（RFQ-2026-0002 落库）但没收到邮件。

**三重证据定位**：
1. `wrangler secret list` 确认 RESEND_API_KEY 已注入 → 排除「没 key」
2. D1 查询 `mail_status` = `failed` → Resend API 被调用但被拒绝
3. DNS 实测（nslookup）：SPF/MX/`resend._domainkey` CNAME 全部无记录 → 域名从没在 Resend 验证过

**根因**：Resend 规定发件域名必须先验证，否则一律拒发。key 是好的，`noreply@goldenradiance.fun` 没验证。

**修复**（用户操作，两个 Dashboard）：
1. Resend → Domains → Add Domain → 拿 DNS 记录（MX+TXT+CNAME）
2. Cloudflare DNS 添加记录，**必须灰云 DNS only**（代理会验证失败）
3. Resend 点 Verify 等 Verified
4. 重测 → `mail_status` 转 `sent`

---

## 三、关键经验沉淀

1. **跨平台 lockfile**：Windows 上生成 lockfile 会缺跨平台 optional 依赖实体，CI（Linux）构建必挂。要么在 Linux 环境生成 lock，要么手动补全。

2. **Cloudflare 适配器默认注入**：`@astrojs/cloudflare` 会默认启用 KV Session + Images，不需要就显式关闭（`session: false` + `imageService: 'passthrough'`）。

3. **secret 遮蔽陷阱**：`wrangler.jsonc` 的 `vars` 里同名空串 var 会遮蔽 `secret put` 注入的真值，敏感项必须彻底移出 vars。

4. **HTML `hidden` 属性 ≠ `hidden` class**：SSR 输出用 `hidden` 属性，客户端 JS 却 toggle class，两者不同步会导致元素永远不可见。改可见性时两者必须同步。

5. **Turnstile token 时机**：token 是异步生成的，必须在表单可见时就预渲染 widget（`callback` 收集 token），绝不能在点提交瞬间才渲染，更不能把 sitekey 当 token。

6. **邮件健康探针**：`mail_status` 字段（`sent`/`failed`/`skipped_dev`）是发信健康的唯一可信探针，一条 D1 查询就能定位「没 key / 被拒 / 成功」，不用等收件箱。

7. **Resend 域名验证**：发件域名必须先验证（SPF/DKIM/MX），且 Cloudflare 侧记录必须灰云，否则开代理验证永远过不了。这是最常见的邮件卡点。

---

## 四、最终交付状态

| 环节 | 状态 |
|------|------|
| CI 构建 + Workers 部署 + 自定义域 | ✅ goldenradiance.fun 上线 |
| Turnstile 人机验证（sitekey+secret 配对） | ✅ 真实提交通过 |
| RFQ 表单三态互斥显示 | ✅ 提交后只显示「Received.」 |
| 询盘落库 D1 | ✅ RFQ-2026-0001/0002 正常写入 |
| Resend 邮件送达 | ✅ 买家回执 + 通知到 hiruiyang@gmail.com |
| SEO 域名切换 + 联系方式 | ✅ 全站指向新域名、真实联系信息 |

**无遗留待办**，全链路闭环。

---

## 五、后续可扩展方向（非阻塞）

- 询盘后台：当前询盘只进邮箱，D1 已存完整数据，可加只读管理后台
- 询盘自动回复排班：PRD §13.2 的 8 小时响应承诺，MVP 按连续 8 小时计，v2 可做跨夜/周末语义
- 邮件送达监控：基于 `mail_status` 加 Cron 告警
