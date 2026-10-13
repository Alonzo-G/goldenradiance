// src/lib/server/mail.ts — 询盘双邮件（内部通知 + 买家回执），Resend 或本地降级
// SPEC §5：RESEND_API_KEY 缺失时写 .dev/mail-outbox.jsonl，mail_status='skipped_dev'，
// API 契约不变，禁止因缺密钥返回 500（notes §3.2）。
// E3/E4：Resend 调用失败 → mail_status='failed' 回写 D1，不影响已返回的 201。

import { updateMailStatus } from './db';

export type MailStatus = 'sent' | 'failed' | 'skipped_dev';

export interface RfqMailPayload {
  id: string;
  reference: string;
  receivedAt: string;
  respondBy: string;
  contact: { name: string; email: string; company: string; country: string };
  items: Array<{ sku: string; qty: number; note?: string | null }>;
  message?: string | null;
}

export interface MailEnv {
  RESEND_API_KEY: string | undefined;
  MAIL_FROM: string;
  SALES_MAILBOX: string;
}

interface MailMessage {
  kind: 'internal_notification' | 'buyer_receipt';
  to: string;
  subject: string;
  html: string;
}

/**
 * HTML 转义：买家输入（公司 / 姓名 / 邮箱 / 留言 / 备注）进邮件模板前必经此函数。
 * 内部通知邮件按 HTML 渲染——不转义等于允许询盘者往销售邮箱注入任意标记
 * （伪造链接与按钮即钓鱼面）。数字字段（qty）经 Zod int 校验，仍一并转义做纵深防御。
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function itemsListHtml(payload: RfqMailPayload): string {
  return payload.items
    .map(
      (i) =>
        `<tr><td>${escapeHtml(i.sku)}</td><td>${escapeHtml(String(i.qty))}</td><td>${escapeHtml(i.note ?? '')}</td></tr>`,
    )
    .join('');
}

function internalNotificationMail(payload: RfqMailPayload): MailMessage {
  return {
    kind: 'internal_notification',
    to: 'SALES_MAILBOX', // 占位，发送前由 mailEnv 替换为真实收件箱
    // subject 是纯文本字段，不转义；reference 由服务端 generateReference 生成
    // （RFQ-YYYY-NNNN 格式），不含用户输入，无需防注入。
    subject: `New RFQ ${payload.reference}`,
    html: `<h2>New RFQ ${escapeHtml(payload.reference)}</h2>
<p>Company: ${escapeHtml(payload.contact.company)} (${escapeHtml(payload.contact.country)})</p>
<p>Contact: ${escapeHtml(payload.contact.name)} &lt;${escapeHtml(payload.contact.email)}&gt;</p>
<table border="1" cellpadding="4"><tr><th>SKU</th><th>Qty</th><th>Note</th></tr>${itemsListHtml(payload)}</table>
${payload.message ? `<p>Message: ${escapeHtml(payload.message)}</p>` : ''}`,
  };
}

function buyerReceiptMail(payload: RfqMailPayload): MailMessage {
  return {
    kind: 'buyer_receipt',
    to: payload.contact.email,
    subject: `We received your RFQ ${payload.reference}`,
    html: `<p>Hello ${escapeHtml(payload.contact.name)},</p>
<p>We received your inquiry ${escapeHtml(payload.reference)} and will respond within 8 hours.</p>
<p>Reference: ${escapeHtml(payload.reference)}</p>
<p>Respond by: ${escapeHtml(payload.respondBy)}</p>`,
  };
}

/**
 * 降级路径：JSONL 追加写入 .dev/mail-outbox.jsonl（notes §3.2 格式）。
 * 注意：@astrojs/cloudflare@14.3.3 的 dev 运行时是 workerd，node:fs 写真实磁盘
 * 会被拒绝（operation not permitted）。因此 fs 写失败时兜底输出带 [mail-outbox]
 * 前缀的结构化 JSONL 到 console（astro dev 下进入 .dev/astro-dev.log 等stdout 捕获），
 * 保证两封邮件在降级路径下永远可审计，且绝不阻断 201。
 */
async function appendOutbox(entry: Record<string, unknown>): Promise<void> {
  const line = JSON.stringify(entry);
  try {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = path.join(process.cwd(), '.dev');
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(path.join(dir, 'mail-outbox.jsonl'), line + '\n', 'utf8');
  } catch (err) {
    console.log(`[mail-outbox] ${line}`);
    console.error('mail outbox file append failed, logged to console instead', err);
  }
}

async function appendOutboxFor(
  mail: MailMessage,
  payload: RfqMailPayload,
  payloadExtra: Record<string, unknown>,
): Promise<void> {
  await appendOutbox({
    ts: new Date().toISOString(),
    kind: mail.kind,
    to: mail.kind === 'internal_notification' ? payloadExtra.salesMailbox : mail.to,
    reference: payload.reference,
    subject: mail.subject,
    mail_status: 'skipped_dev',
    payload: payloadExtra,
  });
}

/**
 * 发送双邮件并回写 mail_status。走 ctx.waitUntil 异步调用，返回值不影响 API 响应。
 * 降级判定：env.RESEND_API_KEY 为空字符串或 undefined（notes §3.2 第 1 点）。
 */
export async function sendRfqMails(
  db: D1Database,
  payload: RfqMailPayload,
  env: MailEnv,
): Promise<MailStatus> {
  if (!env.RESEND_API_KEY) {
    const internal = internalNotificationMail(payload);
    const receipt = buyerReceiptMail(payload);
    await appendOutboxFor(internal, payload, {
      respondBy: payload.respondBy,
      items: payload.items,
      message: payload.message ?? null,
      contact: payload.contact,
      salesMailbox: env.SALES_MAILBOX,
    });
    await appendOutboxFor(receipt, payload, { respondBy: payload.respondBy });
    await updateMailStatus(db, payload.id, 'skipped_dev');
    return 'skipped_dev';
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(env.RESEND_API_KEY);
    for (const mail of [internalNotificationMail(payload), buyerReceiptMail(payload)]) {
      const to = mail.kind === 'internal_notification' ? env.SALES_MAILBOX : mail.to;
      const { error } = await resend.emails.send({
        from: env.MAIL_FROM,
        to,
        subject: mail.subject,
        html: mail.html,
      });
      if (error) {
        throw new Error(error.message ?? 'resend send failed');
      }
    }
    await updateMailStatus(db, payload.id, 'sent');
    return 'sent';
  } catch (err) {
    console.error('RFQ mail send failed', { reference: payload.reference, error: err });
    await updateMailStatus(db, payload.id, 'failed');
    return 'failed';
  }
}
