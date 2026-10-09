// src/lib/products/lines.ts — 产品线 slug ↔ UI 文案的唯一映射入口
//
// 为什么单独一个文件：`t(\`nav.line.${line === 'fashion-alloy-brass' ? 'alloy' : 'steel'}\`)`
// 这类三元拼 key 在全站散落了 5 处（Header / Footer / 404 / PDP ×2 / catalog.ts），
// 新增或改名一条线要同步改 5 处，漏一处就是「菜单显示 A 线、页脚显示 B 线」的串线显示。
// 集中到一张表后，这 5 处共用同一个查表结果，改线的成本从 5 处降到 1 处。
import { t, type UiKey } from '../../i18n';

/** line slug → i18n key。`satisfies Record<string, UiKey>` 让写错的 key 编译期即失败。 */
export const LINE_LABEL_KEY = {
  'fashion-alloy-brass': 'nav.line.alloy',
  'stainless-titanium-steel': 'nav.line.steel',
} as const satisfies Record<string, UiKey>;

export type LineSlug = keyof typeof LINE_LABEL_KEY;

/**
 * line slug → i18n key。未登记的线返回 null —— 宁可让调用方回落到内容集合里的
 * name，也绝不「猜一个近似的 key」把另一条线的名字显示出来。
 */
export function lineLabelKey(line: string): UiKey | null {
  return (LINE_LABEL_KEY as Record<string, UiKey>)[line] ?? null;
}

/**
 * line slug → 线名文案。未登记的线返回空串，由调用方决定是否回落到集合 name。
 * 空串而非 key 字符串：`t()` 对未知 key 会原样返回 key（`flat[key] ?? key`），
 * 直接把 `nav.line.xxx` 显示给买家是明确要避免的失败态。
 */
export function lineLabel(line: string): string {
  const key = lineLabelKey(line);
  return key ? t(key) : '';
}

/**
 * 从产品线页进入询价时的留言预填 URL。
 *
 * 为什么用 `?note=` 而不是 `?line=`：`rfq-client.ts` 的 `applyDeepLink()` 只读
 * `sku` 与 `note` 两个参数，`?line=` 会被静默忽略（UI 上完全看不出来）。
 * `?note=` 则不改一行客户端代码即可复用既有能力。
 *
 * 三条约束：① 文案只能是事实陈述（`rfq.note.fromLine`），它落进买家自己的留言框，
 * 一旦像营销话术就是「网站替我说话」；② 结尾 em dash + 空格邀请买家接着写，
 * 不用句号（句号会让人以为写完了）；③ `encodeURIComponent` 必带——线名里有 `&`
 * （Stainless & Titanium Steel），漏转会截断查询参数，又是一个假深链。
 */
export function rfqNoteUrl(line: string, fallbackName = ''): string {
  const label = lineLabel(line) || fallbackName || line;
  return `/rfq/?note=${encodeURIComponent(t('rfq.note.fromLine', { line: label }))}`;
}
