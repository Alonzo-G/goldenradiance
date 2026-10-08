// src/lib/shared/format.ts — 前后端共用纯函数（价格/MOQ/规格串格式化）
// 数字只做格式化，文案词（USD / pcs）由组件经 t() 取值拼接。

/** 价格区间数字部分：0.42-0.55（两位小数，tabular-nums 列对齐的前提） */
export function priceRange(low: number, high: number): string {
  return `${low.toFixed(2)}-${high.toFixed(2)}`;
}

/**
 * RFQ 数量种子：确认过 MOQ 的款式用其 MOQ；未确认（真实素材）用站点默认起订量。
 * 默认值与「MOQ 12-120 pcs per style」这一已确认口径的下沿一致，但**不冒充**该款的 MOQ。
 */
export const RFQ_DEFAULT_QTY = 12;

/** 参考价 = 首档（即 MOQ 档）区间；tiered_price 首档即起订档 */
export function referenceBand(
  tiers: { min_qty: number; max_qty: number | null; price_low: number; price_high: number }[] | undefined | null,
): { min_qty: number; max_qty: number | null; price_low: number; price_high: number } | null {
  if (!tiers || !tiers.length) return null;
  return [...tiers].sort((a, b) => a.min_qty - b.min_qty)[0];
}

/** 卡片/PDP 参考区间：全档最低 low 至最高 high（如 0.31-0.55） */
export function overallRange(
  tiers: { price_low: number; price_high: number }[] | undefined | null,
): { low: number; high: number } | null {
  if (!tiers || !tiers.length) return null;
  return {
    low: Math.min(...tiers.map((x) => x.price_low)),
    high: Math.max(...tiers.map((x) => x.price_high)),
  };
}

/** MOQ 档位（AC-02a 硬要求三档）：按 moq_min 落 12-30 / 31-60 / 61-120；未确认返回 null */
export type MoqBand = '12-30' | '31-60' | '61-120';
export function moqBand(moqMin: number | null | undefined): MoqBand | null {
  if (moqMin == null) return null;
  if (moqMin <= 30) return '12-30';
  if (moqMin <= 60) return '31-60';
  return '61-120';
}

export const MOQ_BANDS: MoqBand[] = ['12-30', '31-60', '61-120'];

/**
 * 卡片 spec strip：材质 · 镀层 · 尺寸首段（单行截断）。
 * 未确认字段一律跳过；全部缺失时返回空串，由组件改显「规格随报价确认」降级文案。
 */
export function specStrip(
  material?: string | null,
  plating?: string | null,
  dimensions?: string | null,
): string {
  const dimFirst = dimensions?.split(',')[0]?.trim() ?? '';
  return [material, plating, dimFirst]
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter(Boolean)
    .join(' · ');
}

/** 阶梯档位显示：12–59 / 240+（数字格式化，"pcs" 由组件经 t() 拼接） */
export function bandLabel(min: number, max: number | null): string {
  return max == null ? `${min}+` : `${min}–${max}`;
}

/** 数量取整到 MOQ 倍数并向上取整（UIUX §10.2） */
export function roundToMoq(qty: number, moq: number): number {
  if (qty <= moq) return moq;
  return Math.ceil(qty / moq) * moq;
}

/** 毫米 → 英寸（双单位显示用；保留 2 位小数，如 20 mm → 0.79 in） */
export function mmToIn(mm: number): string {
  return (mm / 25.4).toFixed(2);
}

/** 克 → 盎司（双单位显示用；保留 2 位小数，如 5.5 g → 0.19 oz） */
export function gToOz(g: number): string {
  return (g / 28.3495).toFixed(2);
}

/** 毫米尺寸串的双单位转换：把 "55.1 × 37.1 mm" 这类串里的数字按 mm→in 换算。
 *  无法解析时原样返回（宁可不转换也不输出错误数值）。 */
export function dimensionsDual(dimensions: string): string | null {
  const mm = dimensions.match(/([\d.]+)\s*mm/i);
  if (!mm) return null;
  const val = Number(mm[1]);
  if (!Number.isFinite(val)) return null;
  return `${mmToIn(val)} in`;
}

/** 极简 className 合并（无外部依赖） */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/**
 * 产品主图的响应式 srcset（360 缩略 + 640 中间档 + 主图原始宽度）。
 * 640 档仅当主图实测宽度 > 640 时才写入——与 scripts/gen-mid-thumbs.mjs 的生成条件一致，
 * 避免「描述符 640w 但实际文件更小」的选图误差（主图 ≤640 的款式由主图本身覆盖该档）。
 * 缺 thumb 或 width 时返回 undefined（不生成 w 描述符，比写错更安全）。
 */
export function imageSrcset(
  thumb: string | undefined | null,
  src: string,
  width?: number,
): string | undefined {
  if (!thumb || !width) return undefined;
  const mid = thumb.replace(/-thumb\.webp$/, '-640.webp');
  return width > 640
    ? `${thumb} 360w, ${mid} 640w, ${src} ${width}w`
    : `${thumb} 360w, ${src} ${width}w`;
}

/**
 * 产品线识别色 token 映射（fashion-alloy-brass → line-alloy）。
 * content.config.ts 的 lineToken 枚举是唯一真源；产品 line 字段是全名，
 * 而 CSS 变量是 --color-line-alloy 等短名——直接 var(--color-{line}) 会引用到不存在的变量。
 */
export const LINE_TOKEN: Record<string, string> = {
  'fashion-alloy-brass': 'line-alloy',
  'stainless-titanium-steel': 'line-steel',
};

export function lineToken(line: string): string {
  return LINE_TOKEN[line] ?? 'line-alloy';
}

