// scripts/verify-brand-assets.mjs — 品牌 logo / favicon 部署回归
// 验证：header/footer logo 渲染 + favicon link + 静态资产 200 + 截图
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL ?? 'http://localhost:4321';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'shots');
mkdirSync(outDir, { recursive: true });

// 1. 静态资产可达性
for (const f of ['logo-glyph.png', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
  const res = await fetch(base + '/' + f);
  if (!res.ok) throw new Error(`FAIL: /${f} -> ${res.status}`);
  console.log('OK /' + f, res.headers.get('content-type'));
}
// 旧 favicon.svg 应 404（已删除）
const oldRes = await fetch(base + '/favicon.svg');
console.log('old /favicon.svg ->', oldRes.status, oldRes.status === 404 ? '(expected)' : '(UNEXPECTED)');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(base + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);

// 2. header/footer logo 渲染（naturalWidth > 0 = 图片真实解码成功）
const logos = await page.evaluate(() =>
  [...document.querySelectorAll('img[src*="logo-glyph"]')].map((img) => ({
    inHeader: !!img.closest('header'),
    inFooter: !!img.closest('footer'),
    loaded: img.naturalWidth > 0,
    w: img.getBoundingClientRect().width,
  })),
);
console.log(JSON.stringify(logos));
if (logos.length !== 2) throw new Error('FAIL: expect 2 logo imgs (header+footer), got ' + logos.length);
if (!logos.every((l) => l.loaded)) throw new Error('FAIL: logo img not decoded');
if (!logos.some((l) => l.inHeader) || !logos.some((l) => l.inFooter)) throw new Error('FAIL: logo missing in header/footer');

// 3. favicon link
const icons = await page.evaluate(() => [...document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')].map((l) => l.getAttribute('href')));
console.log('favicon links:', JSON.stringify(icons));
if (!icons.includes('/favicon-32x32.png')) throw new Error('FAIL: favicon-32 link missing');

// 4. 截图：header 特写 + footer 特写
await page.screenshot({ path: path.join(outDir, 'brand-header.png'), clip: { x: 0, y: 0, width: 1280, height: 72 } });
await page.evaluate(() => document.querySelector('footer')?.scrollIntoView());
await page.waitForTimeout(400);
const footer = await page.evaluate(() => { const f = document.querySelector('footer'); const r = f.getBoundingClientRect(); return { y: r.y + window.scrollY, h: r.height }; });
await page.screenshot({ path: path.join(outDir, 'brand-footer.png'), fullPage: false });

await browser.close();
console.log('PASS: brand assets deployed');
