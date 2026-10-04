# Admin Backend — 使用与部署说明

> Golden Radiance 后台管理系统（询盘 + 订阅 + 看板）
> 生成时间：2026-10-03

---

## 一、能做什么

| 页面 | 路由 | 功能 |
|------|------|------|
| 登录 | `/admin/login/` | 密码登录，签发 8 小时 session |
| 询盘管理 | `/admin/` | 统计看板 + 询盘列表（按状态筛选）+ 详情抽屉 + 状态流转 + CSV 导出 |
| 订阅管理 | `/admin/subscribers/` | 订阅者列表 + 退订/恢复 |
| 登出 | `/api/admin/logout` | 清除 session（GET 自动跳登录页） |

**询盘状态流转**：`new`（新询盘）→ `contacted`（已联系）→ `quoted`（已报价）→ `won`（成交）/ `lost`（流失）。

---

## 二、上线前必须配置（否则后台拒绝一切登录）

后台采用 **fail-closed** 设计：密钥未配置时，任何人（包括你自己）都无法登录。上线前在 Cloudflare 项目目录执行：

```bash
# 1. 生成密码的 SHA-256 hex（密码假设是 MyStr0ngP@ss）
printf '%s' 'MyStr0ngP@ss' | sha256sum
# 得到一串 64 位 hex，如 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08

# 2. 注入密钥（走 secret，永不进代码库）
npx wrangler secret put ADMIN_PASSWORD   # 粘贴上一步的 hex
npx wrangler secret put ADMIN_SECRET     # 粘贴任意高熵随机串，如 openssl rand -hex 32
```

**本地开发**（可选）：在项目根 `.dev.vars`（已被 gitignore）加：

```
ADMIN_PASSWORD=<sha256 hex>
ADMIN_SECRET=<任意随机串>
```

---

## 三、鉴权原理（安全设计）

- **密码**：客户端提交明文 → 服务端 `SHA-256` 哈希后与 `ADMIN_PASSWORD`（预存哈希）做**恒定时间比较**，防时序侧信道。
- **Session**：登录成功后签发 `过期时间戳.HMAC-SHA256签名` 的无状态 cookie（`HttpOnly` + `SameSite=Lax` + `Secure`），8 小时有效。
- **无 D1 会话表**：MVP 单管理员，刻意不为鉴权建表、不引入每请求一次 DB 往返。
- **API 层强制鉴权**：所有 `/api/admin/*` 在入口经 `requireAdmin` 守卫，未通过返回 401。

---

## 四、安全边界

- `/admin/` 与 `/api/` 已从 **sitemap 排除**，`robots.txt` 已 `Disallow`，页面带 `noindex,nofollow`。
- 后台页面是**静态壳 + 客户端 fetch**，本身不含敏感数据；敏感数据全部经 API 层鉴权保护。
- 后台独立 `AdminLayout`：不加载前台 Header/Footer/Google Fonts，用系统字体栈，保持轻量。

---

## 五、已知边界（MVP 取舍）

1. **单管理员**：无多用户、无 RBAC、无密码找回。多人协作需后续评估 D1 用户表。
2. **无精确 geo 坐标**：`LocalBusiness` 结构化数据只输出 `areaServed`（出口市场），总部经纬度待客户提供后补入（见 `OPEN-DECISIONS`）。
3. **旧域名收敛（2026-10-03 第四轮）**：站点 URL 已收敛为单一真源——`src/lib/seo/site.ts`（`DEFAULT_SITE` + `getSiteUrl()`），全站页面/组件经 `getSiteUrl(Astro.site)` 取基址。换正式域名时只需改 **3 处**：①`astro.config.mjs` 的 `site` ②`src/lib/seo/site.ts` 的 `DEFAULT_SITE` ③`public/robots.txt` 的 Sitemap 绝对地址（文件内已加注释）。sitemap 的 admin/api 排除已改为 pathname 判断，换域名零改动。
4. **本地后台开发**：`.dev.vars` 已补 `ADMIN_PASSWORD`（值为 `sha256("admin-dev-password")`）与 dev-only `ADMIN_SECRET`——本地 `astro dev` 即可用密码 `admin-dev-password` 登录后台；该值与 `ADMIN_SECRET` 仅限本地，生产务必走 `wrangler secret put` 覆盖（见 §2）。
