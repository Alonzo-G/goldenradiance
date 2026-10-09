// scripts/verify-product-lines.mjs — 产品线落地页（/product-lines/<line>/）专项回归
//
// 覆盖 docs/plan-product-lines-2026-10-09.md §6 门禁表的 11 项断言：
//   1. 两条线路由可达（钢线 / 合金线）
//   2. 品类卡数 == 线内品类数；钢线栅格 2 列（不是「2 张窄卡 + 4 列空白」）
//   3. 品类卡 href 必含 line=（深链不在 UI 上静默失效的第一道防线）
//   4. 合金线款式 chip ≥ 8
//   5. 深链闭环：点品↔卡 → 目录页 line checkbox 已回填 → 结果数 == 线内该品类数
//   6. rail 多样性：卡数与实测一致且**无重复 SKU**
//   7. Hero 与首页同源（同一 heroImageOfLine 选出的同一张图）
//   8. JSON-LD 同时含 Organization + CollectionPage + BreadcrumbList
//   9. 无 emoji（P0 图标门禁的运行产物复核）
//  10. 320 / 375 / 768 / 1440 四宽度零横向溢出
//  11. 本页主控件触控 ≥44px（面包屑内联文字链接按裁定 #7 豁免）
//
// 约定（沿用 verify-style-filter.mjs，勿改）：
//   - Playwright 一律 domcontentloaded + waitForTimeout，**禁 networkidle**（懒加载图片会一直有请求）。
//   - 每个视口宽度用**独立 context**：共享 context 上 setViewportSize 再 goto 测到的是 resize 瞬态布局，会误报溢出。
//   - 预览统一用 localhost（`astro preview` 不带 --host 只监听 IPv6 [::1]）。
//   - BASE_URL 若被系统污染成非 URL 值则忽略（项目坑：曾被设成便携 Git 路径）。
//
// 期望值来源（全部来自 tests/line-aggregation.test.ts 的「实测预期输出，非配置」，本脚本照抄、不反过来驱动实现）：
//   钢线 608 款；bracelet 604 / ring 4；rail 4 张 SZKK001S / SZTX001 / SZGSS160 / GR001
//   合金线 404 款；bracelet 288 / necklace 102 / ring 8 / earrings 6；rail 6 张
import { chromium } from 'playwright';

const envBase = process.env.BASE_URL ?? '';
const BASE = /^https?:\/\//.test(envBase) ? envBase.replace(/\/$/, '') : 'http://localhost:4321';

const STEEL = { slug: 'stainless-titanium-steel', name: 'Stainless & Titanium Steel', skus: 608, bracelet: 604, types: 2, rail: 4 };
const ALLOY = { slug: 'fashion-alloy-brass', name: 'Fashion Alloy & Brass', skus: 404, types: 4, rail: 6 };

const PATH_STEEL = `/product-lines/${STEEL.slug}/`;
const PATH_ALLOY = `/product-lines/${ALLOY.slug}/`;

const EMOJI = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/u;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    pass += 1;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail += 1;
    failures.push(`${name} — ${detail}`);
    console.log(`  FAIL  ${name} — ${detail}`);
  }
}

/** 页面横向溢出量（scrollWidth − clientWidth） */
async function overflowOf(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}

const browser = await chromium.launch();

