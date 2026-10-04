// src/lib/rfq/schema.ts — API 请求体 Zod 校验（api-spec.yaml CreateRfqRequest / SubscribeRequest）
// §11.2 坑：Zod 一律从 astro/zod 导入，独立安装 zod 即违规。

import { z } from 'astro/zod';

export const destinationMarkets = ['eu_uk', 'us', 'middle_east', 'other'] as const;
export const incoterms = ['EXW', 'FOB', 'CIF', 'DDP', 'UNSURE'] as const;
export const quantityScales = ['sample', 'small', 'bulk'] as const;
export const locales = ['en', 'zh'] as const;

const countryRegex = /^[A-Z]{2}$/;
const skuRegex = /^[A-Z0-9-]{3,32}$/;

export const contactSchema = z.object({
  company: z.string().min(1).max(120),
  name: z.string().min(1).max(80),
  email: z.string().email().max(254),
  country: z.string().regex(countryRegex, 'Must be ISO 3166-1 alpha-2'),
  whatsapp: z.string().max(32).nullable().optional(),
  website: z.string().url().max(2048).nullable().optional(),
});

export const shippingSchema = z.object({
  destinationMarket: z.enum(destinationMarkets),
  incoterm: z.enum(incoterms),
  quantityScale: z.enum(quantityScales),
});

export const rfqItemSchema = z.object({
  sku: z.string().regex(skuRegex),
  qty: z.number().int().min(1).max(1000000),
  note: z.string().max(500).nullable().optional(),
});

export const createRfqSchema = z.object({
  turnstileToken: z.string().min(1).max(2048),
  honeypot: z.string().max(0),
  formLoadedAt: z.number().int().min(0),
  contact: contactSchema,
  shipping: shippingSchema,
  items: z.array(rfqItemSchema).min(1).max(50),
  message: z.string().max(2000).nullable().optional(),
  sourcePage: z.string().max(512).nullable().optional(),
  locale: z.enum(locales).default('en'),
});

export const subscribeSchema = z.object({
  turnstileToken: z.string().min(1).max(2048),
  honeypot: z.string().max(0),
  formLoadedAt: z.number().int().min(0).optional(),
  email: z.string().email().max(254),
  source: z.string().max(64).nullable().optional(),
  locale: z.enum(locales).default('en'),
});

export type RfqPayload = z.infer<typeof createRfqSchema>;
export type SubscribePayload = z.infer<typeof subscribeSchema>;

/** Zod 错误 → api-spec data.fields 形态（字段路径 '.' 连接 → 首条错误消息）。 */
export function zodErrorToFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!(key in fields)) {
      fields[key] = issue.message;
    }
  }
  return fields;
}
