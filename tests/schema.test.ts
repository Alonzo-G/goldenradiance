// tests/schema.test.ts — 请求体 Zod 校验矩阵（api-spec.yaml 契约）
import { describe, it, expect } from 'vitest';
import {
  createRfqSchema,
  subscribeSchema,
  zodErrorToFields,
} from '../src/lib/rfq/schema';

const validRfq = {
  turnstileToken: '0.AbcDEF123456',
  honeypot: '',
  formLoadedAt: Date.now() - 60_000,
  contact: {
    company: 'Maison Bleue',
    name: 'Claire Dubois',
    email: 'claire@maisonbleue.fr',
    country: 'FR',
  },
  shipping: { destinationMarket: 'eu_uk', incoterm: 'FOB', quantityScale: 'sample' },
  items: [{ sku: 'FB-2317', qty: 60 }],
  locale: 'en',
};

const validSubscribe = {
  turnstileToken: '0.AbcDEF123456',
  honeypot: '',
  email: 'buyer@example.com',
  locale: 'en',
};

describe('createRfqSchema 合法矩阵', () => {
  it('api-spec minimal example 通过，locale 默认/显式 en 均可', () => {
    const parsed = createRfqSchema.safeParse(validRfq);
    expect(parsed.success).toBe(true);
  });

  it('缺省 locale 自动补 en；可选字段可省略', () => {
    const { locale, message, sourcePage } = createRfqSchema.parse({
      ...validRfq,
      locale: undefined,
    });
    expect(locale).toBe('en');
    expect(message).toBeUndefined();
    expect(sourcePage).toBeUndefined();
  });

  it('可选 whatsapp/website/message/items.note 通过', () => {
    const parsed = createRfqSchema.safeParse({
      ...validRfq,
      contact: { ...validRfq.contact, whatsapp: '+33612345678', website: 'https://maisonbleue.fr' },
      items: [{ sku: 'FB-2317', qty: 60, note: 'need 18K PVD gold' }],
      message: 'Looking for 316L line.',
      sourcePage: '/products/fb-2317/',
    });
    expect(parsed.success).toBe(true);
  });
});

describe('createRfqSchema 错误矩阵', () => {
  const cases: Array<[name: string, mutate: (body: Record<string, unknown>) => unknown, field: string]> = [
    ['items 空数组', (b) => ({ ...b, items: [] }), 'items'],
    ['items 超 50 条', (b) => ({ ...b, items: Array.from({ length: 51 }, () => ({ sku: 'FB-2317', qty: 1 })) }), 'items'],
    ['缺 contact.email', (b) => ({ ...b, contact: { company: 'C', name: 'N', country: 'FR' } }), 'contact.email'],
    ['email 格式错误', (b) => ({ ...b, contact: { ...b.contact, email: 'not-an-email' } }), 'contact.email'],
    ['country 小写 fr', (b) => ({ ...b, contact: { ...b.contact, country: 'fr' } }), 'contact.country'],
    ['country 三字母 FRA', (b) => ({ ...b, contact: { ...b.contact, country: 'FRA' } }), 'contact.country'],
    ['incoterm 非法枚举 DAP', (b) => ({ ...b, shipping: { ...b.shipping, incoterm: 'DAP' } }), 'shipping.incoterm'],
    ['destinationMarket 非法枚举', (b) => ({ ...b, shipping: { ...b.shipping, destinationMarket: 'eu' } }), 'shipping.destinationMarket'],
    ['quantityScale 非法枚举', (b) => ({ ...b, shipping: { ...b.shipping, quantityScale: 'huge' } }), 'shipping.quantityScale'],
    ['sku 小写/过短', (b) => ({ ...b, items: [{ sku: 'fb', qty: 1 }] }), 'items.0.sku'],
    ['qty 为 0', (b) => ({ ...b, items: [{ sku: 'FB-2317', qty: 0 }] }), 'items.0.qty'],
    ['qty 非整数', (b) => ({ ...b, items: [{ sku: 'FB-2317', qty: 1.5 }] }), 'items.0.qty'],
    ['honeypot 非空（schema 层兜底）', (b) => ({ ...b, honeypot: 'spammy text' }), 'honeypot'],
    ['turnstileToken 空串', (b) => ({ ...b, turnstileToken: '' }), 'turnstileToken'],
    ['formLoadedAt 非整数', (b) => ({ ...b, formLoadedAt: 1.5 }), 'formLoadedAt'],
    ['locale 非法枚举', (b) => ({ ...b, locale: 'fr' }), 'locale'],
    ['message 超 2000', (b) => ({ ...b, message: 'x'.repeat(2001) }), 'message'],
    ['缺 shipping 整体', (b) => { const { shipping: _s, ...rest } = b; return rest; }, 'shipping'],
  ];

  for (const [name, mutate, field] of cases) {
    it(name, () => {
      const parsed = createRfqSchema.safeParse(mutate({ ...validRfq }));
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        const fields = zodErrorToFields(parsed.error);
        expect(fields[field]).toBeTruthy();
      }
    });
  }
});

describe('subscribeSchema', () => {
  it('合法订阅通过', () => {
    expect(subscribeSchema.safeParse(validSubscribe).success).toBe(true);
  });

  it('formLoadedAt 可选；提供时必须为非负整数', () => {
    expect(subscribeSchema.safeParse({ ...validSubscribe, formLoadedAt: Date.now() }).success).toBe(true);
    expect(subscribeSchema.safeParse({ ...validSubscribe, formLoadedAt: -1 }).success).toBe(false);
  });

  it('email 缺失/格式错误 → 422 fields.email', () => {
    const bad = subscribeSchema.safeParse({ ...validSubscribe, email: 'nope' });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(zodErrorToFields(bad.error).email).toBeTruthy();
    }
  });

  it('honeypot 非空 → 校验失败', () => {
    expect(subscribeSchema.safeParse({ ...validSubscribe, honeypot: 'x' }).success).toBe(false);
  });
});

describe('zodErrorToFields', () => {
  it('多字段错误全部收集，路径以 . 连接', () => {
    const parsed = createRfqSchema.safeParse({
      ...validRfq,
      contact: { ...validRfq.contact, email: 'bad', country: 'fr' },
      shipping: { ...validRfq.shipping, incoterm: 'DAP' },
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fields = zodErrorToFields(parsed.error);
      expect(Object.keys(fields)).toEqual(
        expect.arrayContaining(['contact.email', 'contact.country', 'shipping.incoterm']),
      );
    }
  });
});
