// src/pages/api/v1/newsletter.ts — POST /api/v1/newsletter（api-spec.yaml subscribeNewsletter）
// 幂等：重复订阅同一邮箱返回 409，但 code:0 语义为成功（api-spec 409 example）。
// 只做装配； honeypot/时间阈值判定、限流与 rfq 端点同款（各自独立计数）。

export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { subscribeSchema, zodErrorToFields } from '../../../lib/rfq/schema';
import { verifyTurnstile } from '../../../lib/server/turnstile';
import { rateLimit, clientIp, fingerprintRequest } from '../../../lib/server/ratelimit';
import { persistSubscriber, PersistError } from '../../../lib/server/db';

const FORM_MIN_FILL_MS = 2000;

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export const POST: APIRoute = async (ctx) => {
  const request = ctx.request;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json(422, { code: 422, data: {}, message: 'Invalid JSON body.' });
  }

  // 1. Turnstile siteverify
  const token = asRecord(raw).turnstileToken;
  const verdict = await verifyTurnstile(
    env.TURNSTILE_SECRET_KEY,
    typeof token === 'string' ? token : '',
    clientIp(request),
  );
  if (!verdict.ok) {
    const message =
      verdict.failure === 'already_used'
        ? 'Turnstile token already used. Please retry the challenge.'
        : 'Turnstile verification failed.';
    return json(400, { code: 400, data: {}, message });
  }

  // 2. honeypot / 时间阈值（formLoadedAt 在 newsletter 为可选，提供时才参与判定），
  //    通用错误不暴露判定细节。
  const candidate = asRecord(raw);
  const honeypot = candidate.honeypot;
  const formLoadedAt = candidate.formLoadedAt;
  const botLike =
    (typeof honeypot === 'string' && honeypot.length > 0) ||
    (typeof formLoadedAt === 'number' && Date.now() - formLoadedAt < FORM_MIN_FILL_MS);
  if (botLike) {
    return json(400, { code: 400, data: {}, message: 'Request rejected. Please try again.' });
  }

  // 3. Zod 校验
  const parsed = subscribeSchema.safeParse(raw);
  if (!parsed.success) {
    return json(422, {
      code: 422,
      data: { fields: zodErrorToFields(parsed.error) },
      message: 'Validation failed',
    });
  }

  // 4. rate limit（独立于 rfq 计数）
  const fp = await fingerprintRequest(request);
  const rl = rateLimit(`newsletter:${clientIp(request)}:${fp}`);
  if (!rl.allowed) {
    return json(
      429,
      {
        code: 429,
        data: { retryAfterSeconds: rl.retryAfterSeconds },
        message: 'Too many requests. Please try again later.',
      },
      { 'Retry-After': String(rl.retryAfterSeconds) },
    );
  }

  // 5. 幂等写入：邮箱 trim + lowercase 归一化后落库（schema.sql 约定 2）
  const data = parsed.data;
  try {
    const outcome = await persistSubscriber(
      env.DB,
      data.email.trim().toLowerCase(),
      data.locale,
      data.source ?? null,
    );
    if (outcome === 'already_exists') {
      return json(409, {
        code: 0,
        data: { subscribed: true, alreadyExisted: true },
        message: 'Already subscribed.',
      });
    }
    return json(201, { code: 0, data: { subscribed: true, alreadyExisted: false }, message: '' });
  } catch (err) {
    console.error('newsletter persist failed', err instanceof PersistError ? err.message : err);
    return json(500, { code: 500, data: {}, message: 'Internal server error' });
  }
};
