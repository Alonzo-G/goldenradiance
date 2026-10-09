// src/lib/products/styles.ts — 款式标签（style_tags）的展示元数据
//
// 构建期（侧栏 facet 渲染）与客户端（chip 文案）共用这一份映射，避免两处各维护一套
// 硬编码列表后各自漂移。
import { t, type UiKey } from '../../i18n';

/** facet 渲染阈值：命中产品数低于此值的款式不渲染 checkbox。
 *  写成常量而非把判断散落各处——某个款式将来补货到过线时，选项自动出现，无需改代码。 */
export const STYLE_MIN_COUNT = 5;

/** 款式 slug → i18n key 后缀。查表而非动态拼 key：
 *  `t()` 对未知 key 会原样返回 key 字符串（`flat[key] ?? key`），
 *  内容里出现未登记的 slug 时必须走 fallback，不能把 `filter.style.xxx` 显示给买家。 */
export const STYLE_KEY = {
  bangle: 'bangle',
  cuff: 'cuff',
  cable: 'cable',
  tennis: 'tennis',
  station: 'station',
  chain: 'chain',
  hoop: 'hoop',
  clover: 'clover',
  flower: 'flower',
  leaf: 'leaf',
  heart: 'heart',
  cross: 'cross',
  'initial-letter': 'initialLetter',
  zodiac: 'zodiac',
  number: 'number',
} as const;

/** Form = 结构形态。命中约 99% 手链，是买家的必答题，默认展开。
 *  hoop 当前只有 1 款（earrings），低于 STYLE_MIN_COUNT 故不渲染；但已登记，
 *  补货到过线时选项自动出现，无需改代码。 */
export const FORM_TAGS = [
  'bangle',
  'cuff',
  'cable',
  'tennis',
  'station',
  'chain',
  'hoop',
] as const;

/** Motif = 图案母题。仅约 23% 手链带，默认折叠。 */
export const MOTIF_TAGS = [
  'clover',
  'flower',
  'leaf',
  'heart',
  'cross',
  'initial-letter',
  'zodiac',
  'number',
] as const;

export type StyleSlug = keyof typeof STYLE_KEY;

/** 款式 slug → UI 文案。未登记的 slug 回退为 slug 本身，绝不把 i18n key 显示给买家。 */
export function styleLabel(slug: string): string {
  const suffix = STYLE_KEY[slug as StyleSlug];
  return suffix ? t(`filter.style.${suffix}` as UiKey) : slug;
}

/** 款式 slug → 无障碍定义文案（sr-only / aria-describedby 用）。 */
export function styleHelp(slug: string): string {
  const suffix = STYLE_KEY[slug as StyleSlug];
  return suffix ? t(`filter.style.${suffix}.help` as UiKey) : '';
}