// src/stores/rfq.ts — RFQ 篮（Nanostores persistentAtom，key 严格 rfq_v1，listen:true 跨标签页同步）
// AC-10：localStorage 持久 ≥7 天、免登录；条目超 7 天清理（客户端模块初始化时执行）。
import { computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';

export interface RfqEntry {
  sku: string;
  slug: string;
  title: string;
  qty: number;
  note?: string;
  addedAt: number;
}

export const RFQ_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MAX_QTY_PER_SKU = 999999;

function decode(raw: string): RfqEntry[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (it): it is RfqEntry =>
        !!it && typeof it === 'object' && typeof (it as RfqEntry).sku === 'string',
    );
  } catch {
    return [];
  }
}

export const rfqItems = persistentAtom<RfqEntry[]>('rfq_v1', [], {
  encode: JSON.stringify,
  decode,
  listen: true,
});

/** SKU 条目数（Header 徽标口径） */
export const rfqCount = computed(rfqItems, (items) => items.length);
/** 总件数 */
export const rfqPcs = computed(rfqItems, (items) =>
  items.reduce((n, it) => n + (Number.isFinite(it.qty) ? it.qty : 0), 0),
);

export function addToRfq(entry: Omit<RfqEntry, 'addedAt'>): void {
  const cur = rfqItems.get();
  const hit = cur.find((it) => it.sku === entry.sku);
  rfqItems.set(
    hit
      ? cur.map((it) => (it.sku === entry.sku ? { ...it, qty: entry.qty } : it))
      : [...cur, { ...entry, addedAt: Date.now() }],
  );
}

export function setQty(sku: string, qty: number): void {
  const clamped = Math.max(1, Math.min(MAX_QTY_PER_SKU, Math.floor(qty) || 1));
  rfqItems.set(rfqItems.get().map((it) => (it.sku === sku ? { ...it, qty: clamped } : it)));
}

export function setNote(sku: string, note: string): void {
  rfqItems.set(rfqItems.get().map((it) => (it.sku === sku ? { ...it, note } : it)));
}

export function removeItem(sku: string): void {
  rfqItems.set(rfqItems.get().filter((it) => it.sku !== sku));
}

export function clearRfq(): void {
  rfqItems.set([]);
}

/** 清理超期条目（>7 天）；在浏览器端模块初始化与提交前调用 */
export function pruneExpired(now: number = Date.now()): boolean {
  const cur = rfqItems.get();
  const kept = cur.filter((it) => now - (it.addedAt || 0) < RFQ_TTL_MS);
  if (kept.length !== cur.length) {
    rfqItems.set(kept);
    return true;
  }
  return false;
}
