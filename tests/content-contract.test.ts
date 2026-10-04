// tests/content-contract.test.ts — 内容契约机械校验（SPEC §10 真实素材替换规则的守卫）
// 背景：为容纳未确认规格的真实素材，schema 把规格字段改成了 optional。
// 该放宽必须被机械约束兜住，否则占位数据的完整性会悄悄退化：
//   placeholder → 规格/阶梯价必须齐全（AC-01..AC-42 的基准）
//   real        → 必须有图、文件必须真实存在、且**不得**携带价格（站点为报价制）；
//                 材质/镀层/厚度仍须留空，尺寸与克重须带明示计量基准
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';

const ROOT = process.cwd();
const PRODUCTS_DIR = resolve(ROOT, 'src/content/products');
const PUBLIC_DIR = resolve(ROOT, 'public');

interface RawProduct {
  file: string;
  slugFromFile: string;
  data: Record<string, unknown>;
}

function loadProducts(): RawProduct[] {
  return readdirSync(PRODUCTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const raw = readFileSync(join(PRODUCTS_DIR, f), 'utf8');
      const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
      if (!m) throw new Error(`${f}: 缺少 frontmatter`);
      return {
        file: f,
        slugFromFile: f.replace(/\.md$/, ''),
        data: parse(m[1]) as Record<string, unknown>,
      };
    });
}

const all = loadProducts();
const placeholders = all.filter((p) => p.data.dataStatus === 'placeholder');
const real = all.filter((p) => p.data.dataStatus === 'real');

const PLACEHOLDER_REQUIRED = [
  'base_material_grade',
  'plating_method',
  'plating_thickness_um',
  'dimensions_mm',
  'weight_g',
  'moq_min',
  'moq_max',
  'tiered_price',
];

describe('内容契约 · placeholder 态', () => {
  it('存在占位款式且每条规格字段齐全（放宽 schema 后不得退化）', () => {
    expect(placeholders.length).toBeGreaterThan(0);
    for (const p of placeholders) {
      for (const k of PLACEHOLDER_REQUIRED) {
        expect(p.data[k], `${p.file} 缺少 ${k}`).not.toBeUndefined();
      }
    }
  });

  it('占位款式阶梯价至少 3 档（AC-02a 三档口径）', () => {
    for (const p of placeholders) {
      const tiers = p.data.tiered_price as { min_qty: number; currency: string }[];
      expect(tiers.length, `${p.file} 档位不足 3`).toBeGreaterThanOrEqual(3);
      for (const t of tiers) {
        expect(t.currency, `${p.file} 币种须为 USD`).toBe('USD');
      }
    }
  });
});

describe('内容契约 · real 态', () => {
  it('真实素材款式存在，且每条至少 1 张图', () => {
    expect(real.length).toBeGreaterThan(0);
    for (const p of real) {
      const imgs = p.data.images as unknown[] | undefined;
      expect(Array.isArray(imgs) && imgs.length > 0, `${p.file} 无图片`).toBe(true);
    }
  });

  it('真实素材款不得携带价格（站点为报价制，禁止编造 USD 价）', () => {
    for (const p of real) {
      expect(p.data.tiered_price, `${p.file} 不应出现 tiered_price`).toBeUndefined();
    }
  });

  it('真实素材款不得编造未核实的规格数值', () => {
    // 材质、镀层工艺、镀层厚度仍无任何来源 → 必须留空。
    // 尺寸与克重自 2026-10-02 起有来源（工厂自绘尺寸图的实测标注），
    // 不再属于「编造」，但必须满足下一条的基准约束。
    const stillUnconfirmed = ['plating_thickness_um', 'base_material_grade', 'plating_method'];
    for (const p of real) {
      for (const k of stillUnconfirmed) {
        expect(p.data[k], `${p.file} 不应填 ${k}`).toBeUndefined();
      }
    }
  });

  it('凡填了克重就必须写明基准（单只 / 一对），不得让买家自行推断', () => {
    // 源图为「一对（不加耳堵）克重」，一对与单只差一倍，直接影响运费与报价
    for (const p of real) {
      if (p.data.weight_g !== undefined) {
        expect(['piece', 'pair'], `${p.file} 有 weight_g 却缺 weight_basis`).toContain(p.data.weight_basis);
      }
    }
  });

  it('尺寸图至多一张、恒排末位，且必须配套 dimensions_mm', () => {
    for (const p of real) {
      const imgs = (p.data.images ?? []) as { alt?: string }[];
      const hits = imgs.map((im, i) => (/dimension diagram/i.test(im.alt ?? '') ? i : -1)).filter((i) => i >= 0);
      expect(hits.length, `${p.file} 尺寸图超过一张`).toBeLessThanOrEqual(1);
      if (hits.length === 1) {
        expect(hits[0], `${p.file} 尺寸图未排在末位`).toBe(imgs.length - 1);
        expect(p.data.dimensions_mm, `${p.file} 有尺寸图却无 dimensions_mm`).toBeTruthy();
      }
    }
  });

  it('所有引用的图片文件在 public/ 下真实存在', () => {
    const missing: string[] = [];
    for (const p of real) {
      for (const im of p.data.images as { src: string; thumb: string }[]) {
        for (const rel of [im.src, im.thumb]) {
          if (!existsSync(join(PUBLIC_DIR, rel.replace(/^\//, '')))) {
            missing.push(`${p.file} → ${rel}`);
          }
        }
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('内容契约 · 全集合不变量', () => {
  it('sku_code 与 slug 全局唯一', () => {
    const skus = all.map((p) => p.data.sku_code as string);
    const slugs = all.map((p) => p.data.slug as string);
    expect(new Set(skus).size).toBe(skus.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('data.slug 与文件名一致（路由与内容文件不得错位）', () => {
    for (const p of all) {
      expect(p.data.slug, `${p.file} 的 slug 与文件名不一致`).toBe(p.slugFromFile);
    }
  });

  it('sku_code 满足 ^[A-Z0-9-]{3,32}$', () => {
    for (const p of all) {
      expect(String(p.data.sku_code), `${p.file} SKU 格式非法`).toMatch(/^[A-Z0-9-]{3,32}$/);
    }
  });
});
