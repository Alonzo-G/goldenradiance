// src/lib/server/ratelimit.ts — 内存 Map 固定窗口限流（notes §5）
// 规则对齐 api-spec：默认 5 次 / 10 分钟 / (IP + 指纹)。
// 已知局限（notes §5 原文）：Workers 多 isolate 下为「每 isolate 5 次/10 分钟」，
// 全局上限实际更宽松，MVP 可接受。生产升级路径：Cloudflare WAF Rate Limiting Rule
// （账户层配置，无代码）——不为此引入 DO/KV（范围外）。

export const RATE_LIMIT = 5;
export const RATE_WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** key 由调用方组装（含端点维度：rfq / newsletter 各自独立计数）。now 参数仅供测试注入。 */
export function rateLimit(key: string, now: number = Date.now()): RateLimitResult {
  if (hits.size > 1000) {
    sweep(hits, now);
  }
  const arr = (hits.get(key) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((arr[0] + RATE_WINDOW_MS - now) / 1000)),
    };
  }
  arr.push(now);
  hits.set(key, arr);
  return { allowed: true, retryAfterSeconds: 0 };
}

function sweep(map: Map<string, number[]>, now: number): void {
  for (const [k, v] of map) {
    const alive = v.filter((t) => now - t < RATE_WINDOW_MS);
    if (alive.length === 0) {
      map.delete(k);
    } else {
      map.set(k, alive);
    }
  }
}

/** 仅测试使用：清空计数器，保证用例间隔离。 */
export function clearRateLimits(): void {
  hits.clear();
}

/** Workers 环境必有 CF-Connecting-IP；本地 dev 缺失时回退固定值（notes §5）。 */
export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? 'dev-local';
}

/** 指纹 = SHA-256(User-Agent + Accept-Language) 前 8 个十六进制字符（Web Crypto，零依赖）。 */
export async function fingerprintRequest(request: Request): Promise<string> {
  const ua = request.headers.get('User-Agent') ?? '';
  const lang = request.headers.get('Accept-Language') ?? '';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${ua}|${lang}`),
  );
  const hex = [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex.slice(0, 8);
}
