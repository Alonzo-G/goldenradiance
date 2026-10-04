// src/lib/server/db.ts — D1 数据访问（仅供 API 路由经 lib/server 边界使用）
// E6 铁律：写库失败必须向上抛 PersistError → 路由 500 PERSIST_FAILED，严禁吞错返回 201。

import { ulid } from './ulid';
import { generateReference } from './reference';

export class PersistError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersistError';
  }
}

export interface RfqContactInput {
  company: string;
  name: string;
  email: string;
  country: string;
  whatsapp?: string | null;
  website?: string | null;
}

export interface RfqShippingInput {
  destinationMarket: string;
  incoterm: string;
  quantityScale: string;
}

export interface RfqItemInput {
  sku: string;
  qty: number;
  note?: string | null;
}

export interface RfqRecordInput {
  contact: RfqContactInput;
  shipping: RfqShippingInput;
  items: RfqItemInput[];
  message?: string | null;
  sourcePage?: string | null;
  utmJson?: string | null;
  locale: string;
  turnstileScore?: number | null;
}

export interface PersistedRfq {
  id: string;
  reference: string;
  receivedAt: string;
  respondBy: string;
}

const RESPOND_WITHIN_HOURS = 8;

/** PRD §13.2 的 8 小时响应承诺。MVP 按连续 8 小时计，跨夜/周末语义留待 v2 后台排班。 */
export function computeRespondBy(receivedAt: Date): string {
  return new Date(receivedAt.getTime() + RESPOND_WITHIN_HOURS * 3_600_000).toISOString();
}

/**
 * rfq_inquiries + rfq_items 单事务写入（D1 batch 原子性）。
 * reference UNIQUE 撞号时 seq 重取并重试，最多 3 次（notes §4.2），
 * 仍失败抛 PersistError。其余任何 batch 失败同样抛 PersistError。
 */
export async function persistRfq(db: D1Database, input: RfqRecordInput): Promise<PersistedRfq> {
  const id = ulid();
  const receivedAt = new Date();
  const respondBy = computeRespondBy(receivedAt);
  const c = input.contact;

  const mainStatement = (reference: string) =>
    db
      .prepare(
        `INSERT INTO rfq_inquiries
           (id, reference, locale, company, contact_name, email, country, whatsapp, website,
            destination_market, incoterm, quantity_scale, message, source_page, utm_json,
            turnstile_score, mail_status, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, 'pending', ?17, ?18)`,
      )
      .bind(
        id,
        reference,
        input.locale,
        c.company,
        c.name,
        c.email,
        c.country,
        c.whatsapp ?? null,
        c.website ?? null,
        input.shipping.destinationMarket,
        input.shipping.incoterm,
        input.shipping.quantityScale,
        input.message ?? null,
        input.sourcePage ?? null,
        input.utmJson ?? null,
        input.turnstileScore ?? null,
        receivedAt.toISOString(),
        receivedAt.toISOString(),
      );

  const itemStatements = (inquiryId: string) =>
    input.items.map((item) =>
      db
        .prepare('INSERT INTO rfq_items (id, inquiry_id, sku, qty, note) VALUES (?1, ?2, ?3, ?4, ?5)')
        .bind(ulid(), inquiryId, item.sku, item.qty, item.note ?? null),
    );

  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = await generateReference(db, receivedAt);
    try {
      await db.batch([mainStatement(reference), ...itemStatements(id)]);
      return { id, reference, receivedAt: receivedAt.toISOString(), respondBy };
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('UNIQUE constraint failed: rfq_inquiries.reference')) {
        continue;
      }
      throw new PersistError(`D1 batch write failed: ${msg}`);
    }
  }
  const msg = lastError instanceof Error ? lastError.message : String(lastError);
  throw new PersistError(`reference collision persisted after 3 attempts: ${msg}`);
}

export type SubscribeOutcome = 'inserted' | 'already_exists';

/** newsletter 幂等写入：UNIQUE 冲突返回 already_exists（api-spec 409 语义为成功，不报错）。 */
export async function persistSubscriber(
  db: D1Database,
  email: string,
  locale: string,
  source: string | null,
): Promise<SubscribeOutcome> {
  try {
    await db
      .prepare('INSERT INTO newsletter_subscribers (id, email, locale, source) VALUES (?1, ?2, ?3, ?4)')
      .bind(ulid(), email, locale, source)
      .run();
    return 'inserted';
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE constraint failed: newsletter_subscribers.email')) {
      return 'already_exists';
    }
    throw new PersistError(`newsletter insert failed: ${msg}`);
  }
}

/** health 探针：SELECT 1，任何异常 = D1 不可达。 */
export async function probeDb(db: D1Database): Promise<boolean> {
  try {
    await db.prepare('SELECT 1').first();
    return true;
  } catch {
    return false;
  }
}

/** 邮件状态回写（E3/E4：失败标记 failed，不影响已返回的 201）。内部吞错只记日志。 */
export async function updateMailStatus(
  db: D1Database,
  id: string,
  status: 'sent' | 'failed' | 'skipped_dev',
): Promise<void> {
  try {
    await db
      .prepare('UPDATE rfq_inquiries SET mail_status = ?1, updated_at = ?2 WHERE id = ?3')
      .bind(status, new Date().toISOString(), id)
      .run();
  } catch (err) {
    console.error('updateMailStatus failed', { id, status, error: err });
  }
}
