// src/lib/products/compliance-tag.ts — renderComplianceTag(data)：四要素门禁（AC-38/39/41）
// 单一函数全站复用（UIUX §16.11）：四要素（标准+机构+编号+日期）缺一即落到降级文案。
// V1 全部 demo SKU 的 test_report_reference = null → 恒落降级分支。

export interface ComplianceReportAttrs {
  test_report_reference: string | null;
  report_lab?: string | null;
  report_date?: string | null;
}

export type ComplianceRender =
  | { level: 'report'; standard: string; lab: string; number: string; date: string }
  | { level: 'degraded'; textKey: 'pdp.compliance.degraded' };

export function renderComplianceTag(data: ComplianceReportAttrs): ComplianceRender {
  const hasFourAttrs =
    !!data.test_report_reference && !!data.report_lab && !!data.report_date;
  if (hasFourAttrs && data.test_report_reference && data.report_lab && data.report_date) {
    return {
      level: 'report',
      standard: 'EN 1811 / EN 12472',
      lab: data.report_lab,
      number: data.test_report_reference,
      date: data.report_date,
    };
  }
  return { level: 'degraded', textKey: 'pdp.compliance.degraded' };
}

/** PDP 规格行 Nickel/Lead 的渲染值：V1 恒为降级文案 key（限值只进教育页，UIUX §13.1） */
export function specComplianceValue(): 'pdp.compliance.degraded' {
  return 'pdp.compliance.degraded';
}
