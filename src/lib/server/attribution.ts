// src/lib/server/attribution.ts — 来源归因纯函数
// 从请求 URL 的 utm_* 查询参数提取归因 JSON（schema.sql rfq_inquiries.utm_json）。
// 无任何 utm 参数时返回 null（不落空串垃圾数据）。

export function collectUtmParams(searchParams: URLSearchParams): string | null {
  const utm: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('utm_') && value) {
      utm[key] = value;
    }
  }
  return Object.keys(utm).length > 0 ? JSON.stringify(utm) : null;
}
