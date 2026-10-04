// src/lib/seo/site.ts — 站点 URL 单一真源
// 正式域名只需改 astro.config.mjs 的 `site`（Astro.site 自动同步）；
// 此处 DEFAULT_SITE 仅作静态构建/无 Astro 上下文时的兜底，两者保持一致。
// 换域名时：改 astro.config.mjs `site` + 本文件 DEFAULT_SITE，其余全站自动跟随。
export const DEFAULT_SITE = 'https://rayan-accessories.com';

/**
 * 解析站点基准 URL：优先取 Astro.site（真源），兜底 DEFAULT_SITE。
 * 全站 SEO/canonical/JSON-LD 统一经此取基址，杜绝各处散落硬编码。
 */
export function getSiteUrl(site?: string | URL | undefined): string {
  if (typeof site === 'string' && site) return site;
  if (site) return site.toString();
  return DEFAULT_SITE;
}
