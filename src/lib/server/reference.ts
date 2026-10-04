// src/lib/server/reference.ts — 买家可见询盘编号 RFQ-YYYY-NNNN（notes §4.2）
// 序号按当年 D1 内 COUNT 计数（跨年自动归零是特性不是 bug）。
// 并发撞号由调用方（db.ts persistRfq）捕获 UNIQUE 冲突后重试，最多 3 次。

export const REFERENCE_PREFIX = 'RFQ';

/** 纯拼装函数，便于无 D1 单测：seq 不足 4 位左侧补零，超出位数自然展开。 */
export function buildReference(year: number, seq: number): string {
  return `${REFERENCE_PREFIX}-${year}-${String(seq).padStart(4, '0')}`;
}

/** 按当年计数生成下一个可用 reference。撞号重试不在此层（写库与取号必须同批闭环）。 */
export async function generateReference(db: D1Database, now: Date = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const count = await db
    .prepare("SELECT COUNT(*) AS n FROM rfq_inquiries WHERE reference LIKE 'RFQ-' || ?1 || '-%'")
    .bind(String(year))
    .first<number>('n');
  return buildReference(year, (count ?? 0) + 1);
}
