// src/pages/api/admin/logout.ts — POST /api/admin/logout（清除 session cookie）
import type { APIRoute } from 'astro';
import { clearSessionCookieHeader } from '../../../lib/admin/auth';

export const prerender = false;

export const POST: APIRoute = async () => {
  return new Response(JSON.stringify({ code: 0, data: {}, message: '' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': clearSessionCookieHeader(),
    },
  });
};

// 同时支持 GET（/admin/logout/ 链接直接点），跳转回登录页
export const GET: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin/login/',
      'Set-Cookie': clearSessionCookieHeader(),
    },
  });
};
