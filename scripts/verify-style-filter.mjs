// scripts/verify-style-filter.mjs — 款式筛选专项回归
//
// 覆盖 docs/style-filter-ux-spec.md 的四项决策 + ghost checkbox 机制：
//   1. Form/Motif 分组与阈值（>= STYLE_MIN_COUNT 才渲染）
//   2. OR 语义：勾款式后结果数 == 侧栏计数
//   3. 深链 ?style= 回填 + 自动展开折叠组
//   4. 隐藏 != 失效：低于阈值的 ?style=zodiac 仍出结果（ghost checkbox）
//
// 约定：Playwright 一律 domcontentloaded + waitForTimeout，禁 networkidle（懒加载图片会一直有请求）。
// 预览地址统一用 localhost（不是 127.0.0.1）：`astro preview` 不带 --host 时只监听
// IPv6 [::1]，带 --host 127.0.0.1 时只监听 IPv4，两者互斥。localhost 两边都能解析。
// BASE_URL 若被系统污染成非 URL 值则忽略（项目坑：曾被设成 PortableGit 路径）。
import { chromium } from 'playwright';

const envBase = process.env.BASE_URL ?? '';
const BASE = /^https?:\/\//.test(envBase) ? envBase.replace(/\/$/, '') : 'http://localhost:4321';

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

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

/** 读当前结果数（列表头部的 "N SKUs"） */
async function resultCount() {
  const el = page.locator('[data-results-count]');
  const txt = (await el.innerText()).replace(/[^\d]/g, '');
  return Number(txt);
}

/** 读侧栏某款式 checkbox 显示的计数。
 *  注意不能用 label 的 innerText 末尾正则：label 末尾是 sr-only 的定义文案，
 *  innerText 会把它读进来（项目踩坑 #24）→ 必须精确选中计数 span。 */
async function facetCount(tag) {
  const num = page.locator(`label:has(input[name="style"][value="${tag}"]) .tnum`).first();
  const txt = (await num.innerText()).replace(/[^\d]/g, '');
  return txt ? Number(txt) : -1;
}

/** 当前 chips 区的文案列表 */
async function chipTexts() {
  return (await page.locator('[data-chips] [data-chip]').allInnerTexts()).map((s) => s.trim());
}

console.log(`\n预览地址 ${BASE}\n`);

