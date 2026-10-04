// src/pages/api/admin/subscribers/[id].ts — PATCH /api/admin/subscribers/:id
// 订阅者状态流转（body: { status: 'active' | 'unsubscribed' }）。经 requireAdmin 守卫。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../../lib/admin/guard';
import { updateSubscriberStatus } from '../../../../lib/admin/data';

export const prerender = false;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const PATCH: APIRoute = async ({ request, params }) => {
  const guard = await requireAdmin(request);
  if (guard) return guard;

  const id = params.id;
  if (!id) return json(400, { code: 400, data: {}, message: 'Missing subscriber id.' });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { code: 400, data: {}, message: 'Invalid JSON body.' });
  }
  const status = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>).status : undefined;
  if (status !== 'active' && status !== 'unsubscribed') {
    return json(422, { code: 422, data: {}, message: 'Invalid status.' });
  }

  const updated = await updateSubscriberStatus(env.DB, id, status);
  if (!updated) return json(404, { code: 404, data: {}, message: 'Subscriber not found.' });
  return json(200, { code: 0, data: { id, status }, message: '' });
};
