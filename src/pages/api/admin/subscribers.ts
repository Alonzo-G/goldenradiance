// src/pages/api/admin/subscribers.ts — GET /api/admin/subscribers（列表）
// 订阅者列表（可选 ?status=）。经 requireAdmin 守卫。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../lib/admin/guard';
import { listSubscribers } from '../../../lib/admin/data';

export const prerender = false;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request }) => {
  const guard = await requireAdmin(request);
  if (guard) return guard;

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');
  const status = statusParam && ['active', 'unsubscribed'].includes(statusParam) ? statusParam : undefined;
  const limit = Number(url.searchParams.get('limit') ?? '200');
  const offset = Number(url.searchParams.get('offset') ?? '0');
  const rows = await listSubscribers(env.DB, { status, limit, offset });
  return json(200, { code: 0, data: rows, message: '' });
};
