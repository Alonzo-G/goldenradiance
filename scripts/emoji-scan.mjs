// scripts/emoji-scan.mjs — P0 emoji 图标扫描（临时）
import { readFileSync } from 'node:fs';

const re =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;

const files = [
  'src/layouts/BaseLayout.astro',
  'src/components/home/HomeHero.astro',
  'src/components/product/ProductCard.astro',
  'src/components/product/ProductImage.astro',
  'src/components/product/catalog.ts',
  'src/components/product/Gallery.astro',
  'src/components/layout/Header.astro',
  'src/components/layout/Wordmark.astro',
  'src/components/layout/MobileRfqBar.astro',
  'src/pages/products/index.astro',
  'src/lib/shared/format.ts',
];

let bad = 0;
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  const m = s.match(re);
  if (m) {
    console.log('EMOJI', f, JSON.stringify(m));
    bad++;
  } else {
    console.log('OK  ', f);
  }
}
process.exit(bad ? 1 : 0);
