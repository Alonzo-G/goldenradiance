// src/lib/products/recommend.ts — 产品线 rail 的选品算法（从 line-aggregation 抽出）
//
// 抽出的理由只有一条：单文件 ≤300 行是 P0 硬约束，而 line-aggregation.ts 已经
// 顶到 300 行——再加一行注释就越线。选品算法与「计数 / facet / 栅格映射」是两件事，
// 前者是「从一组产品里挑代表款」，后者是「把统计结果转成视图数据」，本就该分开。
//
// ============================ 确定性三条硬规则 ============================
// SSG 产物必须可复现（同一 commit 两次构建逐字节相同），故：
//   1. 输入不做 sort，只在需要不同序时先 [...arr] 复制再 sort。
//   2. 每处 .sort() 的比较器**必须**有最终 tie-break 落到 sku_code 或字符串比较。
//   3. 禁 Math.random / Date / crypto；不依赖 Set / Map 迭代顺序取值。
import type { ProductEntry } from './queries';

/** rail 最多几张卡 */
export const RAIL_MAX = 6;

/** 品类保底取款需要的 facet 形状（只读 value，避免把聚合层的类型拖进来形成循环依赖） */
export interface RecommendFacet {
  value: string;
}

const imageCount = (entry: ProductEntry): number => entry.data.images?.length ?? 0;
const styleTagsOf = (entry: ProductEntry): string[] => entry.data.style_tags ?? [];
const bySku = (a: ProductEntry, b: ProductEntry): number =>
  a.data.sku_code.localeCompare(b.data.sku_code);

interface Bucket {
  key: string;
  category: string;
  /** 排序后的款式签名，如 `bangle+cuff` */
  signature: string;
  count: number;
  /** 是否有款式标签；无标签桶整个排到队尾 */
  tagged: boolean;
  pick: ProductEntry;
}

/** 桶 key：品类 + 排序后的款式签名。同桶 =「同品类 + 完全相同的一组款式标签」。 */
export function bucketKeyOf(category: string, styles: string[]): string {
  return `${category}|${[...styles].sort().join('+')}`;
}

function buildBuckets(items: ProductEntry[]): Bucket[] {
  const groups = new Map<string, ProductEntry[]>();
  for (const it of items) {
    const key = bucketKeyOf(it.data.category, styleTagsOf(it));
    const group = groups.get(key);
    if (group) group.push(it);
    else groups.set(key, [it]);
  }
  const buckets = [...groups.values()].map((group) => {
    const head = [...group].sort((a, b) => imageCount(b) - imageCount(a) || bySku(a, b))[0];
    return {
      key: bucketKeyOf(head.data.category, styleTagsOf(head)),
      category: head.data.category,
      signature: [...styleTagsOf(head)].sort().join('+'),
      count: group.length,
      tagged: styleTagsOf(head).length > 0,
      pick: head,
    };
  });
  return buckets.sort(
    (a, b) =>
      b.count - a.count ||
      a.category.localeCompare(b.category) ||
      a.signature.localeCompare(b.signature),
  );
}

/**
 * 品类保底 → 按桶规模补齐 → 按桶规模重排（决定渲染顺序）。
 *
 * 「保底」只解决「小品类零曝光」：品类数 > 卡数上限时也能保证前几位不重复品类。
 * 但它**不决定排位** —— 否则钢线的 ring（占该线 0.7%）会占据第二个视觉位，
 * 等于把 Hero 刚赶走的失真换个形式请回来。
 *
 * 第一版「按款式族 round-robin + 单族上限 2」已被全量实测推翻：钢线会出 6 张里
 * 4 个重复 SKU（SZGSS160 同时带 [cable, bangle]，跨族不去重）；合金线 6 张全是
 * bracelet，necklace 占该线 25% 却零曝光。修订版用「(品类, 排序款式签名) 桶 +
 * 单桶硬上限 1」天然跨族去重，再叠加品类保底。
 *
 * 渲染顺序按桶规模降序；**卡数 = min(RAIL_MAX, 桶数)，永不复制**——
 * 重复图是「一眼可见的凑数」，比只有 4 张难看。
 */
export function pickRepresentatives(
  facets: readonly RecommendFacet[],
  items: ProductEntry[],
): ProductEntry[] {
  const buckets = buildBuckets(items);
  const total = Math.min(RAIL_MAX, buckets.length);
  const fillOrder = [...buckets.filter((b) => b.tagged), ...buckets.filter((b) => !b.tagged)];
  const chosen: Bucket[] = [];
  const taken = new Set<string>();

  for (const facet of facets) {
    if (chosen.length >= total) break;
    const candidate = fillOrder.find((b) => b.category === facet.value && !taken.has(b.key));
    if (candidate) {
      taken.add(candidate.key);
      chosen.push(candidate);
    }
  }
  for (const b of fillOrder) {
    if (chosen.length >= total) break;
    if (taken.has(b.key)) continue;
    taken.add(b.key);
    chosen.push(b);
  }
  return chosen
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.category.localeCompare(b.category) ||
        a.signature.localeCompare(b.signature),
    )
    .map((b) => b.pick);
}
