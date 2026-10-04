// src/lib/seo/canonical.ts — canonical / hreflang 目标地址（V1 仅 x-default 指向自身，ADR-004）
// 站点基址单一真源收敛至 site.ts；此处重导出 DEFAULT_SITE 兼容既有 import。
import { getSiteUrl } from './site';

export { DEFAULT_SITE } from './site';

export function canonicalUrl(site: string | URL | undefined, path: string): string {
  return new URL(path, getSiteUrl(site)).toString();
}

/** x-default hreflang 指向页面自身（每页仅此 1 条，v2 在该位追加语种条目） */
export function xDefaultHreflang(site: string | URL | undefined, path: string): string {
  return canonicalUrl(site, path);
}
