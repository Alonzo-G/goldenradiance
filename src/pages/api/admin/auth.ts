// src/pages/api/admin/auth.ts — POST /api/admin/auth（后台登录）
// 校验密码 → 签发 HMAC session cookie。失败 401，成功 200 + Set-Cookie。
// 依赖环境变量 ADMIN_PASSWORD / ADMIN_SECRET（wrangler secret put，缺任一即 fail-closed）。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { checkPassword, createSession, sessionCookieHeader } from '../../../lib/admin/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, 'Invalid JSON body.');
  }
  const password = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>).password : undefined;
  if (typeof password !== 'string' || password.length === 0 || password.length > 512) {
    return json(400, 'Password required.');
  }
  // 简单限流：密码错误不提示具体原因，仅统一 401
  const ok = await checkPassword(password, env.ADMIN_PASSWORD ?? '');
  if (!ok) {
    return json(401, 'Invalid credentials.');
  }
  const session = await createSession(env.ADMIN_SECRET ?? '');
  return new Response(JSON.stringify({ code: 0, data: {}, message: '' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookieHeader(session),
    },
  });
};

function json(status: number, message: string): Response {
  return new Response(JSON.stringify({ code: status, data: {}, message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
