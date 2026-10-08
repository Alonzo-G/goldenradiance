// scripts/verify-filters-sticky.mjs — 产品列表页筛选侧栏 sticky 行为回归
// 用户反馈：下滑后左侧筛选栏不跟随（留白）。修复：aside sticky top-20 + self-start。
// 验证：滚动后 aside 视口 top 应 ≈ header 高度（80px），且仍在视口内可见。
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const base = process.env.BASE_URL ?? 'http://localhost:4321';
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'shots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto(base + '/products/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1200);

const aside = page.locator('aside[data-filters]');
const visibleDesktop = await aside.isVisible();
if (!visibleDesktop) throw new Error('FAIL: aside not visible on desktop');

// 顶部状态
const topAtPageTop = await aside.evaluate((el) => el.getBoundingClientRect().top);

// 滚动到中部（产品区已充分滚动）
await page.mouse.wheel(0, 900);
await page.waitForTimeout(300);
const topAfterScroll = await aside.evaluate((el) => el.getBoundingClientRect().top);
const scrollY1 = await page.evaluate(() => window.scrollY);

// 滚到底部
await page.mouse.wheel(0, 2000);
await page.waitForTimeout(300);
const topAtBottom = await aside.evaluate((el) => el.getBoundingClientRect().top);

// sticky 语义：滚动后 top 应钉在 80px（top-20）附近，而不是随内容滚出视口
const stickyOk = topAfterScroll >= 70 && topAfterScroll <= 95;
console.log(JSON.stringify({ visibleDesktop, topAtPageTop, scrollY1, topAfterScroll, topAtBottom, stickyOk }, null, 2));
if (!stickyOk) throw new Error(`FAIL: aside top after scroll = ${topAfterScroll} (expect ~80)`);
// 页面顶部时 aside 应仍在正常文档流中（top 明显大于 sticky 位置 80px，即 header+标题下方）
if (topAtPageTop < topAfterScroll + 5) throw new Error('FAIL: aside already pinned at page top?');

await page.screenshot({ path: path.join(outDir, 'filters-sticky.png'), fullPage: false });
await browser.close();
console.log('PASS: filters sidebar stays sticky while scrolling');
