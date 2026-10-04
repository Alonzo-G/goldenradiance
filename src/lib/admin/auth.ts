// src/lib/admin/auth.ts — /admin 后台鉴权（环境变量密码 + HMAC 签名 session cookie）
// 设计取舍（ADR 待记）：
//   - MVP 单管理员：密码走 wrangler secret put ADMIN_PASSWORD 注入，绝不入库、绝不硬编码。
//   - Session 用「过期时间戳 + HMAC-SHA256 签名」的无状态 cookie，不依赖 D1 存会话——
//     避免为鉴权额外建表，也避免每个请求多一次 DB 往返。
//   - 密钥 ADMIN_SECRET 同样走 secret 注入；缺任一密钥时后台整体 fail-closed（拒绝登录）。

const SESSION_COOKIE = 'gr_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 小时，覆盖一个工作日

/** 把 ArrayBuffer 转 hex（Cloudflare Workers 环境无 Buffer.toString('hex') 的可靠垫片） */
function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** 恒定时间比较，防时序侧信道（长度不等直接返回 false） */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** HMAC-SHA256 签名（Web Crypto，Workers 原生可用） */
export async function hmacSign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(sig);
}

/** 生成登录 session cookie 值：`expiry.signature` */
export async function createSession(secret: string): Promise<string> {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const signature = await hmacSign(`gr_admin:${expiry}`, secret);
  return `${expiry}.${signature}`;
}

/** 校验 cookie 是否有效：签名匹配 + 未过期 */
export async function verifySession(cookieValue: string, secret: string): Promise<boolean> {
  const [expiryStr, signature] = cookieValue.split('.');
  if (!expiryStr || !signature) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || expiry * 1000 < Date.now()) return false;
  const expected = await hmacSign(`gr_admin:${expiry}`, secret);
  return timingSafeEqual(signature, expected);
}

/** 从请求 Cookie 头解析出 session cookie 值 */
export function readSessionCookie(request: Request): string {
  const header = request.headers.get('Cookie') ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === SESSION_COOKIE) return rest.join('=');
  }
  return '';
}

/** 构造 Set-Cookie 响应头 */
export function sessionCookieHeader(value: string, maxAge: number = SESSION_TTL_SECONDS): string {
  return `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; Secure`;
}

/** 清空 cookie（登出） */
export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure`;
}

/** 密码校验：缺 ADMIN_PASSWORD 时 fail-closed（视为未配置，拒绝一切登录） */
export async function checkPassword(input: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return timingSafeEqual(toHex(hash), stored);
}