// ══════════════════════════════ 1. 路由可达 ══════════════════════════════
console.log(`\n预览地址 ${BASE}\n`);
console.log('[1] 两条线路由可达');

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const line of [STEEL, ALLOY]) {
  const resp = await page.goto(`${BASE}${line.slug === STEEL.slug ? PATH_STEEL : PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const h1 = (await page.locator('h1').first().innerText()).trim();
  check(`${line.slug} 返回 200`, resp ? resp.status() === 200 : false, `status=${resp?.status()}`);
  check(`${line.slug} h1 为线名`, h1 === line.name, `实测 "${h1}"`);
}

// ══════════════════════════════ 2. 品类卡数 + 栅格 ══════════════════════════════
console.log('\n[2] 品类卡数 == 线内品类数；钢线栅格 2 列');
await page.goto(`${BASE}${PATH_STEEL}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);

const steelCards = await page.locator('[data-category-card]').count();
check('钢线品类卡 2 张', steelCards === STEEL.types, `实测 ${steelCards}`);
const steelGridClass = (await page.locator('[data-category-grid]').getAttribute('class')) ?? '';
check('钢线品类栅格含 md:grid-cols-2（非旧 lg:grid-cols-6）', /\bmd:grid-cols-2\b/.test(steelGridClass) && !/\blg:grid-cols-6\b/.test(steelGridClass), `class="${steelGridClass}"`);

await page.goto(`${BASE}${PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1000);
const alloyCards = await page.locator('[data-category-card]').count();
check('合金线品类卡 4 张', alloyCards === ALLOY.types, `实测 ${alloyCards}`);

// ══════════════════════════════ 3. 品类卡 href 必含 line= ══════════════════════════════
console.log('\n[3] 品类卡 href 必含 line=');
for (const line of [STEEL, ALLOY]) {
  await page.goto(`${BASE}${line.slug === STEEL.slug ? PATH_STEEL : PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const hrefs = await page.locator('[data-category-card]').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
  const all = hrefs.length > 0 && hrefs.every((h) => h.includes(`line=${line.slug}`));
  check(`${line.slug} 全部品类卡 href 带 line=`, all, hrefs.join(' | '));
}

// ══════════════════════════════ 4. 合金线款式 chip ≥ 8 ══════════════════════════════
console.log('\n[4] 合金线款式 chip ≥ 8');
await page.goto(`${BASE}${PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const alloyChips = await page.locator('[data-style-chip]').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? ''));
check('合金线款式 chip ≥ 8', alloyChips.length >= 8, `实测 ${alloyChips.length}`);
check('合金线 chip href 全部带 line=', alloyChips.length > 0 && alloyChips.every((h) => h.includes(`line=${ALLOY.slug}`)), alloyChips.slice(0, 3).join(' | '));

// 钢线 chip（3 个族）也应带 line=
const steelChips = await page.goto(`${BASE}${PATH_STEEL}`, { waitUntil: 'domcontentloaded' }).then(() => page.waitForTimeout(800)).then(() => page.locator('[data-style-chip]').evaluateAll((els) => els.map((e) => e.getAttribute('href') ?? '')));
check('钢线 chip href 全部带 line=', steelChips.length > 0 && steelChips.every((h) => h.includes(`line=${STEEL.slug}`)), `实测 ${steelChips.length} 个`);

// ══════════════════════════════ 5. 深链闭环 ══════════════════════════════
console.log('\n[5] 深链闭环：点品类卡 → line checkbox 回填 → 结果数正确');
await page.goto(`${BASE}${PATH_STEEL}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
await page.locator('[data-category-card][data-category="bracelet"]').first().click();
await page.waitForTimeout(1800);
const landedUrl = new URL(page.url());
check('跳转 URL 带 category 与 line 轴', landedUrl.searchParams.get('category') === 'bracelet' && landedUrl.searchParams.get('line') === STEEL.slug, landedUrl.pathname + landedUrl.search);
check('目录页 line checkbox 已回填', await page.locator(`input[name="line"][value="${STEEL.slug}"]`).isChecked());
check('目录页 category checkbox 已回填', await page.locator('input[name="category"][value="bracelet"]').isChecked());
const filtered = Number((await page.locator('[data-results-count]').innerText()).replace(/[^\d]/g, ''));
check(`线内 bracelet 结果数 == ${STEEL.bracelet}`, filtered === STEEL.bracelet, `实测 ${filtered}`);

// ══════════════════════════════ 6. rail 多样性 ══════════════════════════════
console.log('\n[6] rail 无重复 SKU + 顺序与实测逐位一致');
// 期望 SKU 序列（来自 tests/line-aggregation.test.ts 的「实测预期输出，非配置」，逐位照抄）。
// 断言到 SKU 序列而不只是「无重复」，是为了把选品算法的行为钉死：谁改了桶排序/保底规则，
// 这里立刻红，而不是等到肉眼看图才发现「合金线又全是手链了」。
const EXPECTED_PICKS = {
  [STEEL.slug]: ['SZKK001S', 'SZTX001', 'SZGSS160', 'GR001'],
  [ALLOY.slug]: ['GR190', 'GR059', 'GR217', 'GR299', 'GR291', 'GR305'],
};
for (const line of [STEEL, ALLOY]) {
  await page.goto(`${BASE}${line.slug === STEEL.slug ? PATH_STEEL : PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const skus = await page.locator('#gallery [data-sku-card]').evaluateAll((els) => els.map((e) => e.getAttribute('data-sku-card') ?? ''));
  check(`${line.slug} rail 卡数 == ${line.rail}`, skus.length === line.rail, `实测 ${skus.length}：${skus.join(', ')}`);
  check(`${line.slug} rail 无重复 SKU`, new Set(skus).size === skus.length, `唯一 ${new Set(skus).size} / 共 ${skus.length}`);
  check(`${line.slug} rail SKU 序列逐位一致`, skus.join(',') === EXPECTED_PICKS[line.slug].join(','), `实测 ${skus.join(', ')}`);
}

// ══════════════════════════════ 7. Hero 与首页同源 ══════════════════════════════
console.log('\n[7] Hero 与首页同源');
await page.goto(`${BASE}${PATH_STEEL}`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const heroSrc = await page.locator('[data-line-hero] img').first().getAttribute('src');
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
// 首页线卡：<a href="/product-lines/<slug>/"> 内的图
const homeSteelSrc = await page.locator(`a[href="${PATH_STEEL}"] img`).first().getAttribute('src');
check('钢线 Hero 图 == 首页线卡图（同一 heroImageOfLine 选图）', !!heroSrc && heroSrc === homeSteelSrc, `hero=${heroSrc} / home=${homeSteelSrc}`);

// ══════════════════════════════ 8. JSON-LD 三类实体 ══════════════════════════════
console.log('\n[8] JSON-LD 含 Organization + CollectionPage + BreadcrumbList');
for (const line of [STEEL, ALLOY]) {
  await page.goto(`${BASE}${line.slug === STEEL.slug ? PATH_STEEL : PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const joined = (await page.locator('script[type="application/ld+json"]').allTextContents()).join(' ').replace(/\s+/g, '');
  check(`${line.slug} JSON-LD 含 Organization`, joined.includes('"@type":"Organization"'));
  check(`${line.slug} JSON-LD 含 CollectionPage`, joined.includes('"@type":"CollectionPage"'));
  check(`${line.slug} JSON-LD 含 BreadcrumbList`, joined.includes('"@type":"BreadcrumbList"'));
}

// ══════════════════════════════ 9. 无 emoji ══════════════════════════════
console.log('\n[9] 运行产物无 emoji');
for (const line of [STEEL, ALLOY]) {
  await page.goto(`${BASE}${line.slug === STEEL.slug ? PATH_STEEL : PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  const html = await page.evaluate(() => document.body.innerHTML);
  const m = html.match(EMOJI);
  check(`${line.slug} HTML 无 emoji 字符`, !m, m ? `命中 ${JSON.stringify(m)}` : '');
}

// ══════════════════════════════ 10. 四宽度零溢出 ══════════════════════════════
console.log('\n[10] 320 / 375 / 768 / 1440 零横向溢出');
for (const w of [320, 375, 768, 1440]) {
  const c = await browser.newContext({ viewport: { width: w, height: 900 } });
  const p = await c.newPage();
  for (const line of [STEEL, ALLOY]) {
    await p.goto(`${BASE}${line.slug === STEEL.slug ? PATH_STEEL : PATH_ALLOY}`, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(1200);
    const over = await overflowOf(p);
    check(`${w}px ${line.slug} 无横向溢出`, over <= 0, `溢出 ${over}px`);
  }
  await c.close();
}

// ══════════════════════════════ 11. 触控 ≥44px ══════════════════════════════
console.log('\n[11] 本页主控件触控 ≥44px（面包屑内联链接按裁定 #7 豁免）');
// 只覆盖本页「自己拥有」的主控件：品类卡 / 款式 chip / 锚点链接 / Hero 与 CTA 按钮 / rail 查看全部。
// 卡内文字链接（ProductCard 标题）是 /products/ 与 PDP 早已上线的全站既有行为，不在本次范围。
// Hero 里只点 CTA（a.h-12），**不**用 `[data-line-hero] a`——那会把面包屑内联链接（32px，已豁免）也扫进来。
const TOUCH_SELECTORS = [
  '[data-category-card]',
  '[data-style-chip]',
  '[data-anchor-link]',
  '[data-line-hero] a.h-12',
  '#rfq a.h-12',
  '#gallery a.h-11',
];
for (const w of [375, 1440]) {
  const c = await browser.newContext({ viewport: { width: w, height: 900 } });
  const p = await c.newPage();
  await p.goto(`${BASE}${PATH_STEEL}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(1200);
  const small = await p.evaluate((sels) => {
    const out = [];
    for (const sel of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue; // 隐藏元素（如 <lg 的锚点条）跳过
        const w = Math.round(r.width);
        const h = Math.round(r.height);
        if (h < 44 || w < 44) {
          out.push(`${sel} ${w}×${h} "${(el.textContent ?? '').trim().slice(0, 18)}"`);
        }
      }
    }
    return out;
  }, TOUCH_SELECTORS);
  check(`${w}px 主控件触控全部 ≥44px`, small.length === 0, small.slice(0, 4).join(' ; '));
  await c.close();
}

await ctx.close();
await browser.close();

console.log(`\n${'='.repeat(56)}`);
console.log(`通过 ${pass} / 失败 ${fail}`);
if (fail > 0) {
  console.log('\n失败明细：');
  for (const f of failures) console.log(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log('产品线落地页专项回归全部通过');
}
