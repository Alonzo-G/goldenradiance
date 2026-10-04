// tests/mail.test.ts — 邮件降级路径（SPEC §5 / notes §3.2）在 Node 运行时的真实文件验证
// workerd dev 运行时无法写真实磁盘（fs 被 workerd 沙箱拒绝），因此文件级降级
// 由 Node 侧（vitest）验证：.dev/mail-outbox.jsonl 追加两行，返回 'skipped_dev'。
// Resend 失败分支（mail_status='failed'）通过 stub fetch 触发。
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sendRfqMails } from '../src/lib/server/mail';

const OUTBOX = join(process.cwd(), '.dev', 'mail-outbox.jsonl');

interface MockDb {
  prepare(query: string): {
    bind(...values: unknown[]): { run(): Promise<unknown> };
    first(): Promise<unknown>;
    run(): Promise<unknown>;
  };
  batch(statements: unknown[]): Promise<unknown[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

function makeMockDb() {
  const updates: Array<[string, string]> = [];
  return {
    db: {
      prepare(query: string) {
        return {
          bind(...values: unknown[]) {
            return {
              run: async () => {
                if (query.startsWith('UPDATE')) {
                  updates.push([values[0] as string, values[2] as string]);
                }
                return { results: [], success: true, meta: {} };
              },
            };
          },
          first: async () => null,
          run: async () => ({ results: [], success: true, meta: {} }),
        };
      },
      batch: async () => [],
      exec: async () => ({ count: 0, duration: 0 }),
    } as unknown as MockDb,
    updates: () => updates,
  };
}

const payload = {
  id: '01M3W1NHZSYED4658EEFET40EA',
  reference: 'RFQ-2026-0001',
  receivedAt: '2026-10-01T15:34:59.833Z',
  respondBy: '2026-10-01T23:34:59.833Z',
  contact: { name: 'Claire Dubois', email: 'claire@maisonbleue.fr', company: 'Maison Bleue', country: 'FR' },
  items: [{ sku: 'FB-2317', qty: 60, note: null }],
  message: null,
};

const devEnv = { RESEND_API_KEY: undefined, MAIL_FROM: 'RFQ System <rfq@example.com>', SALES_MAILBOX: 'sales@example.com' };

function outboxLines(): string[] {
  if (!existsSync(OUTBOX)) return [];
  return readFileSync(OUTBOX, 'utf8').split('\n').filter((l) => l.trim().length > 0);
}

beforeEach(() => {
  mkdirSync(join(process.cwd(), '.dev'), { recursive: true });
  // 不清空产物文件：用例间以增量断言隔离，测试结束后保留 skipped_dev 记录
  // （.dev/ 已 gitignore；该文件即 SPEC §5 降级路径的可审计产物）。
});

describe('sendRfqMails 降级路径（RESEND_API_KEY 缺失）', () => {
  it('写入两行 JSONL：internal_notification + buyer_receipt，返回 skipped_dev', async () => {
    const before = outboxLines().length;
    const { db, updates } = makeMockDb();
    const status = await sendRfqMails(db, payload, devEnv);
    expect(status).toBe('skipped_dev');

    const lines = outboxLines().slice(before).map((l) => JSON.parse(l));
    expect(lines).toHaveLength(2);

    expect(lines[0].kind).toBe('internal_notification');
    expect(lines[0].to).toBe('sales@example.com');
    expect(lines[0].reference).toBe('RFQ-2026-0001');
    expect(lines[0].subject).toBe('New RFQ RFQ-2026-0001');
    expect(Array.isArray(lines[0].payload.items)).toBe(true);

    expect(lines[1].kind).toBe('buyer_receipt');
    expect(lines[1].to).toBe('claire@maisonbleue.fr');
    expect(lines[1].payload.respondBy).toBe('2026-10-01T23:34:59.833Z');

    // mail_status 回写 D1
    expect(updates()).toContainEqual(['skipped_dev', '01M3W1NHZSYED4658EEFET40EA']);
  });

  it('空字符串密钥同样走降级（notes §3.2：空串或 undefined）', async () => {
    const before = outboxLines().length;
    const { db } = makeMockDb();
    const status = await sendRfqMails(db, payload, { ...devEnv, RESEND_API_KEY: '' });
    expect(status).toBe('skipped_dev');
    expect(outboxLines().length - before).toBe(2);
  });
});

describe('sendRfqMails Resend 失败分支（E3/E4：不影响已返回的 201）', () => {
  it('网络失败 → 返回 failed 并回写 mail_status=failed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      }),
    );
    const { db, updates } = makeMockDb();
    const status = await sendRfqMails(db, payload, { ...devEnv, RESEND_API_KEY: 're_fake_key' });
    expect(status).toBe('failed');
    expect(updates()).toContainEqual(['failed', '01M3W1NHZSYED4658EEFET40EA']);
    vi.unstubAllGlobals();
  });

  it('Resend 返回 error 对象 → 返回 failed 并回写', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: { message: 'validation_error' } }), { status: 422 })),
    );
    const { db, updates } = makeMockDb();
    const status = await sendRfqMails(db, payload, { ...devEnv, RESEND_API_KEY: 're_fake_key' });
    expect(status).toBe('failed');
    expect(updates()).toContainEqual(['failed', '01M3W1NHZSYED4658EEFET40EA']);
    vi.unstubAllGlobals();
  });
});
