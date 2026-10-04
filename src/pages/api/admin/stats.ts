// src/pages/api/admin/stats.ts — GET /api/admin/stats（看板统计）
// 询盘/订阅计数 + 按状态/市场分布 + 近 7 日趋势。经 requireAdmin 守卫。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../lib/admin/guard';
import { getStats } from '../../../lib/admin/data';

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
  const stats = await getStats(env.DB);
  return json(200, { code: 0, data: stats, message: '' });
};
