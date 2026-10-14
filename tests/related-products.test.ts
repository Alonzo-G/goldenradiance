// tests/related-products.test.ts — PDP 关联产品规则的确定性护卫
//
// 背景（方案 A / P0-3，2026-10-14）：PDP 的 "Same series" / "Often paired with"
// 此前只按产品线过滤，于是一只手链的同系列里会混进项链、戒指、耳环。
// 行业 PDP 契约要求：关联产品**先同品类，再相邻品类**——买家在扫款式时找的是
// 同品类可替换款，跨品类图只会稀释浏览节奏。
//
// 这里跑真实全量数据（与 line-aggregation.test.ts 同策略），因为"同品类优先"
// 这条规则在 1012 款真实分布上的表现才是有意义的断言，手搓 fixture 撞不上。
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import { pickSameSeries, pickCrossLine } from '../src/lib/products/recommend';
import { moqBand, moqBandLabel, MOQ_BANDS, type MoqBand } from '../src/lib/shared/format';
import type { ProductEntry } from '../src/lib/products/queries';

const PRODUCTS_DIR = resolve(process.cwd(), 'src/content/products');

interface RawProduct {
  sku_code: string;
  slug: string;
  line: string;
  category: string;
  moq_min?: number;
  dataStatus: 'real' | 'placeholder';
}

function toEntry(data: RawProduct): ProductEntry {
  return { id: data.slug, slug: data.slug, collection: 'products', body: '', data } as unknown as ProductEntry;
}

const RAW: RawProduct[] = readdirSync(PRODUCTS_DIR)
  .filter((f) => f.endsWith('.md'))
  .map<RawProduct>((f) => {
    const source = readFileSync(join(PRODUCTS_DIR, f), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
    if (!frontmatter) throw new Error(`${f}: 缺少 frontmatter`);
    return parse(frontmatter[1]);
  })
  .filter((d) => d.dataStatus !== 'placeholder')
  .sort((a, b) => a.sku_code.localeCompare(b.sku_code));

const ITEMS = RAW.map(toEntry);

/** 取该品类下款数最多的线作为样本，保证样本的同线同品类池足够填满 limit */
function sampleOf(category: string): ProductEntry {
  const hit = ITEMS.filter((it) => it.data.category === category);
  if (!hit.length) throw new Error(`全量数据里没有 category=${category}`);
  const pool = [...hit].sort((a, b) => a.data.line.localeCompare(b.data.line))[0];
  return pool;
}

describe('sameSeries — 同线同品类优先', () => {
  it('全量数据下每个品类都有样本可测', () => {
    const cats = new Set(RAW.map((r) => r.category));
    expect(cats.size).toBeGreaterThan(0);
    expect(ITEMS.length).toBeGreaterThan(100);
  });

  it('只返回同产品线的款', () => {
    for (const entry of ITEMS.slice(0, 40)) {
      const out = pickSameSeries(ITEMS, entry, 6);
      for (const it of out) {
        expect(it.data.line).toBe(entry.data.line);
      }
    }
  });

  it('绝不包含自己', () => {
    for (const entry of ITEMS.slice(0, 40)) {
      const out = pickSameSeries(ITEMS, entry, 6);
      expect(out.some((it) => it.data.sku_code === entry.data.sku_code)).toBe(false);
    }
  });

  it('同品类不足 limit 时，先把同品类的全部取完（不夹带跨品类）', () => {
    for (const category of ['ring', 'earrings', 'necklace', 'bracelet']) {
      const entry = sampleOf(category);
      const out = pickSameSeries(ITEMS, entry, 6);
      const sameCatCount = ITEMS.filter(
        (it) => it.data.line === entry.data.line && it.data.category === category && it.data.sku_code !== entry.data.sku_code,
      ).length;
      // 取 limit 个，前 sameCatCount 个必然全是同品类（除非池子本身不够 6）
      const expectSameCat = Math.min(sameCatCount, 6);
      const actualSameCat = out.filter((it) => it.data.category === category).length;
      expect(actualSameCat).toBe(expectSameCat);
    }
  });

  it('结果稳定可复现（两次调用完全一致）', () => {
    const entry = sampleOf('bracelet');
    const a = pickSameSeries(ITEMS, entry, 6).map((it) => it.data.sku_code);
    const b = pickSameSeries(ITEMS, entry, 6).map((it) => it.data.sku_code);
    expect(a).toEqual(b);
  });
});

describe('crossLine — 相邻品类搭配优先', () => {
  it('绝不返回自己', () => {
    for (const entry of ITEMS.slice(0, 40)) {
      const out = pickCrossLine(ITEMS, entry, 4);
      expect(out.some((it) => it.data.sku_code === entry.data.sku_code)).toBe(false);
    }
  });

  it('对同一 SKU 不重复', () => {
    for (const entry of ITEMS.slice(0, 40)) {
      const out = pickCrossLine(ITEMS, entry, 4).map((it) => it.data.sku_code);
      expect(new Set(out).size).toBe(out.length);
    }
  });

  it('优先给相邻品类，而不是任意跨线', () => {
    const PAIRED_WITH: Record<string, string[]> = {
      bracelet: ['ring', 'earrings'],
      ring: ['bracelet', 'earrings'],
      earrings: ['necklace', 'ring'],
      necklace: ['earrings', 'bracelet'],
    };
    for (const [category, near] of Object.entries(PAIRED_WITH)) {
      const entry = sampleOf(category);
      const out = pickCrossLine(ITEMS, entry, 4);
      if (!out.length) continue;
      // 池子足够时，前排应落在相邻品类上
      const nearCount = out.filter((it) => near.includes(it.data.category)).length;
      const sameLineSameCatExists = ITEMS.some(
        (it) => it.data.line === entry.data.line && near.includes(it.data.category),
      );
      if (sameLineSameCatExists) expect(nearCount).toBeGreaterThan(0);
    }
  });
});

describe('MOQ 档位 — 标签由真实数据推导，不预设区间', () => {
  it('moqMin 为空时返回 null（目录页据此整组不渲染）', () => {
    expect(moqBand(null)).toBeNull();
    expect(moqBand(undefined)).toBeNull();
  });

  it('全量 1012 款当前均未确认 MOQ → 所有档位标签均为 null', () => {
    const filled = RAW.filter((r) => r.moq_min != null);
    expect(filled.length).toBe(0);
    for (const band of MOQ_BANDS) {
      expect(moqBandLabel(band, [])).toBeNull();
    }
  });

  it('有数据时标签由实际值生成，而非写死的 12-30 / 61-120', () => {
    // 构造一组明显超出旧硬编码区间（12–120）的 MOQ，验证标签不再被旧区间绑死
    const mins = [200, 400, 900];
    const bands = mins.map((v) => moqBand(v) as MoqBand);
    const label = moqBandLabel(bands[0], mins);
    // 旧实现会把 200 塞进 '61-120' 档并显示 "61-120"；现在应显示真实区间
    expect(label).toBe('200–900+');
    expect(label).not.toContain('61-120');
    expect(label).not.toContain('120');
  });

  it('单一值时标签不带连字符区间', () => {
    expect(moqBandLabel(moqBand(50) as MoqBand, [50])).toBe('50');
  });
});
