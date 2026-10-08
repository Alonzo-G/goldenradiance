// src/lib/products/queries.ts — 产品集合查询与视图数据（坑 §11.8：getCollection 后必须显式 sort）
import { getCollection, type CollectionEntry } from 'astro:content';
import {
  moqBand,
  overallRange,
  specStrip,
  RFQ_DEFAULT_QTY,
  type MoqBand,
} from '../shared/format';

export type ProductEntry = CollectionEntry<'products'>;
export type ProductData = ProductEntry['data'];

/** 占位种子数据（dataStatus: 'placeholder'）是否对公众可见。2026-10-03 起关闭。
 *
 * 关闭原因：占位款是两态内容模型的字段基准，被 tests/content-contract.test.ts
 * 强制要求规格齐全，因此**必然携带编造的 tiered_price 与 MOQ**；而真实素材款
 * 无任何价格来源，一律走「Price on request / Confirmed with your quotation」降级。
 * 两者并排出现在 /products/ 时，占位款是全站唯一带具体数字的卡片，买家无从分辨
 * 哪张有真实货源——等于把编造价当成我们的报价对外发布。
 *
 * 关闭方式为**只撤展示、不动文件**：21 个内容文件保留在 src/content/products/，
 * 仍是 content-contract 测试的断言基准与真实素材到位前的字段形状参照。
 * 撤下的公开面：/products/ 列表与筛选、三条产品线页、首页「New this week」rail、
 * PDP 静态路由（21 条）与 sitemap 条目。
 *
 * 恢复方式：改回 true 并重建即可全站复原，无需改任何页面代码。 */
export const SHOW_PLACEHOLDER_PRODUCTS = false;

/** 该款是否允许出现在公开面（占位种子数据默认不公开） */
export function isPublicProduct(entry: ProductEntry): boolean {
  return SHOW_PLACEHOLDER_PRODUCTS || entry.data.dataStatus !== 'placeholder';
}

/** 公开产品集合，按 sku_code 排序（顺序确定性硬要求）
 *  这是全站唯一的集合入口——列表/路由/首页/产品线/sitemap 均经由它，
 *  可见性策略只需在这一处维护。 */
export async function getProducts(): Promise<ProductEntry[]> {
  const items = await getCollection('products');
  return items
    .filter(isPublicProduct)
    .sort((a, b) => a.data.sku_code.localeCompare(b.data.sku_code));
}

export async function getProductBySlug(slug: string): Promise<ProductEntry | undefined> {
  const items = await getProducts();
  return items.find((it) => it.data.slug === slug);
}

export function byLine(items: ProductEntry[], line: string): ProductEntry[] {
  return items.filter((it) => it.data.line === line);
}

/** 有公开产品的产品线定义（按 content.config.ts 的 LINE_IDS 顺序），
 *  供导航/首页/页脚入口使用——空线（如未来补货前暂无货的线）自动不展示，
 *  补货后无需改任何组件代码即自动恢复。 */
export async function getActiveLines(): Promise<CollectionEntry<'productLines'>[]> {
  const [products, lines] = await Promise.all([getProducts(), getCollection('productLines')]);
  const activeIds = new Set(products.map((p) => p.data.line));
  const order = new Map(lines.map((l, i) => [l.data.line, i]));
  return lines
    .filter((l) => activeIds.has(l.data.line))
    .sort((a, b) => (order.get(a.data.line) ?? 0) - (order.get(b.data.line) ?? 0));
}

/** 产品线「视觉代表款」：该线视觉素材最丰富的 real 产品（图多 > 风格标签多）。
 *  供首页 Hero / Lines 区块统一使用——同一屏内不允许「真实图 vs 占位图」混排，
 *  那是「货还没上」最直观的误判信号。 */
export function heroImageForLine(
  products: ProductEntry[],
  line: string,
): { src: string; thumb: string; alt: string; width?: number; height?: number; slug: string; title: string } | null {
  const pool = products
    .filter((p) => p.data.line === line && p.data.dataStatus === 'real' && p.data.images?.length)
    .sort(
      (a, b) =>
        (b.data.images?.length ?? 0) - (a.data.images?.length ?? 0) ||
        (b.data.style_tags?.length ?? 0) - (a.data.style_tags?.length ?? 0),
    );
  const pick = pool[0];
  if (!pick) return null;
  const img = pick.data.images![0];
  return {
    src: img.src,
    thumb: img.thumb,
    alt: img.alt || pick.data.title,
    width: img.width,
    height: img.height,
    slug: pick.data.slug,
    title: pick.data.title,
  };
}

