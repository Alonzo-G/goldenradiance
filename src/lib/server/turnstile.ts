// src/lib/server/turnstile.ts — Turnstile 服务端 siteverify（notes §3.3，api-spec 400 错误码表）
// 必须服务端校验，只查 token 非空是纸糊防线（ARCHITECTURE §6.3）。
// sitekey（前端）与 secret（后端）是两个值，dev 测试对见 .dev.vars 与 notes §3.3。

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** invalid → 400 INVALID_TURNSTILE；already_used → 400 TOKEN_ALREADY_USED（notes §6.3 坑 10）。 */
export type TurnstileFailure = 'invalid' | 'already_used';

export interface TurnstileResult {
  ok: boolean;
  failure?: TurnstileFailure;
  /** siteverify 返回分值（0-1），仅记录不参与判定（schema.sql turnstile_score 注释）。 */
  score?: number;
}

interface SiteverifyResponse {
  success: boolean;
  'error-codes'?: string[];
  score?: number;
}

export async function verifyTurnstile(
  secret: string | undefined,
  token: string,
  remoteip?: string,
): Promise<TurnstileResult> {
  // 密钥或 token 缺失一律判失败（fail-closed），不降级放行。
  if (!secret || !token) {
    return { ok: false, failure: 'invalid' };
  }
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteip) {
      body.set('remoteip', remoteip);
    }
    const res = await fetch(SITEVERIFY_URL, { method: 'POST', body });
    if (!res.ok) {
      return { ok: false, failure: 'invalid' };
    }
    const data = (await res.json()) as SiteverifyResponse;
    if (data.success) {
      return { ok: true, score: data.score };
    }
    const codes = data['error-codes'] ?? [];
    // token 单次有效：timeout-or-duplicate 表示 token 已被消费，前端需重渲染 widget。
    if (codes.includes('timeout-or-duplicate')) {
      return { ok: false, failure: 'already_used' };
    }
    return { ok: false, failure: 'invalid' };
  } catch (err) {
    console.error('turnstile siteverify request failed', err);
    return { ok: false, failure: 'invalid' };
  }
}
