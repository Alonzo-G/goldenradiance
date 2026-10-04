// src/lib/products/sku-index.ts — SKU 双层索引纯函数（L1 精确 / L2 did-you-mean ≤2）
import type { SkuIndexItem } from './queries';

/** L1：SKU 精确匹配（大小写不敏感、容忍首尾空格） */
export function exactMatch(items: SkuIndexItem[], query: string): SkuIndexItem | undefined {
  const q = query.trim().toUpperCase();
  return items.find((it) => it.sku.toUpperCase() === q);
}

/** 编辑距离（≤2 才用于 did-you-mean，避免千级列表 O(n·m) 全量计算） */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

/** L2：编辑距离 ≤2 的最近候选 */
export function suggestSku(items: SkuIndexItem[], query: string): SkuIndexItem | undefined {
  const q = query.trim().toUpperCase();
  if (q.length < 3) return undefined;
  let best: { item: SkuIndexItem; dist: number } | undefined;
  for (const it of items) {
    const dist = levenshtein(it.sku.toUpperCase(), q);
    if (dist <= 2 && (!best || dist < best.dist)) best = { item: it, dist };
  }
  return best?.item;
}

/** 文本子串匹配（title / material / plating / category / dimensions；未确认字段自动跳过）
 *  加轻量容错：查询词与被匹配文本都做「常见拼写变体 + 品类单复数」归一，
 *  让 "earing"/"earings"/"jewelery" 能命中 "earring"/"jewelry"（海外非母语买家常见）。
 *  仅做白名单变体替换，不做宽泛词干化——避免把 "brass"/"glass" 误归一。 */
export function textMatch(items: SkuIndexItem[], query: string): SkuIndexItem[] {
  const q = normalizeToken(query.trim());
  if (!q) return [];
  return items.filter((it) => {
    const hay = normalizeToken(
      [it.sku, it.title, it.slug, it.material, it.plating, it.dimensions, it.category]
        .filter((v): v is string => !!v && !!v.trim())
        .join(' '),
    );
    return hay.includes(q);
  });
}

/** 白名单变体归一：常见拼错 + 品类单复数。只替换明确变体，其余原样保留。 */
const SPELL_VARIANTS: [RegExp, string][] = [
  [/earings\b/g, 'earring'],
  [/earing\b/g, 'earring'],
  [/earrings\b/g, 'earring'],
  [/jewellery\b/g, 'jewelry'],
  [/jewelery\b/g, 'jewelry'],
  [/braclet\b/g, 'bracelet'],
  [/braclets\b/g, 'bracelet'],
  [/bracelets\b/g, 'bracelet'],
  [/neckless\b/g, 'necklace'],
  [/necklaces\b/g, 'necklace'],
  [/hoops\b/g, 'hoop'],
];

function normalizeToken(s: string): string {
  let out = s.toLowerCase();
  for (const [re, rep] of SPELL_VARIANTS) out = out.replace(re, rep);
  return out;
}
