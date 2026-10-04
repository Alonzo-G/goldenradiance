// src/lib/admin/data.ts — 后台只读/状态流转查询（仅供 /admin API 经 lib/admin 边界使用）
// 与 lib/server/db.ts 的写路径分离：后台不写业务数据，只读 + 状态流转（status 字段）。
// 返回结构即 API JSON 契约（与 /admin 页面消费对齐）。

export interface AdminRfqRow {
  id: string;
  reference: string;
  status: string;
  company: string;
  contact_name: string;
  email: string;
  country: string;
  destination_market: string;
  quantity_scale: string;
  mail_status: string;
  created_at: string;
  item_count: number;
}

export interface AdminRfqDetail extends AdminRfqRow {
  whatsapp: string | null;
  website: string | null;
  incoterm: string;
  message: string | null;
  source_page: string | null;
  utm_json: string | null;
  turnstile_score: number | null;
  items: { sku: string; qty: number; note: string | null }[];
}

export interface AdminSubscriberRow {
  id: string;
  email: string;
  locale: string;
  source: string | null;
  status: string;
  created_at: string;
}

export interface AdminStats {
  totalInquiries: number;
  newInquiries: number;
  totalSubscribers: number;
  activeSubscribers: number;
  byStatus: Record<string, number>;
  byMarket: Record<string, number>;
  recent7dInquiries: number;
}

const VALID_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
export type RfqStatus = (typeof VALID_STATUSES)[number];

export function isValidStatus(v: string): v is RfqStatus {
  return (VALID_STATUSES as readonly string[]).includes(v);
}

/** 询盘列表（按时间倒序，可选 status 筛选），每项附带行项计数。 */
export async function listInquiries(
  db: D1Database,
  opts: { status?: string; limit?: number; offset?: number } = {},
): Promise<AdminRfqRow[]> {
  const limit = Math.min(opts.limit ?? 100, 500);
  const offset = opts.offset ?? 0;
  const where = opts.status && isValidStatus(opts.status) ? 'WHERE i.status = ?1' : '';
  const params = opts.status && isValidStatus(opts.status) ? [opts.status] : [];
  const rows = await db
    .prepare(
      `SELECT i.id, i.reference, i.status, i.company, i.contact_name, i.email, i.country,
              i.destination_market, i.quantity_scale, i.mail_status, i.created_at,
              (SELECT COUNT(*) FROM rfq_items it WHERE it.inquiry_id = i.id) AS item_count
         FROM rfq_inquiries i
         ${where}
         ORDER BY i.created_at DESC
         LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`,
    )
    .bind(...params, limit, offset)
    .all();
  return rows.results as unknown as AdminRfqRow[];
}

/** 询盘详情：主表 + 行项。 */
export async function getInquiry(db: D1Database, id: string): Promise<AdminRfqDetail | null> {
  const row = await db
    .prepare(
      `SELECT i.*, (SELECT COUNT(*) FROM rfq_items it WHERE it.inquiry_id = i.id) AS item_count
         FROM rfq_inquiries i WHERE i.id = ?1`,
    )
    .bind(id)
    .first();
  if (!row) return null;
  const items = await db
    .prepare('SELECT sku, qty, note FROM rfq_items WHERE inquiry_id = ?1 ORDER BY created_at ASC')
    .bind(id)
    .all();
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    reference: r.reference as string,
    status: r.status as string,
    company: r.company as string,
    contact_name: r.contact_name as string,
    email: r.email as string,
    country: r.country as string,
    destination_market: r.destination_market as string,
    quantity_scale: r.quantity_scale as string,
    mail_status: r.mail_status as string,
    created_at: r.created_at as string,
    item_count: (r.item_count as number) ?? 0,
    whatsapp: (r.whatsapp as string | null) ?? null,
    website: (r.website as string | null) ?? null,
    incoterm: r.incoterm as string,
    message: (r.message as string | null) ?? null,
    source_page: (r.source_page as string | null) ?? null,
    utm_json: (r.utm_json as string | null) ?? null,
    turnstile_score: (r.turnstile_score as number | null) ?? null,
    items: items.results as { sku: string; qty: number; note: string | null }[],
  };
}

