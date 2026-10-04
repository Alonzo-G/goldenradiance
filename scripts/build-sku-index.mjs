// scripts/build-sku-index.mjs — did-you-mean SKU 索引生成（ARCHITECTURE §6.6 L1/L2）
// 用法：node scripts/build-sku-index.mjs [distDir]
// 从构建产物 dist/ 中提取 SKU → PDP URL 映射，生成 dist/sku-index.json。
// 说明：搜索组件已在构建期内联索引（window.__SKU_INDEX__）；本脚本产出独立文件
// 供外部消费（如 CI 断言 / 未来客户端按需加载），不改变 build 流水线。
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] ?? 'dist';
const productsDir = path.join(process.cwd(), 'src/content/products');

if (!fs.existsSync(productsDir)) {
  console.error('src/content/products not found');
  process.exit(1);
}

const files = fs.readdirSync(productsDir).filter((f) => f.endsWith('.md'));
const index = files.map((file) => {
  const raw = fs.readFileSync(path.join(productsDir, file), 'utf8');
  const fm = raw.split('---')[1] ?? '';
  const get = (key) => fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim().replace(/^"|"$/g, '');
  const sku = get('sku_code') ?? '';
  const slug = get('slug') ?? file.replace(/\.md$/, '');
  const moqMin = Number(get('moq_min') ?? 0);
  return { sku, slug, url: `/products/${slug}/`, moqMin };
});

fs.mkdirSync(dist, { recursive: true });
const out = path.join(dist, 'sku-index.json');
fs.writeFileSync(out, JSON.stringify(index, null, 2));
console.log(`sku-index.json: ${index.length} SKUs -> ${out}`);
