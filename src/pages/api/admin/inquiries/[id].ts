// src/pages/api/admin/inquiries/[id].ts — PATCH /api/admin/inquiries/:id
// 询盘状态流转（body: { status }）。经 requireAdmin 守卫。
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireAdmin } from '../../../../lib/admin/guard';
import { updateInquiryStatus, isValidStatus } from '../../../../lib/admin/data';

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
  if (!id) return json(400, { code: 400, data: {}, message: 'Missing inquiry id.' });

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(400, { code: 400, data: {}, message: 'Invalid JSON body.' });
  }
  const status = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>).status : undefined;
  if (typeof status !== 'string' || !isValidStatus(status)) {
    return json(422, { code: 422, data: {}, message: 'Invalid status.' });
  }

  const updated = await updateInquiryStatus(env.DB, id, status);
  if (!updated) return json(404, { code: 404, data: {}, message: 'Inquiry not found.' });
  return json(200, { code: 0, data: { id, status }, message: '' });
};
