// src/lib/seo/jsonld.ts — 结构化数据（服务端注入，禁客户端生成；禁 aggregateRating/review）
export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function organizationJsonld(site: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Golden Radiance',
    url: site,
    description:
      'Sourcing partner for wholesale jewelry buyers: three product lines, MOQ 12-120 pcs stated per style, spec sheets with every quote.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      availableLanguage: 'en',
    },
  };
}

export interface ProductJsonldInput {
  site: string;
  path: string;
  sku: string;
  title: string;
  slug: string;
  description: string;
  brand: string;
  /** 真实素材主图（相对路径，会补全为绝对 URL） */
  image?: string | null;
  /** 以下规格/价格未确认时传 null/undefined —— 宁可不输出，也不得填 0 或编造数值 */
  priceLow?: number | null;
  priceHigh?: number | null;
  tierCount?: number | null;
  moqMin?: number | null;
  material?: string | null;
  plating?: string | null;
}

export function productJsonld(input: ProductJsonldInput): Record<string, unknown> {
  const additionalProperty = [
    input.material?.trim()
      ? { '@type': 'PropertyValue', name: 'Material', value: input.material.trim() }
      : null,
    input.plating?.trim()
      ? { '@type': 'PropertyValue', name: 'Plating', value: input.plating.trim() }
      : null,
    input.moqMin != null
      ? { '@type': 'PropertyValue', name: 'MOQ', value: `${input.moqMin} pcs` }
      : null,
  ].filter(Boolean) as Record<string, unknown>[];

  const hasPrice =
    input.priceLow != null && input.priceHigh != null && (input.tierCount ?? 0) > 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.title,
    sku: input.sku,
    description: input.description,
    brand: { '@type': 'Brand', name: input.brand },
    ...(input.image
      ? { image: new URL(input.image, input.site).toString() }
      : {}),
    // 价格未确认的款式不输出 offers —— 避免下游把 0 当成真实价格
    ...(hasPrice
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: (input.priceLow as number).toFixed(2),
            highPrice: (input.priceHigh as number).toFixed(2),
            offerCount: input.tierCount,
            availability: 'https://schema.org/InStock',
            ...(input.moqMin != null
              ? {
                  eligibleQuantity: {
                    '@type': 'QuantitativeValue',
                    minValue: input.moqMin,
                    unitCode: 'C62',
                  },
                }
              : {}),
          },
        }
      : {}),
    ...(additionalProperty.length ? { additionalProperty } : {}),
  };
}

export function breadcrumbJsonld(
  site: string,
  items: BreadcrumbItem[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: new URL(it.path, site).toString(),
    })),
  };
}

export function faqPageJsonld(
  groups: { questions: { q: string; a: string }[] }[],
): Record<string, unknown> {
  const mainEntity = groups.flatMap((g) =>
    g.questions.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a },
    })),
  );
  return { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity };
}

export function blogPostingJsonld(input: {
  site: string;
  path: string;
  headline: string;
  description: string;
  datePublished: Date;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    datePublished: input.datePublished.toISOString(),
    author: { '@type': 'Organization', name: 'Golden Radiance' },
    mainEntityOfPage: new URL(input.path, input.site).toString(),
  };
}

/**
 * LocalBusiness + GeoCoordinates 结构化数据（geo 优化 / 本地搜索）。
 * 出口型 B2B：实体为「外贸出口商/采购伙伴」，coordinates 为总部所在地。
 * 注意：公司实际地址/坐标未确认前，本函数输出不含精确 geo（避免编造经纬度），
 * 只输出 areaServed（服务区域）与 logo/contactPoint 等可确认信息——
 * 精确 latitude/longitude 由客户提供后补入（见 OPEN-DECISIONS geo 项）。
 */
export function localBusinessJsonld(input: {
  site: string;
  /** 服务区域（目标出口市场），如 EU / UK / Middle East / United States */
  areaServed?: string[];
  /** 已确认的地理坐标（未确认勿传，宁缺勿编造） */
  geo?: { latitude: number; longitude: number } | null;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Golden Radiance',
    url: input.site,
    logo: new URL('/og-default.png', input.site).toString(),
    description:
      'Sourcing partner for wholesale jewelry buyers: fashion alloy & brass, stainless & titanium steel, and natural stone & pearl product lines.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      availableLanguage: 'en',
    },
    areaServed: input.areaServed?.length ? input.areaServed : undefined,
  };
  if (input.geo) {
    base.location = {
      '@type': 'Place',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: input.geo.latitude,
        longitude: input.geo.longitude,
      },
    };
  }
  return base;
}

/**
 * 地区落地页（markets/*）结构化数据：面向特定出口市场的营销页。
 * 用 `about`/`areaServed` 表达该页聚焦的市场，帮助搜索引擎理解地区相关性。
 */
export function marketPageJsonld(input: {
  site: string;
  path: string;
  marketName: string;
  marketAreas: string[];
  description: string;
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: new URL(input.path, input.site).toString(),
    name: input.marketName,
    description: input.description,
    inLanguage: 'en',
    about: {
      '@type': 'Place',
      name: input.marketName,
    },
    isPartOf: { '@id': `${input.site}/#website` },
  };
}
