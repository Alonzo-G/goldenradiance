// scripts/verify-home-refactor.mjs — 首页重构回归（临时脚本，跑完即删）
// 验证：品类区块渲染、横向溢出清零、深链筛选初始化、品类卡链接正确。
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const base = 'http://localhost:4321';
const outDir = resolve(process.cwd(), 'shots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

// 1) 桌面：首页品类区块 + 深链
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);

  const catLinks = await page.$$eval('a[href^="/products/?category="]', (els) =>
    els.map((a) => a.getAttribute('href') + ' | ' + (a.textContent || '').replace(/\s+/g, ' ').trim()),
  );
  console.log('=== 首页品类卡 ===');
  catLinks.forEach((l) => console.log(' ', l));
  if (catLinks.length === 0) { console.log('FAIL: 无品类卡'); failures++; }

  // 首页全页截图
  await page.screenshot({ path: resolve(outDir, 'home-desktop.png'), fullPage: true });
  await page.close();
}

// 2) 深链初始化：/products/?category=bracelet
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/products/?category=bracelet', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  const checked = await page.$$eval('input[name="category"]:checked', (els) => els.map((e) => e.value));
  const resultCount = await page.textContent('[data-results-count]');
  console.log('\n=== 深链 /products/?category=bracelet ===');
  console.log('  勾选的 category:', JSON.stringify(checked));
  console.log('  结果计数:', resultCount);
  if (!checked.includes('bracelet')) { console.log('FAIL: 深链未回填 bracelet'); failures++; }
  await page.close();
}

// 3) 移动端 3 设备：横向溢出检查 + 首页截图
for (const d of [
  { key: 'iphone-se', ...devices['iPhone SE'] },
  { key: 'iphone-14-pro', ...devices['iPhone 14 Pro'] },
  { key: 'pixel-7', ...devices['Pixel 7'] },
]) {
  const ctx = await browser.newContext({ ...d, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);
  const { scrollW, viewportW } = await page.evaluate(() => ({
    scrollW: document.documentElement.scrollWidth,
    viewportW: document.documentElement.clientWidth,
  }));
  console.log(`\n=== ${d.key} 首页横向溢出 ===`);
  console.log(`  scrollW=${scrollW} viewportW=${viewportW} ${scrollW <= viewportW ? 'OK' : 'OVERFLOW'}`);
  if (scrollW > viewportW) failures++;
  await page.screenshot({ path: resolve(outDir, `home-${d.key}.png`), fullPage: true });
  await ctx.close();
}

await browser.close();
console.log(`\n${failures === 0 ? 'ALL PASS' : `FAIL: ${failures} 项失败`}`);
process.exit(failures === 0 ? 0 : 1);
