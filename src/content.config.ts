// src/content.config.ts — Content Collections 定义（坑 §11.1/11.2/11.3）
// 位置必须在 src/content.config.ts（Astro 7 拒绝识别 src/content/config.ts）
// Zod 一律从 astro/zod 导入（禁止独立安装 zod / 从 astro:content 导入 z）
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const LINE_IDS = [
  'fashion-alloy-brass',
  'stainless-titanium-steel',
] as const;

const CATEGORY_IDS = [
  'earrings',
  'necklace',
  'bracelet',
  'ring',
  'hair-accessory',
  'brooch',
  'anklet',
] as const;

const tierBand = z.object({
  min_qty: z.number().int().positive(),
  max_qty: z.number().int().positive().nullable(),
  price_low: z.number().positive(),
  price_high: z.number().positive(),
  currency: z.literal('USD'),
});

// 真实素材图片（intake pipeline 产出；placeholder 产品为空数组）
const productImage = z.object({
  src: z.string(),
  thumb: z.string(),
  alt: z.string().default(''),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

// 产品集合：字段与 PRD §6.4 真实素材字段 1:1（CONTENT-PLACEHOLDER-PLAN §1.1）
//
// dataStatus 两态语义（SPEC §10 真实素材替换规则）：
//   placeholder —— 演示数据，规格/阶梯价/图片占位齐备（AC-01..AC-42 以此为基准）
//   real        —— 工厂实拍图 + 品类归属已确认；材质/镀层/尺寸/重量/MOQ/价格尚未确认，
//                  对应字段留空，UI 一律降级为「规格随报价确认」而**不得**填充未核实数值。
// 完整性由 tests/content-contract.test.ts 机械校验（placeholder 必须齐全 / real 必须有图）。
const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
    sku_code: z.string().regex(/^[A-Z0-9-]{3,32}$/),
    title: z.string().max(80),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    line: z.enum(LINE_IDS),
    category: z.enum(CATEGORY_IDS),
    base_material_grade: z.string().optional(),
    plating_method: z.string().optional(),
    plating_thickness_um: z.number().positive().optional(),
    dimensions_mm: z.string().optional(),
    weight_g: z.number().positive().optional(),
    // 克重基准：工厂尺寸图写明的是「一对」重量。不标注就会被读成单只，
    // 而这一倍差直接影响买家算运费与报价，故显式落库。
    weight_basis: z.enum(['piece', 'pair']).optional(),
    moq_min: z.number().int().min(12).max(120).optional(),
    moq_max: z.number().int().min(12).max(120).optional(),
    tiered_price: z.array(tierBand).min(3).optional(),
    compliance_tag: z.literal('on_request'),
    test_report_reference: z.null(),
    ear_post: z.boolean(),
    short_description: z.string(),
    // 风格标签：仅在供应商标题/图片给出明确风格依据时填写，供 PDP 做选款标签展示。
    // 无依据者留空数组——不得为了填满而臆造风格。
    style_tags: z.array(z.string()).default([]),
    images: z.array(productImage).default([]),
    dataStatus: z.enum(['placeholder', 'real']),
  }),
});

// 产品线落地页内容（编辑文案走 body；frontmatter 只放装配元数据）
const productLines = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/product-lines' }),
  schema: z.object({
    line: z.enum(LINE_IDS),
    name: z.string(),
    icon: z.string(),
    lineToken: z.enum(['line-alloy', 'line-steel']),
  }),
});

// 合规专题（EN 1811 子专题长文等）
const compliance = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/compliance' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    standard: z.string(),
  }),
});

// Blog 种子文章
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['material', 'plating', 'buying', 'compliance']),
    pubDate: z.coerce.date(),
  }),
});

// 政策类单页（samples / shipping-payment / contact / sourcing-partners）+ FAQ 数据
const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,json}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    contact: z
      .object({
        email: z.string(),
        whatsapp: z.string(),
        wechat: z.string(),
      })
      .optional(),
    groups: z
      .array(
        z.object({
          id: z.string(),
          questions: z.array(z.object({ q: z.string(), a: z.string() })),
        }),
      )
      .optional(),
  }),
});

export const collections = { products, productLines, compliance, blog, pages };
