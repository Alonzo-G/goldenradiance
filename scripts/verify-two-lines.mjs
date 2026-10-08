// scripts/verify-two-lines.mjs — 两条线收敛 + 布局回归验证
// 依赖 preview server（npm run preview，端口 4321）
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'http://localhost:4321';
const OUT = join(process.cwd(), 'shots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const results = [];

async function shot(name, url, vp) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  const dims = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    viewportW: document.documentElement.clientWidth,
  }));
  results.push({ name, url, ...dims, overflow: dims.scrollW > dims.viewportW });
  await page.screenshot({ path: join(OUT, name), fullPage: true });
  await page.close();
}

// 桌面 + 移动端首页
await shot('two-lines-desktop.png', BASE + '/', { width: 1280, height: 900 });
await shot('two-lines-mobile.png', BASE + '/', { width: 320, height: 700 });

// 首页结构断言（桌面）
const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await p.waitForTimeout(1200);
const audit = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent?.trim() ?? '';
  // 线卡区块：section 里含 "Two lines" 标题的下一个 grid 里的 a 卡数
  const lineLinks = [...document.querySelectorAll('a[href^="/product-lines/"]')]
    .map((a) => a.textContent?.trim() ?? '')
    .filter((t) => t && t !== 'View all' && t.length < 40);
  const hasStone = document.body.textContent?.includes('Natural Stone') ?? false;
  const stats = [...document.querySelectorAll('p')].map((x) => x.textContent?.trim()).filter((t) => t === '2');
  return { h1, lineLinkCount: lineLinks.length, lineLinks: [...new Set(lineLinks)].slice(0, 6), hasStone, statTwo: stats.length };
});
results.push({ name: 'audit', ...audit });
await p.close();

await browser.close();

console.log(JSON.stringify(results, null, 2));
const overflow = results.filter((r) => r.overflow);
console.log(overflow.length === 0 ? '\nPASS: no horizontal overflow' : `\nFAIL: ${overflow.length} pages overflow`);
