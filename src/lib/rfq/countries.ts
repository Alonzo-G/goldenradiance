// src/lib/rfq/countries.ts — RFQ 表单「目的国」下拉选项（ISO 3166-1 alpha-2 码 → 英文名）
// 按 B2B 饰品外贸重点市场排序（北美 → 欧洲 → 中东 → 亚太 → 拉美 → 非洲 → 其他），
// 覆盖绝大多数询盘来源；不在列表内的国家由「Other」兜底，仍提交 2 位码。
// value 恒为 2 位大写码，与 schema.ts 的 /^[A-Z]{2}$/ 校验、submit.ts 的 .toUpperCase() 对齐。

export interface CountryOption {
  code: string;
  name: string;
}

export const COUNTRIES: CountryOption[] = [
  // North America
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
  // Europe (EU + UK)
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'PL', name: 'Poland' },
  { code: 'SE', name: 'Sweden' },
  { code: 'DK', name: 'Denmark' },
  { code: 'NO', name: 'Norway' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'IE', name: 'Ireland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'GR', name: 'Greece' },
  { code: 'AT', name: 'Austria' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'FI', name: 'Finland' },
  // Middle East
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'IL', name: 'Israel' },
  { code: 'TR', name: 'Türkiye' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'EG', name: 'Egypt' },
  // Asia-Pacific
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'SG', name: 'Singapore' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'TH', name: 'Thailand' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'KR', name: 'South Korea' },
  { code: 'JP', name: 'Japan' },
  { code: 'IN', name: 'India' },
  // Latin America
  { code: 'BR', name: 'Brazil' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'AR', name: 'Argentina' },
  { code: 'PE', name: 'Peru' },
  // Africa
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  // Russia & Greater China (respecting territorial sovereignty)
  { code: 'RU', name: 'Russia' },
  { code: 'HK', name: 'Hong Kong, China' },
  { code: 'TW', name: 'Taiwan, China' },
  // Other（ZZ = ISO 3166 保留码，表示「未指定/未列出」，仍满足 /^[A-Z]{2}$/ 校验）
  { code: 'ZZ', name: 'Other / not listed' },
];
