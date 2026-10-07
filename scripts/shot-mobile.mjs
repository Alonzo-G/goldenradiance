// scripts/shot-mobile.mjs — 移动端截图诊断（临时脚本）
// 用 playwright 以主流手机尺寸访问本地 preview server，截取关键页面。
// 用法：node scripts/shot-mobile.mjs [baseURL]（默认 http://localhost:4322）
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:4322';
const outDir = resolve(process.cwd(), 'shots');
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: 'home', path: '/' },
  { name: 'products', path: '/products/' },
  { name: 'pdp', path: '/products/gr001/' },
  { name: 'line', path: '/product-lines/stainless-titanium-steel/' },
];

const devicesToShot = [
  { key: 'iphone-se', ...devices['iPhone SE'] },
  { key: 'iphone-14-pro', ...devices['iPhone 14 Pro'] },
  { key: 'pixel-7', ...devices['Pixel 7'] },
];

const browser = await chromium.launch();
for (const d of devicesToShot) {
  const ctx = await browser.newContext({ ...d, deviceScaleFactor: 2 });
  for (const t of targets) {
    const page = await ctx.newPage();
    try {
      await page.goto(base + t.path, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(800);
      const slug = `${d.key}-${t.name}.png`;
      await page.screenshot({ path: join(outDir, slug), fullPage: false });
      console.log('shot:', slug);
    } catch (e) {
      console.log('FAIL:', t.name, e.message);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log('done →', outDir);
