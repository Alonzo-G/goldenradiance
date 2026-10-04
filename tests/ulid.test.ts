// tests/ulid.test.ts — ULID 格式与单调性（notes §4.1 验收自测：1000 个，全匹配 + 非降序）
import { describe, it, expect } from 'vitest';
import { ulid } from '../src/lib/server/ulid';

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe('ulid', () => {
  it('连续生成 1000 个：全部匹配 Crockford Base32 26 字符格式', () => {
    for (let i = 0; i < 1000; i++) {
      expect(ulid()).toMatch(ULID_REGEX);
    }
  });

  it('连续生成 1000 个：非降序（含同毫秒内严格递增）', () => {
    const seen: string[] = [];
    for (let i = 0; i < 1000; i++) {
      seen.push(ulid());
    }
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i] >= seen[i - 1]).toBe(true);
    }
  });

  it('同毫秒内多次生成不回退且严格递增（单调 +1 进位）', () => {
    const fixed = 1_791_000_000_000;
    const a = ulid(fixed);
    const b = ulid(fixed);
    const c = ulid(fixed);
    expect(a).not.toBe(b);
    expect(b > a).toBe(true);
    expect(c > b).toBe(true);
    expect(a).toMatch(ULID_REGEX);
  });

  it('时间部分编码：固定时间戳的前 10 字符确定', () => {
    const fixed = 1_791_000_000_000;
    const a = ulid(fixed).slice(0, 10);
    const b = ulid(fixed).slice(0, 10);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/);
  });

  it('不含字母表剔除字符（I/L/O/U）', () => {
    for (let i = 0; i < 100; i++) {
      expect(ulid()).not.toMatch(/[ILOU]/);
    }
  });
});