/** PDP「Same series」：同产品线其他款 */
export function sameSeries(items: ProductEntry[], entry: ProductEntry, limit = 6): ProductEntry[] {
  return byLine(items, entry.data.line)
    .filter((it) => it.data.sku_code !== entry.data.sku_code)
    .slice(0, limit);
}

/** PDP「Often paired with」：跨产品线推荐（其余两线各取） */
export function crossLine(items: ProductEntry[], entry: ProductEntry, limit = 4): ProductEntry[] {
  return items
    .filter((it) => it.data.line !== entry.data.line)
    .filter((it, idx, arr) => arr.findIndex((x) => x.data.line === it.data.line) === idx)
    .slice(0, limit);
}

/** 目录筛选/搜索共用的内联 SKU 索引结构
 *  可空字段 = 该款尚未确认（真实素材），UI 一律走「随报价确认」降级，禁止填未核实数值。 */
export interface SkuIndexImage {
  src: string;
  thumb: string;
  alt: string;
  /** 主图原始像素尺寸（写进 <img> 防 CLS；缩略图沿用同一比例） */
  width?: number;
  height?: number;
}

export interface SkuIndexItem {
  sku: string;
  slug: string;
  title: string;
  line: string;
  category: string;
  material: string | null;
  plating: string | null;
  dimensions: string | null;
  /** 已格式化的材质·镀层·尺寸串；为空表示三项均未确认 */
  spec: string;
  moqMin: number | null;
  moqMax: number | null;
  band: MoqBand | null;
  priceLow: number | null;
  priceHigh: number | null;
  /** RFQ 数量种子：有确认 MOQ 用 MOQ，否则站点默认起订量（不冒充该款 MOQ） */
  rfqQty: number;
  earPost: boolean;
  complianceTag: string;
  image: SkuIndexImage | null;
  dataStatus: 'placeholder' | 'real';
  /** 使用场景（由产品线映射，§2.2） */
  scenario: Scenario;
}

export function toSkuIndexItem(entry: ProductEntry): SkuIndexItem {
  const d = entry.data;
  const range = overallRange(d.tiered_price);
  const first = d.images?.[0];
  return {
    sku: d.sku_code,
    slug: d.slug,
    title: d.title,
    line: d.line,
    category: d.category,
    material: d.base_material_grade ?? null,
    plating: d.plating_method ?? null,
    dimensions: d.dimensions_mm ?? null,
    spec: specStrip(d.base_material_grade, d.plating_method, d.dimensions_mm),
    moqMin: d.moq_min ?? null,
    moqMax: d.moq_max ?? null,
    band: moqBand(d.moq_min),
    priceLow: range?.low ?? null,
    priceHigh: range?.high ?? null,
    rfqQty: d.moq_min ?? RFQ_DEFAULT_QTY,
    earPost: d.ear_post,
    complianceTag: d.compliance_tag,
    image: first
      ? {
          src: first.src,
          thumb: first.thumb,
          alt: first.alt || d.title,
          width: first.width,
          height: first.height,
        }
      : null,
    dataStatus: d.dataStatus,
    scenario: (SCENARIO_OF_LINE[d.line] ?? 'volume') as Scenario,
  };
}

export async function getSkuIndex(): Promise<SkuIndexItem[]> {
  const items = await getProducts();
  return items.map(toSkuIndexItem);
}

/**
 * 使用场景映射（§2.2）：产品线 → 买家经营场景。
 * 场景是产品线的语义化别名，不是独立产品属性——两条线的差异化卖点（耐久 vs 走量）
 * 用买家能秒懂的「使用场景」语言表达，避免「产品线」「使用场景」两个名词让买家困惑。
 * stone 线当前无货，其场景 'statement' 仅在该线补货后随 getActiveLines 自动出现。
 */
export const SCENARIO_OF_LINE: Record<string, string> = {
  'stainless-titanium-steel': 'daily',
  'fashion-alloy-brass': 'volume',
  'natural-stone-gemstone-pearl': 'statement',
};
export const SCENARIOS = ['daily', 'volume', 'statement'] as const;
export type Scenario = (typeof SCENARIOS)[number];

/** 离散筛选项值域（显式 sort，禁依赖返回顺序；未确认值不进 facet） */
export function distinctValues(items: SkuIndexItem[], key: 'material' | 'plating'): string[] {
  return [...new Set(items.map((it) => it[key]).filter((v): v is string => !!v && !!v.trim()))].sort((a, b) =>
    a.localeCompare(b),
  );
}
