// src/lib/admin/guard.ts — /admin API 鉴权守卫
// 每个后台数据 API 在入口调用 requireAdmin(request)，未通过返回 401 Response。
import { env } from 'cloudflare:workers';
import { readSessionCookie, verifySession } from './auth';

export async function requireAdmin(request: Request): Promise<Response | null> {
  const cookie = readSessionCookie(request);
  const secret = env.ADMIN_SECRET ?? '';
  if (!secret || !cookie) return unauthorized();
  const ok = await verifySession(cookie, secret);
  if (!ok) return unauthorized();
  return null;
}

function unauthorized(): Response {
  return new Response(JSON.stringify({ code: 401, data: {}, message: 'Unauthorized.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}