/** 询盘状态流转（new → contacted → quoted → won/lost），回写 updated_at。 */
export async function updateInquiryStatus(
  db: D1Database,
  id: string,
  status: RfqStatus,
): Promise<boolean> {
  const res = await db
    .prepare('UPDATE rfq_inquiries SET status = ?1, updated_at = ?2 WHERE id = ?3')
    .bind(status, new Date().toISOString(), id)
    .run();
  return res.meta.changes > 0;
}

/** 订阅者列表（按时间倒序，可选 status）。 */
export async function listSubscribers(
  db: D1Database,
  opts: { status?: string; limit?: number; offset?: number } = {},
): Promise<AdminSubscriberRow[]> {
  const limit = Math.min(opts.limit ?? 200, 1000);
  const offset = opts.offset ?? 0;
  const where = opts.status && ['active', 'unsubscribed'].includes(opts.status) ? 'WHERE status = ?1' : '';
  const params = opts.status && ['active', 'unsubscribed'].includes(opts.status) ? [opts.status] : [];
  const rows = await db
    .prepare(
      `SELECT id, email, locale, source, status, created_at
         FROM newsletter_subscribers
         ${where}
         ORDER BY created_at DESC
         LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`,
    )
    .bind(...params, limit, offset)
    .all();
  return rows.results as unknown as AdminSubscriberRow[];
}

/** 订阅者退订/恢复状态流转。 */
export async function updateSubscriberStatus(
  db: D1Database,
  id: string,
  status: 'active' | 'unsubscribed',
): Promise<boolean> {
  const res = await db
    .prepare('UPDATE newsletter_subscribers SET status = ?1, updated_at = ?2 WHERE id = ?3')
    .bind(status, new Date().toISOString(), id)
    .run();
  return res.meta.changes > 0;
}

/** 看板统计：询盘数/订阅数 + 按状态/市场分布 + 近 7 日询盘趋势。 */
export async function getStats(db: D1Database): Promise<AdminStats> {
  const [inquiryCount, newCount, subCount, activeSubCount, byStatus, byMarket, recent7d] =
    await Promise.all([
      db.prepare('SELECT COUNT(*) AS c FROM rfq_inquiries').first(),
      db.prepare("SELECT COUNT(*) AS c FROM rfq_inquiries WHERE status = 'new'").first(),
      db.prepare('SELECT COUNT(*) AS c FROM newsletter_subscribers').first(),
      db.prepare("SELECT COUNT(*) AS c FROM newsletter_subscribers WHERE status = 'active'").first(),
      db
        .prepare('SELECT status, COUNT(*) AS c FROM rfq_inquiries GROUP BY status')
        .all(),
      db
        .prepare('SELECT destination_market, COUNT(*) AS c FROM rfq_inquiries GROUP BY destination_market')
        .all(),
      db
        .prepare(
          "SELECT COUNT(*) AS c FROM rfq_inquiries WHERE created_at >= datetime('now', '-7 days')",
        )
        .first(),
    ]);

  const statusMap: Record<string, number> = {};
  for (const r of byStatus.results as { status: string; c: number }[]) statusMap[r.status] = r.c;
  const marketMap: Record<string, number> = {};
  for (const r of byMarket.results as { destination_market: string; c: number }[]) {
    marketMap[r.destination_market] = r.c;
  }

  return {
    totalInquiries: (inquiryCount as { c: number }).c,
    newInquiries: (newCount as { c: number }).c,
    totalSubscribers: (subCount as { c: number }).c,
    activeSubscribers: (activeSubCount as { c: number }).c,
    byStatus: statusMap,
    byMarket: marketMap,
    recent7dInquiries: (recent7d as { c: number }).c,
  };
}
