// src/lib/products/line-aggregation.ts — 产品线 Landing 的视图数据（计数 / facet / 选品 / 栅格）
//
// 这个文件是「让两个页面从同一份数据里长出各自形态」的执行点：页面上不再出现
// `line === 'xxx' ? A : B`，钢线（2 品类 · 3 形态）与合金线（4 品类 · 8 款式族）的
// 差异全部由这里的计算结果决定。
//
// ============================ 确定性四条硬规则 ============================
// SSG 的产物必须可复现（同一 commit 两次构建逐字节相同），故：
//   1. 输入必须来自 getProducts()（已按 sku_code 升序），本文件**不重新 sort 输入**，
//      只在需要不同序时先复制（[...arr]）再 sort。
//   2. 每处 .sort() 的比较器**必须**有最终 tie-break 落到 sku_code 或字符串比较，
//      不允许出现「平局时依赖引擎稳定性」的写法（那是隐形 bug，见 queries.ts 注释）。
//   3. 禁用 Math.random / Date / crypto；禁止依赖 Set / Map 的迭代顺序取值——
//      需要有序结果时，一律先 [...map.values()] 物化成数组再 sort。
//   4. Map 只用于「分组 O(1) 查找」，不作为顺序来源。
// ============================ 选品算法（六条） ============================
// 第一版「按款式族 round-robin + 单族上限 2」已被全量 1012 款实测推翻：钢线会出
// 6 张里 4 个重复 SKU（SZGSS160 同时带 [cable, bangle]，跨族不去重）；合金线 6 张
// 全是 bracelet，necklace 占该线 25% 却零曝光。以下为修订版：
//   1. 桶 key = (category, sorted(style_tags))，**单桶硬上限 1 款** ← 天然跨族去重
//   2. 无款式标签的桶强制排最后 ← 合金线 111 款无标签不占前排
//   3. 品类保底 1 席（按品类规模降序）← 小品类不被埋
//   4. 剩余席位按桶 count desc 补齐（tie-break：category asc → 款式签名 asc）
//   5. 桶内取：图片张数 desc → sku_code asc
//   6. 渲染顺序按桶规模降序 ← 保底只决定「选谁」，不决定排位
//   7. 卡数 = min(6, 桶数)：**永不复制**。重复图是「一眼可见的凑数」，比只有 4 张难看。
// 实测产出（会被 vitest 与 Playwright 照抄，**不得**反过来写进实现）写在
// tests/line-aggregation.test.ts 里。
import type { ProductEntry } from './queries';
import { STYLE_MIN_COUNT, FORM_TAGS, MOTIF_TAGS } from './styles';
import { t } from '../../i18n';
import type { BreadcrumbItem } from '../seo/jsonld';

/** 人工指定 Hero 图兜底（line → 产品 slug）。仿 HomeCategories 的 CATEGORY_HERO_OVERRIDE。
 *  当前两条线的自动选图结果即实证意图所指，故为空表；需要换图时在此加一行，
 *  首页与落地页同时生效（本表被两处共同依赖，因此放在 lib 而不是组件里）。 */
export const LINE_HERO_OVERRIDE: Partial<Record<string, string>> = {};

/** rail 最多几张卡 */
export const RAIL_MAX = 6;

const imageCount = (entry: ProductEntry): number => entry.data.images?.length ?? 0;
const styleTagsOf = (entry: ProductEntry): string[] => entry.data.style_tags ?? [];
const bySku = (a: ProductEntry, b: ProductEntry): number =>
  a.data.sku_code.localeCompare(b.data.sku_code);

// ---------------------------------------------------------------- 款式 facet

export interface LineStyleFacet {
  tag: string;
  count: number;
}

