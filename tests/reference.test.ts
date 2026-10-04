// tests/reference.test.ts — reference 拼装、取号与 persistRfq 撞号重试（D1 mock）
import { describe, it, expect } from 'vitest';
import { buildReference, generateReference } from '../src/lib/server/reference';
import { persistRfq, PersistError, type RfqRecordInput } from '../src/lib/server/db';

/**
 * 最小 MockD1：只实现 persistRfq/generateReference 走到的面。
 * 结构与 db.ts 消费的 D1 接口对齐，不依赖全局 workers-types。
 */
interface MockBoundStmt {
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  run<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: unknown }>;
}

interface MockDb {
  prepare(query: string): {
    bind(...values: unknown[]): MockBoundStmt;
    first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
    run<T = Record<string, unknown>>(): Promise<{ results: T[]; success: boolean; meta: unknown }>;
  };
  batch(statements: unknown[]): Promise<{ results: unknown[]; success: boolean; meta: unknown }[]>;
  exec(query: string): Promise<{ count: number; duration: number }>;
}

interface MockOptions {
  /** 前 N 次 batch 抛 UNIQUE 约束错误（模拟 reference 撞号）。 */
  failFirstBatches?: number;
  /** batch 抛出的错误消息。 */
  batchError?: string;
  /** 每次失败 batch 后 count 自增（模拟对端已有记录，seq 递增）。 */
  bumpCountOnFailure?: boolean;
}

function makeMockDb(options: MockOptions = {}) {
  const failFirstBatches = options.failFirstBatches ?? 0;
  let batchCalls = 0;
  let countValue = 0;
  let updateCalls = 0;

  const db: MockDb = {
    prepare(_query: string) {
      const bound: MockBoundStmt = {
        first: async <T>(): Promise<T | null> => countValue as T,
        run: async <T>(): Promise<{ results: T[]; success: boolean; meta: unknown }> => {
          if (_query.startsWith('UPDATE')) updateCalls++;
          return { results: [] as T[], success: true, meta: {} };
        },
      };
      return {
        bind: () => bound,
        first: bound.first,
        run: bound.run,
      };
    },
    async batch(statements: unknown[]) {
      batchCalls++;
      if (batchCalls <= failFirstBatches) {
        if (options.bumpCountOnFailure) countValue++;
        throw new Error(options.batchError ?? 'UNIQUE constraint failed: rfq_inquiries.reference');
      }
      return statements.map(() => ({ results: [], success: true, meta: {} }));
    },
    exec: async () => ({ count: 0, duration: 0 }),
  };

  return { db, batchCalls: () => batchCalls, updateCalls: () => updateCalls, setCount: (n: number) => { countValue = n; } };
}

const validInput: RfqRecordInput = {
  contact: { company: 'Maison Bleue', name: 'Claire Dubois', email: 'claire@maisonbleue.fr', country: 'FR' },
  shipping: { destinationMarket: 'eu_uk', incoterm: 'FOB', quantityScale: 'sample' },
  items: [{ sku: 'FB-2317', qty: 60 }],
  locale: 'en',
};

describe('buildReference', () => {
  it('RFQ-YYYY-NNNN 格式，seq 左侧补零到 4 位', () => {
    expect(buildReference(2026, 1)).toBe('RFQ-2026-0001');
    expect(buildReference(2026, 47)).toBe('RFQ-2026-0047');
  });

  it('seq 超过 9999 时自然展开（不截断）', () => {
    expect(buildReference(2026, 12345)).toBe('RFQ-2026-12345');
  });
});

describe('generateReference', () => {
  it('COUNT 为 47 时返回 0048；count 为 null（first 空表）按 0 处理', async () => {
    const { db, setCount } = makeMockDb();
    setCount(47);
    expect(await generateReference(db, new Date('2026-06-01T00:00:00Z'))).toBe('RFQ-2026-0048');
    setCount(0);
    expect(await generateReference(db, new Date('2026-01-01T00:00:00Z'))).toBe('RFQ-2026-0001');
  });
});

describe('persistRfq 撞号重试（notes §4.2：最多 3 次）', () => {
  it('前 2 次 batch 撞号，第 3 次成功：返回成功且 batch 共调用 3 次', async () => {
    const { db, batchCalls } = makeMockDb({ failFirstBatches: 2, bumpCountOnFailure: true });
    const saved = await persistRfq(db, validInput);
    expect(batchCalls()).toBe(3);
    expect(saved.reference).toMatch(/^RFQ-\d{4}-\d{4,}$/);
    // 撞号后 seq 递增：第 3 次取号时 count=2 → seq=3
    expect(saved.reference.endsWith('-0003')).toBe(true);
  });

  it('3 次全部撞号：抛 PersistError（路由层必须转 500 PERSIST_FAILED）', async () => {
    const { db, batchCalls } = makeMockDb({ failFirstBatches: 3, bumpCountOnFailure: true });
    await expect(persistRfq(db, validInput)).rejects.toBeInstanceOf(PersistError);
    expect(batchCalls()).toBe(3);
  });

  it('非撞号错误（如连接失败）不重试，立即抛 PersistError', async () => {
    const { db, batchCalls } = makeMockDb({ failFirstBatches: 1, batchError: 'D1 connection reset' });
    await expect(persistRfq(db, validInput)).rejects.toBeInstanceOf(PersistError);
    expect(batchCalls()).toBe(1);
  });

  it('首次成功：respondBy = receivedAt + 8 小时，id 为 26 位 ULID 格式', async () => {
    const { db } = makeMockDb();
    const saved = await persistRfq(db, validInput);
    expect(saved.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(new Date(saved.respondBy).getTime() - new Date(saved.receivedAt).getTime()).toBe(
      8 * 3_600_000,
    );
  });
});
