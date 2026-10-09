// tests/line-aggregation.test.ts — 产品线聚合层的确定性护卫
//
// 这个测试跑的是**真实全量数据**（直接读 src/content/products/*.md），不是手搓 fixture。
// 原因很清楚：选品算法的价值 100% 取决于它对真实数据的行为——
// 手搓 5 条 fixture 时"永不重复""品类保底"这些约束一条都撞不上。
//
// 期望值来源：架构师在 1012 款全量数据上跑通算法后记录，标注为
// 「实测预期输出，非配置」。它会被 scripts/verify-product-lines.mjs 照抄，
// 但**不得**反过来写进实现——那等于把观测结果当成规则，以后改坏了也测不出来。
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  buildLineViewModel,
  categoryGridClass,
  RAIL_GRID_CLASS,
  RAIL_SIZES,
  type BuildLineViewModelInput,
} from '../src/lib/products/line-aggregation';
import { catalogUrl, CATALOG_AXES } from '../src/lib/products/deeplink';
import { lineLabel, lineLabelKey, rfqNoteUrl } from '../src/lib/products/lines';
import type { ProductEntry } from '../src/lib/products/queries';

const PRODUCTS_DIR = resolve(process.cwd(), 'src/content/products');

interface RawProduct {
  sku_code: string;
  slug: string;
  line: string;
  category: string;
  style_tags?: string[];
  images?: unknown[];
  dataStatus: 'real' | 'placeholder';
}

/**
 * 构建一个足以喂给聚合层的最小 ProductEntry。
 * 聚合层只读 data.{line,sku_code,category,style_tags,images,dataStatus}，
 * 其余字段缺位不影响本次断言。原因：astro:content 的 loader 在 vitest 里不可用，
 * 而 `import type` 保证本文件不会把 astro:content 拖进运行时。
 */
function toEntry(data: RawProduct): ProductEntry {
  return { id: data.slug, slug: data.slug, collection: 'products', body: '', data } as unknown as ProductEntry;
}

const STEEL_LINE = 'stainless-titanium-steel';
const ALLOY_LINE = 'fashion-alloy-brass';

/** 全量 md 解析约需 3s，缓存后整套测试保持秒级 */
function buildInputs(): BuildLineViewModelInput[] {
  const raw = readdirSync(PRODUCTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .map<RawProduct>((f) => {
      const source = readFileSync(join(PRODUCTS_DIR, f), 'utf8');
      const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
      if (!frontmatter) throw new Error(`${f}: 缺少 frontmatter`);
      return parse(frontmatter[1]);
    })
    // 复刻 getProducts()：先撤占位款（SHOW_PLACEHOLDER_PRODUCTS = false），再按 sku 升序
    .filter((d) => d.dataStatus !== 'placeholder')
    .sort((a, b) => a.sku_code.localeCompare(b.sku_code))
    .map(toEntry);

  return [STEEL_LINE, ALLOY_LINE].map((line) => ({
    line,
    name: line,
    items: raw.filter((it) => it.data.line === line),
  }));
}

const INPUTS = buildInputs();

function view(line: string, name: string) {
  const input = INPUTS.find((i) => i.line === line) ?? { line, name, items: [] };
  return buildLineViewModel({ ...input, name });
}

const STEEL = {
  line: STEEL_LINE,
  skus: 608,
  categories: [
    ['bracelet', 604],
    ['ring', 4],
  ],
  families: 3,
  untagged: 0,
  /** 实测预期输出，非配置 */
  picks: ['SZKK001S', 'SZTX001', 'SZGSS160', 'GR001'],
} as const;

const ALLOY = {
  line: ALLOY_LINE,
  skus: 404,
  categories: [
    ['bracelet', 288],
    ['necklace', 102],
    ['ring', 8],
    ['earrings', 6],
  ],
  families: 8,
  untagged: 111,
  /** 实测预期输出，非配置 */
  picks: ['GR190', 'GR059', 'GR217', 'GR299', 'GR291', 'GR305'],
} as const;

for (const spec of [STEEL, ALLOY]) {
  describe(`产品线落地页聚合 · ${spec.line}`, () => {
    const vm = view(spec.line, spec.line);

    it('线内 SKU 数与实测一致（事实条要用这个数，不写水数）', () => {
      expect(vm.skuCount).toBe(spec.skus);
    });

    it('品类 facet：按计数降序， count 与实测一致', () => {
      expect(vm.categories.map((c) => [c.value, c.count])).toEqual(spec.categories);
      expect(vm.typeCount).toBe(spec.categories.length);
    });

    it('款式族 facet：form + motif 总数与实测一致（阈值沿用 STYLE_MIN_COUNT）', () => {
      expect(vm.familyCount).toBe(spec.families);
      // 每个族都必须真的过阈值，避免将来某个只有 1 款的标签混进来伪装成 facet
      for (const f of [...vm.styleForms, ...vm.styleMotifs]) expect(f.count).toBeGreaterThanOrEqual(5);
    });

    it('无标签款数：合金线 111（渲染脚注，不做 chip）/ 钢线 0（整行不渲染）', () => {
      expect(vm.untaggedCount).toBe(spec.untagged);
    });

    it('rail 选品与实测逐位一致', () => {
      expect(vm.picks.map((p) => p.data.sku_code)).toEqual(spec.picks);
      expect(vm.railCount).toBe(spec.picks.length);
    });

    it('rail 永不重复 SKU：桶少时既不复制也不隐藏', () => {
      const skus = vm.picks.map((p) => p.data.sku_code);
      expect(new Set(skus).size).toBe(skus.length);
    });

    it('同一输入两次构建 deep-equal（SSG 可复现的硬要求）', () => {
      expect(vm.picks.map((p) => p.data.sku_code)).toEqual(view(spec.line, spec.line).picks.map((p) => p.data.sku_code));
      const again = view(spec.line, spec.line);
      expect(again.skuCount).toBe(vm.skuCount);
      expect(again.categories).toEqual(vm.categories);
      expect(again.styleForms).toEqual(vm.styleForms);
      expect(again.styleMotifs).toEqual(vm.styleMotifs);
    });

    it('每个品类都能取到代表款（否则品类卡会是空图）', () => {
      for (const c of vm.categories) {
        expect(c.representative, `${c.value} 缺代表款`).not.toBeNull();
      }
    });
  });
}

describe('rail 多样性 / 品类保底', () => {
  it('钢线只有 4 个 (品类 × 款式签名) 组合 → 出 4 张，不凑 6', () => {
    const vm = view(STEEL.line, STEEL.line);
    expect(vm.railCount).toBe(4);
    // ring 保住了席位，但排在最后（0.7% 的小品类不该占第二个视觉位）
    expect(vm.picks.at(-1)?.data.category).toBe('ring');
  });

  it('合金线 4 个品类全覆盖（necklace / ring / earrings 各至少 1 席）', () => {
    const vm = view(ALLOY.line, ALLOY.line);
    const covered = new Set(vm.picks.map((p) => p.data.category));
    expect([...covered].sort()).toEqual(['bracelet', 'earrings', 'necklace', 'ring']);
  });
});

describe('栅格决策（静态映射表，禁动态拼接 Tailwind 类名）', () => {
  it('列数由卡数决定，钢线不再是「2 张窄卡 + 4 列空白」', () => {
    expect(categoryGridClass(2)).toBe('md:grid-cols-2');
    expect(categoryGridClass(4)).toBe('grid-cols-2 lg:grid-cols-4');
    expect(categoryGridClass(6)).toBe('grid-cols-2 sm:grid-cols-3 lg:grid-cols-6');
  });

  it('rail 每个卡数都有对应的栅格类与 sizes，不落到空串', () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      expect(RAIL_GRID_CLASS[n]).toBeTruthy();
      expect(RAIL_SIZES[n]).toBeTruthy();
      // sizes 必须给出 ≥1280 视口的精确 px 封顶：写 vw 在宽屏会算成远大于卡宽的值，
      // 浏览器会白下一个更大的候选档。
      expect(RAIL_SIZES[n]).toMatch(/^\(min-width: 1280px\) \d+px/);
    }
  });
});

