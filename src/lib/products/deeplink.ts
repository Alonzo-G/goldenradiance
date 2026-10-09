// src/lib/products/deeplink.ts — 目录页深链参数的单一真源
//
// 存在理由：`catalog.ts` 的 `initFromUrl()` 按轴名逐个读 URL 参数并回填 checkbox，
// 而拼这些 URL 的地方散落在首页品类卡 / 首页线卡 / 产品线落地页。轴名两边各写一份时，
// 拼错一个字母的结果是「URL 看着对、点了不筛选」——这是 UI 上完全看不出来的静默失效。
// 因此：轴名在此处定义一次，拼 URL 用它，回填也 import 它。

/**
 * 参与深链的稳定枚举轴。
 * material / plating 是自由文本（值不稳定），band / scenario 当前不进归类语义，
 * 都不在此列——它们既不会出现在 deep link 里，也不会被回填。
 */
export const CATALOG_AXES = ['category', 'line', 'style'] as const;

export type CatalogAxis = (typeof CATALOG_AXES)[number];

/**
 * 目录页深链 URL。轴的顺序固定按 `CATALOG_AXES`（category → line → style），
 * 因此同一个筛选条件在任何区块拼出来都是逐字相同的字符串，可被测试精确断言。
 *
 * `URLSearchParams` 负责转义：`&`、`=`、空格一律 percent-encode，
 * 手写 `` `/products/?line=${x}` `` 遇到带 `&` 的值会截断参数。
 */
export function catalogUrl(
  params: Partial<Record<CatalogAxis, string | null | undefined>>,
): string {
  const search = new URLSearchParams();
  for (const axis of CATALOG_AXES) {
    const value = params[axis];
    if (value) search.append(axis, value);
  }
  const query = search.toString();
  return query ? `/products/?${query}` : '/products/';
}
