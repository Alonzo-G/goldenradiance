// src/stores/compliance.ts — ComplianceContext（坑 §6.9：SSR 必须显式默认值 eu_uk，禁触 window）
import { persistentAtom } from '@nanostores/persistent';

export const MARKETS = ['eu_uk', 'us', 'middle_east', 'rest'] as const;
export type Market = (typeof MARKETS)[number];

function parseAndValidate(raw: string): Market {
  const v: unknown = (() => {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  })();
  return MARKETS.includes(v as Market) ? (v as Market) : 'eu_uk';
}

// localStorage key 严格为 compliance_v1（UIUX §16.1）
export const complianceContext = persistentAtom<Market>('compliance_v1', 'eu_uk', {
  encode: JSON.stringify,
  decode: parseAndValidate,
  listen: true,
});

export function setMarket(market: Market): void {
  complianceContext.set(market);
}
