// src/pages/api/v1/rfq.ts — POST /api/v1/rfq（api-spec.yaml createRfq）
// 只做装配：校验顺序 Turnstile → honeypot/时间阈值 → Zod → rate limit →
// ULID + reference → D1 单事务 → ctx.waitUntil 异步双邮件 → 201。
// 业务实现全部在 src/lib/server/ 与 src/lib/rfq/。

export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createRfqSchema, zodErrorToFields } from '../../../lib/rfq/schema';
import { verifyTurnstile } from '../../../lib/server/turnstile';
import { rateLimit, clientIp, fingerprintRequest } from '../../../lib/server/ratelimit';
import { persistRfq, PersistError } from '../../../lib/server/db';
import { sendRfqMails } from '../../../lib/server/mail';
import { collectUtmParams } from '../../../lib/server/attribution';

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

  // 1. Turnstile siteverify（fail-closed：密钥或 token 缺失即失败）
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

  // 2. honeypot 非空 / 填写时长 < 2000ms → 机器人判定。
  //    返回通用错误，不暴露判定细节（防对抗探测）。
  const candidate = asRecord(raw);
  const honeypot = candidate.honeypot;
  const formLoadedAt = candidate.formLoadedAt;
  const botLike =
    (typeof honeypot === 'string' && honeypot.length > 0) ||
    (typeof formLoadedAt === 'number' && Date.now() - formLoadedAt < FORM_MIN_FILL_MS);
  if (botLike) {
    return json(400, { code: 400, data: {}, message: 'Request rejected. Please try again.' });
  }

  // 3. Zod 校验 → 422 + data.fields 字段级错误
  const parsed = createRfqSchema.safeParse(raw);
  if (!parsed.success) {
    return json(422, {
      code: 422,
      data: { fields: zodErrorToFields(parsed.error) },
      message: 'Validation failed',
    });
  }

  // 4. rate limit：rfq 与 newsletter 各自独立计数（notes §5）
  const fp = await fingerprintRequest(request);
  const rl = rateLimit(`rfq:${clientIp(request)}:${fp}`);
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

  // 5. D1 单事务写入（reference 撞号重试 3 次在 db.ts 内闭环）
  const data = parsed.data;
  try {
    const saved = await persistRfq(env.DB, {
      contact: data.contact,
      shipping: data.shipping,
      items: data.items,
      message: data.message ?? null,
      sourcePage: data.sourcePage ?? null,
      utmJson: collectUtmParams(new URL(request.url).searchParams),
      locale: data.locale,
      turnstileScore: verdict.score ?? null,
    });

    // 6. 异步双邮件（E3/E4：失败只回写 mail_status，绝不影响已返回的 201）
    ctx.locals.cfContext.waitUntil(
      sendRfqMails(
        env.DB,
        {
          id: saved.id,
          reference: saved.reference,
          receivedAt: saved.receivedAt,
          respondBy: saved.respondBy,
          contact: {
            name: data.contact.name,
            email: data.contact.email,
            company: data.contact.company,
            country: data.contact.country,
          },
          items: data.items,
          message: data.message ?? null,
        },
        {
          RESEND_API_KEY: env.RESEND_API_KEY,
          MAIL_FROM: env.MAIL_FROM,
          SALES_MAILBOX: env.SALES_MAILBOX,
        },
      ),
    );

    return json(201, { code: 0, data: saved, message: '' });
  } catch (err) {
    // E6 铁律：写库失败必须 500 PERSIST_FAILED，严禁返回 201
    console.error('rfq persist failed', err instanceof PersistError ? err.message : err);
    return json(500, {
      code: 500,
      data: {},
      message: 'Failed to save your inquiry. Please email sales@example.com directly.',
    });
  }
};