describe('面包屑：UI 与 BreadcrumbList 共用同一个数组（禁中间层链到不存在的 /product-lines/ 索引）', () => {
  it('中间层是真实存在的 /products/，末位是线名自身并带 current 语义', () => {
    const vm = view(STEEL.line, 'Stainless & Titanium Steel');
    expect(vm.breadcrumb.map((b) => b.path)).toEqual([
      '/',
      '/products/',
      '/product-lines/stainless-titanium-steel/',
    ]);
    expect(vm.breadcrumb[0].name).toBe('Home');
    expect(vm.breadcrumb[1].name).toBe('All products');
    expect(vm.breadcrumb[2].name).toBe('Stainless & Titanium Steel');
  });
});

describe('深链：catalogUrl 精确字符串（漂移即静默失效，必须机器断言）', () => {
  it('轴顺序固定为 CATALOG_AXES（category → line → style）', () => {
    expect(CATALOG_AXES).toEqual(['category', 'line', 'style']);
    expect(catalogUrl({ category: 'bracelet', line: 'fashion-alloy-brass' })).toBe(
      '/products/?category=bracelet&line=fashion-alloy-brass',
    );
    expect(catalogUrl({ style: 'clover', line: 'fashion-alloy-brass' })).toBe(
      '/products/?line=fashion-alloy-brass&style=clover',
    );
    expect(catalogUrl({ line: 'stainless-titanium-steel' })).toBe(
      '/products/?line=stainless-titanium-steel',
    );
  });

  it('无参数是裸 /products/（RfqPanel 空篮「去逛逛」用这个形态）', () => {
    expect(catalogUrl({})).toBe('/products/');
  });

  it('特殊字符被转义，不会截断查询参数', () => {
    // initial-letter 这类 tag 带连字符是安全的；真正危险的是 `&`
    expect(catalogUrl({ line: 'a&b' })).toBe('/products/?line=a%26b');
  });
});

describe('RFQ 上下文：线名拼接 + note 预填', () => {
  it('未登记的线回落空串，绝不显示错线名', () => {
    expect(lineLabel('stainless-titanium-steel')).toBe('Stainless & Titanium Steel');
    expect(lineLabel('fashion-alloy-brass')).toBe('Fashion Alloy & Brass');
    expect(lineLabel('not-a-line')).toBe('');
    expect(lineLabelKey('not-a-line')).toBeNull();
  });

  it('note 深链：&, 被转义，结尾是 em dash + 空格（不用句号）', () => {
    const url = rfqNoteUrl('stainless-titanium-steel');
    expect(url).toBe('/rfq/?note=Interested%20in%20the%20Stainless%20%26%20Titanium%20Steel%20line%20%E2%80%94%20');
    const note = decodeURIComponent(url.slice('/rfq/?note='.length));
    expect(note.endsWith(' — ')).toBe(true);
    expect(note.includes('&')).toBe(true);
  });
});
