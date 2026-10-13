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

describe('sendRfqMails HTML 转义（2026-10-13 安全修复）', () => {
  // 背景：内部通知邮件按 HTML 渲染，买家输入原样插值 = 可往销售邮箱注入
  // 任意标记（伪造链接/按钮即钓鱼面）。修复：所有用户输入经 escapeHtml。
  // 黑盒验证：stub fetch 捕获 Resend 实际发出的请求体，断言恶意标记已成实体。
  it('两封邮件的正文中，用户输入不再含可执行标记', async () => {
    const sent: Array<Record<string, any>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: RequestInit) => {
        sent.push(JSON.parse(String(init.body)));
        return new Response(JSON.stringify({ id: 'email_ok' }), { status: 200 });
      }),
    );

    const evil = {
      ...payload,
      contact: {
        name: '<script>alert(1)</script>',
        email: 'x@y.z',
        company: 'A & B <img src=x onerror=alert(1)>',
        country: 'FR',
      },
      items: [{ sku: 'FB-2317', qty: 60, note: '<b>bold</b>' }],
      message: '<a href="http://evil.example">click</a>',
    };

    const { db } = makeMockDb();
    const status = await sendRfqMails(db, evil, { ...devEnv, RESEND_API_KEY: 're_fake_key' });
    expect(status).toBe('sent');
    expect(sent).toHaveLength(2); // 内部通知 + 买家回执

    const [internal, receipt] = sent;
    // 姓名进两封邮件 → 两封都必须是实体
    for (const body of sent) {
      expect(body.html).not.toContain('<script>');
      expect(body.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    }
    // 公司/备注/留言只进内部通知
    expect(internal.html).not.toContain('<img src=x');
    expect(internal.html).toContain('A &amp; B &lt;img src=x onerror=alert(1)&gt;');
    expect(internal.html).toContain('&lt;b&gt;bold&lt;/b&gt;');
    expect(internal.html).toContain('&lt;a href=&quot;http://evil.example&quot;&gt;click&lt;/a&gt;');
    // 回执邮件不带这些字段，但也绝不允许原样标记漏过去
    expect(receipt.html).not.toContain('<script>');
    vi.unstubAllGlobals();
  });
});
