// src/pages/api/v1/health.ts — GET /api/v1/health（api-spec.yaml health）
// D1 连通性探测：SELECT 1 成功 → 200 ok/db:up；任何异常 → 503 degraded/db:down。
// 供 CI 冒烟与监控使用。

export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { probeDb } from '../../../lib/server/db';

const VERSION = '1.0.0';

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async () => {
  const up = await probeDb(env.DB);
  if (up) {
    return json(200, { code: 0, data: { status: 'ok', db: 'up', version: VERSION }, message: '' });
  }
  console.error('health check failed: D1 unreachable');
  return json(503, {
    code: 0,
    data: { status: 'degraded', db: 'down', version: VERSION },
    message: 'D1 unreachable',
  });
};
