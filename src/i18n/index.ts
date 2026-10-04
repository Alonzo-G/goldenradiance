// src/i18n/index.ts — t() 入口 + UiKey 类型（写法照 ARCHITECTURE §6.2 / ADR-004）
// V1 lang 恒为 'en'；不引入 i18n 库、不做运行时协商（ADR-004 禁令）。
import en from './en.json';

type PathsOf<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${PathsOf<T[K]>}`;
}[keyof T & string];

/** 字典中所有合法 UI key 的联合类型（点路径，写错编译期报错） */
export type UiKey = PathsOf<typeof en>;

const flat: Record<string, string> = {};
(function walk(obj: Record<string, unknown>, prefix: string): void {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') flat[key] = v;
    else if (v && typeof v === 'object') walk(v as Record<string, unknown>, key);
  }
})(en, '');

export function t(key: UiKey, vars?: Record<string, string | number>): string {
  let out = flat[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

/** 站点级常量（非 UI 文案，不进字典） */
export const SITE_NAME = 'Golden Radiance';