/** 款式族计数（跨品类统计，口风与 /products/ 侧栏完全一致）。
 *  低于 STYLE_MIN_COUNT 的族不进 facet —— 阈值与目录页共用同一个常量，
 *  防「落地页点 chip → 目录页找不到这个 chip」。
 *  注意「不渲染 ≠ 失效」：低于阈值的深链照样出结果，由 catalog.ts 的 ghost checkbox 承接。 */
function buildStyleFacets(items: ProductEntry[], group: readonly string[]): LineStyleFacet[] {
  const counts = new Map<string, number>();
  for (const it of items) {
    for (const tag of styleTagsOf(it)) {
      if (group.includes(tag as (typeof group)[number])) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .filter((f) => f.count >= STYLE_MIN_COUNT)
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

// ---------------------------------------------------------------- 品类 facet

export interface LineCategoryFacet {
  value: string;
  count: number;
  /** 该品类的代表款：品类内主图张数最多者（同张数取 sku 升序）。
   *  用「最多图」而不是 find() 首个 —— 后者等同按 sku 抽样，会把无图款顶到门面。 */
  representative: ProductEntry | null;
}

function categoryCounts(items: ProductEntry[]): LineCategoryFacet[] {
  const counts = new Map<string, number>();
  for (const it of items) counts.set(it.data.category, (counts.get(it.data.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, representative: null }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

// ---------------------------------------------------------------- 选品

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
function bucketKey(category: string, styles: string[]): string {
  return `${category}|${[...styles].sort().join('+')}`;
}

function buildBuckets(items: ProductEntry[]): Bucket[] {
  const groups = new Map<string, ProductEntry[]>();
  for (const it of items) {
    const key = bucketKey(it.data.category, styleTagsOf(it));
    const group = groups.get(key);
    if (group) group.push(it);
    else groups.set(key, [it]);
  }
  const buckets = [...groups.values()].map((group) => {
    const head = [...group].sort((a, b) => imageCount(b) - imageCount(a) || bySku(a, b))[0];
    return {
      key: bucketKey(head.data.category, styleTagsOf(head)),
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
 */
function pickRepresentatives(facets: LineCategoryFacet[], buckets: Bucket[]): ProductEntry[] {
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

// ---------------------------------------------------------------- 栅格

/**
 * 卡数 → 栅格类名。**静态映射表**：Tailwind 在构建期扫描字面量，
 * `lg:grid-cols-${n}` 这类动态拼接不会生成对应 CSS，必错。
 */
export const RAIL_GRID_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

/**
 * 卡宽封顶 ≈336px 靠 wrapper 限宽，**不靠减列数** —— lg:grid-cols-2 在宽屏下会把
 * 1:1 卡撑到约 688px 高，是视觉灾难。卡数 ≥4 时自然宽度已 ≤284px，无需再限。
 */
export const RAIL_WRAPPER_MAXW: Record<number, string> = {
  1: 'max-w-[21rem]',
  2: 'lg:max-w-[42rem]',
  3: 'lg:max-w-[63rem]',
  4: '',
  5: '',
  6: '',
};

/**
 * sizes 按容器实际内容宽精确换算（痛点：写 `23vw` 在 1920 视口会算成 442px，
 * 而卡实际只有 184px → 浏览器白下 640 档，6 张卡多约 200KB）。
 * 宽度推导：落地页 main 是 container-page(1280，gutter 24) 内套 container-wide(gutter 24)，
 * 故区块内容宽 = 1280 − 24×4 = 1184px（≥1280px 视口恒定）。卡宽 = (1184 − gap×(n−1)) / n，
 * n=1..3 还要再受 RAIL_WRAPPER_MAXW 二次封顶（见上）。
 */
export const RAIL_SIZES: Record<number, string> = {
  1: '(min-width: 1280px) 336px, (min-width: 640px) 336px, 45vw',
  2: '(min-width: 1280px) 328px, (min-width: 1024px) 45vw, 45vw',
  3: '(min-width: 1280px) 325px, (min-width: 1024px) 30vw, (min-width: 640px) 28vw, 45vw',
  4: '(min-width: 1280px) 284px, (min-width: 1024px) 22vw, (min-width: 640px) 28vw, 45vw',
  5: '(min-width: 1280px) 224px, (min-width: 1024px) 18vw, (min-width: 640px) 28vw, 45vw',
  6: '(min-width: 1280px) 184px, (min-width: 1024px) 15vw, (min-width: 640px) 28vw, 45vw',
};

export function categoryGridClass(count: number): string {
  // 2 品类配 lg:grid-cols-6 = 「两张窄卡 + 右侧 4 列空白」，正是钢线的原病灶
  if (count <= 3) return count <= 1 ? 'grid-cols-1' : 'md:grid-cols-2';
  if (count === 4 || count === 5) return 'grid-cols-2 lg:grid-cols-4';
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
}

// ---------------------------------------------------------------- ViewModel

export interface LineViewModel {
  line: string;
  /** 线内 SKU 总数（诚实计数，不写「上千款」） */
  skuCount: number;
  /** 品类数 */
  typeCount: number;
  /** 款式族数（form + motif，达 STYLE_MIN_COUNT 阈值者） */
  familyCount: number;
  /** 无款式标签的款数（合金线 111、钢线 0） */
  untaggedCount: number;
  categories: LineCategoryFacet[];
  styleForms: LineStyleFacet[];
  styleMotifs: LineStyleFacet[];
  /** rail 选品结果，已按桶规模降序；**不含重复 SKU** */
  picks: ProductEntry[];
  /** rail 卡数 = min(6, 该线 (品类 × 款式签名) 组合数) */
  railCount: number;
  railGridClass: string;
  railWrapperMaxW: string;
  railSizes: string;
  /** 面包屑。UI 与 BreadcrumbList 结构化数据**共用这一个数组**，杜绝两边不一致。 */
  breadcrumb: BreadcrumbItem[];
}

export interface BuildLineViewModelInput {
  /** 产品线 slug */
  line: string;
  /** 内容集合里的显示名（面包屑末位、未登记线的兜底线名） */
  name: string;
  /** 线内可见产品。须来自 getProducts()（已按 sku_code 升序）；可见性过滤由调用方负责。 */
  items: ProductEntry[];
}

export function buildLineViewModel({ line, name, items }: BuildLineViewModelInput): LineViewModel {
  const categories = categoryCounts(items).map((facet) => ({
    ...facet,
    representative: items
      .filter((it) => it.data.category === facet.value && imageCount(it) > 0)
      .reduce<ProductEntry | null>(
        (best, it) => (!best || imageCount(it) > imageCount(best) ? it : best),
        null,
      ),
  }));

  const styleForms = buildStyleFacets(items, FORM_TAGS);
  const styleMotifs = buildStyleFacets(items, MOTIF_TAGS);
  const untaggedCount = items.filter((it) => styleTagsOf(it).length === 0).length;

  const buckets = buildBuckets(items);
  const picks = pickRepresentatives(categories, buckets);
  const railCount = picks.length;

  return {
    line,
    skuCount: items.length,
    typeCount: categories.length,
    familyCount: styleForms.length + styleMotifs.length,
    untaggedCount,
    categories,
    styleForms,
    styleMotifs,
    picks,
    railCount,
    railGridClass: RAIL_GRID_CLASS[railCount] ?? '',
    railWrapperMaxW: RAIL_WRAPPER_MAXW[railCount] ?? '',
    railSizes: RAIL_SIZES[railCount] ?? RAIL_SIZES[6],
    // 中间层链 /products/ 而非不存在的 /product-lines/ 索引页（那会是一个 404 链接）：
    // 落地页本身就是 /products/ 在线维度上的子集视图，层级语义正确且两侧同源。
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: t('nav.allProducts'), path: '/products/' },
      { name, path: `/product-lines/${line}/` },
    ],
  };
}
