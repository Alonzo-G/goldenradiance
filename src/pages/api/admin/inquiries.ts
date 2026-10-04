// src/pages/api/admin/inquiries.ts — GET /api/admin/inquiries
// 询盘列表（可选 ?status=）+ 详情（?id=）。经 requireAdmin 守卫。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../lib/admin/guard';
import { listInquiries, getInquiry, isValidStatus } from '../../../lib/admin/data';

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
  const id = url.searchParams.get('id');
  if (id) {
    const detail = await getInquiry(env.DB, id);
    if (!detail) return json(404, { code: 404, data: {}, message: 'Inquiry not found.' });
    return json(200, { code: 0, data: detail, message: '' });
  }

  const statusParam = url.searchParams.get('status');
  const status = statusParam && isValidStatus(statusParam) ? statusParam : undefined;
  const limit = Number(url.searchParams.get('limit') ?? '100');
  const offset = Number(url.searchParams.get('offset') ?? '0');
  const rows = await listInquiries(env.DB, { status, limit, offset });
  return json(200, { code: 0, data: rows, message: '' });
};