// ---------- 1. 结构：Style 组 + Form/Motif 分组 + 阈值 ----------
console.log('[1] 结构与阈值');
await page.goto(`${BASE}/products/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1600);

check('Style 顶层 fieldset 存在', await page.locator('[data-style-group]').count() === 1);
check('Motif 折叠组存在', await page.locator('[data-style-motif]').count() === 1);

// Form 组：直接子级 fieldset（排除 Motif details 内部的 fieldset）
const formBoxes = await page.locator('[data-style-group] > fieldset input[name="style"]').count();
check('Form 组渲染 5 项', formBoxes === 5, `实测 ${formBoxes}`);

// Motif 组默认折叠：checkbox 存在但不可见
const motifBox = page.locator('[data-style-motif] input[name="style"]').first();
check('Motif 组默认折叠（checkbox 不可见）', (await motifBox.isVisible()) === false);
const motifCount = await page.locator('[data-style-motif] input[name="style"]').count();
check('Motif 组渲染 6 项', motifCount === 6, `实测 ${motifCount}`);

// 阈值：zodiac(1) / number(1) / chain(3) 必须不渲染
for (const tag of ['zodiac', 'number', 'chain']) {
  check(
    `低于阈值(>=5)的 ${tag} 不渲染 checkbox`,
    (await page.locator(`input[name="style"][value="${tag}"]`).count()) === 0,
  );
}

// ---------- 2. OR 语义 + 计数一致性 ----------
console.log('\n[2] OR 语义与计数准确性');
const bangleFacet = await facetCount('bangle');
const totalAll = await resultCount();

await page.locator('input[name="style"][value="bangle"]').check();
await page.waitForTimeout(500);
const afterBangle = await resultCount();
check(
  `勾 bangle 后结果数 == 侧栏计数（${bangleFacet}）`,
  afterBangle === bangleFacet,
  `实测结果 ${afterBangle} / 侧栏 ${bangleFacet}`,
);
check('勾款式后结果数少于全量', afterBangle < totalAll, `${afterBangle} < ${totalAll}`);

// OR 语义核心：数据里 cuff 全部与 bangle 共现（243 款都是 ["cuff","bangle"]，无单独 ["cuff"]）。
// 所以**单独**勾 cuff 应正好命中这 243 款 —— 直接证明「带多个 tag 的产品勾任一个 tag 都命中」，
// 若实现误写成 AND 语义，这里会是 0。
await page.locator('input[name="style"][value="bangle"]').uncheck();
await page.waitForTimeout(400);
await page.locator('input[name="style"][value="cuff"]').check();
await page.waitForTimeout(500);
const cuffOnly = await resultCount();
const cuffFacet = await facetCount('cuff');
check(
  'OR 语义核心：单独勾 cuff 命中 cuff+bangle 共现群体',
  cuffOnly === cuffFacet && cuffOnly > 0 && cuffOnly < totalAll,
  `结果 ${cuffOnly} / facet ${cuffFacet} / 全量 ${totalAll}`,
);

// 折叠组可交互（同时作为正交 tag 的入口）
await page.locator('[data-style-motif] summary').click();
await page.waitForTimeout(300);
check('Motif 折叠组可手动展开', await page.locator('[data-style-motif]').evaluate((el) => el.open));

// 正交 tag 并集：clover 与 cuff 相互独立，并集应严格大于任一单项
await page.locator('input[name="style"][value="clover"]').check();
await page.waitForTimeout(500);
const cuffUnionClover = await resultCount();
check(
  'OR 语义：cuff ∪ clover 严格大于任一单项',
  cuffUnionClover > cuffOnly && cuffUnionClover > 101,
  `cuff=${cuffOnly} ∪clover=${cuffUnionClover}`,
);

// 叠加 bangle：三者并集应严格大于任一单项，且不超过单项之和（无重复计数）
await page.locator('input[name="style"][value="bangle"]').check();
await page.waitForTimeout(500);
const afterUnion = await resultCount();
check(
  'OR 语义：三者并集不超过单项之和（无重复计数）',
  afterUnion <= afterBangle + cuffOnly + 101,
  `${afterUnion} <= ${afterBangle}+${cuffOnly}+101`,
);
check(
  'OR 语义：三者并集严格大于任一单项',
  afterUnion > Math.max(afterBangle, cuffOnly),
  `并集 ${afterUnion} vs max(${afterBangle}, ${cuffOnly})`,
);

// 清空
await page.locator('[data-clear-all]').click();
await page.waitForTimeout(500);
check('Clear all 恢复全量', (await resultCount()) === totalAll, `${await resultCount()} vs ${totalAll}`);

// ---------- 3. 深链 ----------
console.log('\n[3] 深链回填与自动展开');
await page.goto(`${BASE}/products/?style=bangle`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1600);
check(
  '?style=bangle 回填 checkbox',
  await page.locator('input[name="style"][value="bangle"]').isChecked(),
);
check('?style=bangle 结果数 == facet 计数', (await resultCount()) === bangleFacet, `${await resultCount()} vs ${bangleFacet}`);
const bangleChips = await chipTexts();
check('?style=bangle 生成可移除 chip', bangleChips.some((c) => /bangle/i.test(c)), JSON.stringify(bangleChips));

// Motif 深链应自动展开折叠组（否则 chip 显示已选、侧栏看不到该项）
await page.goto(`${BASE}/products/?style=clover`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1600);
check('?style=clover 自动展开 Motif 折叠组', await page.locator('[data-style-motif]').evaluate((el) => el.open));
check('?style=clover 的 checkbox 可见', await page.locator('input[name="style"][value="clover"]').isVisible());

// ---------- 4. ghost checkbox：隐藏 != 失效 ----------
console.log('\n[4] ghost checkbox（低于阈值的深链仍生效）');
await page.goto(`${BASE}/products/?style=zodiac`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1600);
const zodiacCount = await resultCount();
check('?style=zodiac 仍过滤出结果（非全量）', zodiacCount > 0 && zodiacCount < totalAll, `实测 ${zodiacCount}（全量 ${totalAll}）`);
check('?style=zodiac 结果数 == 1（数据实况）', zodiacCount === 1, `实测 ${zodiacCount}`);
check('ghost checkbox 已注入 DOM', (await page.locator('input[name="style"][data-ghost]').count()) === 1);
const zodiacChips = await chipTexts();
check('?style=zodiac 生成 chip（可移除）', zodiacChips.length === 1, JSON.stringify(zodiacChips));
check('chip 文案是业务词而非 i18n key', !/filter\.style\./.test(zodiacChips.join(' ')), JSON.stringify(zodiacChips));

// 点 chip 移除 → 恢复全量
await page.locator('[data-chips] [data-chip]').first().click();
await page.waitForTimeout(500);
check('移除 ghost chip 后恢复全量', (await resultCount()) === totalAll, `${await resultCount()} vs ${totalAll}`);

// ---------- 5. 脏值降级 ----------
console.log('\n[5] 未知值降级');
await page.goto(`${BASE}/products/?style=foobar-does-not-exist`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1600);
check('未知 style 值返回 0 结果', (await resultCount()) === 0, `实测 ${await resultCount()}`);
check('未知值显示空状态而非报错', await page.locator('[data-catalog-empty]').isVisible());

// ---------- 6. 移动端全展开 ----------
console.log('\n[6] 移动端');
const mob = await browser.newContext({ viewport: { width: 375, height: 780 } });
const mp = await mob.newPage();
await mp.goto(`${BASE}/products/`, { waitUntil: 'domcontentloaded' });
await mp.waitForTimeout(1600);
// 移动端 sheet 内的 Motif 也应展开（sheet 纵向可滚，无需折叠）
const mobMotifOpen = await mp.locator('[data-style-motif]').evaluate((el) => el.open);
check('移动端 Motif 组默认展开', mobMotifOpen === true, `open=${mobMotifOpen}`);

const mobOver = await mp.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  let bad = 0;
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1) bad += 1;
  }
  return bad;
});
check('移动端无元素超出视口', mobOver === 0, `溢出元素 ${mobOver} 个`);

// ---------- 7. 桌面溢出 ----------
console.log('\n[7] 桌面溢出与侧栏滚动');
for (const w of [1024, 1280, 1440]) {
  // 必须用独立 context：在共享 context 上 setViewportSize 再 goto 测到的是 resize
  // 瞬态布局，会误报横向溢出（项目踩坑：首页 carousel 曾虚报 62px）
  const c2 = await browser.newContext({ viewport: { width: w, height: 900 } });
  const p2 = await c2.newPage();
  await p2.goto(`${BASE}/products/`, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1500);
  const over = await p2.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(`${w}px 无横向溢出`, over <= 0, `溢出 ${over}px`);
  await c2.close();
}

await browser.close();

console.log(`\n${'='.repeat(52)}`);
console.log(`通过 ${pass} / 失败 ${fail}`);
if (fail > 0) {
  console.log('\n失败明细：');
  for (const f of failures) console.log(`  - ${f}`);
  process.exitCode = 1;
} else {
  console.log('款式筛选专项回归全部通过');
}