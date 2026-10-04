// tests/ratelimit.test.ts — 固定窗口边界（notes §5：5 次 / 10 分钟）
import { describe, it, expect, beforeEach } from 'vitest';
import {
  rateLimit,
  clearRateLimits,
  RATE_LIMIT,
  RATE_WINDOW_MS,
} from '../src/lib/server/ratelimit';

describe('rateLimit 固定窗口', () => {
  beforeEach(() => {
    clearRateLimits();
  });

  it('窗口内前 5 次放行，第 6 次拒绝且 retryAfterSeconds 约 600', () => {
    const t0 = 1_791_000_000_000;
    for (let i = 0; i < RATE_LIMIT; i++) {
      expect(rateLimit('rfq:1.2.3.4:abcd', t0).allowed).toBe(true);
    }
    const denied = rateLimit('rfq:1.2.3.4:abcd', t0);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    expect(denied.retryAfterSeconds).toBeLessThanOrEqual(RATE_WINDOW_MS / 1000);
  });

  it('窗口边界：窗口期满（>= WINDOW_MS）后重新放行', () => {
    const t0 = 1_791_000_000_000;
    for (let i = 0; i < RATE_LIMIT; i++) rateLimit('rfq:ip:f', t0);
    // 差 1 秒期满：仍拒绝
    const justBefore = rateLimit('rfq:ip:f', t0 + RATE_WINDOW_MS - 1000);
    expect(justBefore.allowed).toBe(false);
    expect(justBefore.retryAfterSeconds).toBe(1);
    // 恰好期满：放行
    expect(rateLimit('rfq:ip:f', t0 + RATE_WINDOW_MS).allowed).toBe(true);
  });

  it('窗口内早期命中过期后可腾出额度（滑动剔除）', () => {
    const t0 = 1_791_000_000_000;
    for (let i = 0; i < RATE_LIMIT; i++) rateLimit('rfq:ip:f', t0 + i * 1000);
    // t0 + 5s 时刻 5 次都占满；推进到 t0 + 1s + WINDOW_MS 时第一次命中过期
    const later = t0 + 1000 + RATE_WINDOW_MS;
    expect(rateLimit('rfq:ip:f', later).allowed).toBe(true);
  });

  it('不同 key 相互独立（IP 不同 / 指纹不同 / 端点不同）', () => {
    const t0 = 1_791_000_000_000;
    for (let i = 0; i < RATE_LIMIT; i++) rateLimit('rfq:1.2.3.4:aaaa', t0);
    expect(rateLimit('rfq:1.2.3.4:aaaa', t0).allowed).toBe(false);
    expect(rateLimit('rfq:1.2.3.4:bbbb', t0).allowed).toBe(true);
    expect(rateLimit('rfq:5.6.7.8:aaaa', t0).allowed).toBe(true);
    expect(rateLimit('newsletter:1.2.3.4:aaaa', t0).allowed).toBe(true);
  });

  it('拒绝时不再记账：被拒请求不延长窗口', () => {
    const t0 = 1_791_000_000_000;
    for (let i = 0; i < RATE_LIMIT; i++) rateLimit('rfq:ip:f', t0);
    for (let i = 0; i < 10; i++) rateLimit('rfq:ip:f', t0); // 全被拒
    // 若拒绝被记账，这里将仍拒绝
    expect(rateLimit('rfq:ip:f', t0 + RATE_WINDOW_MS).allowed).toBe(true);
  });
});
