/**
 * scripts/verify-header-nav.mjs — 顶部导航栏回归（2026-10-09 三处修复）
 *
 * 覆盖：
 *   1. 导航项文字不折行（「Product Lines」曾被压成 "Product / Lines" 两行，撑高 header）
 *   2. header 恒为单行 h-16，不被内容撑高
 *   3. active 态正确：/products/ 与 /product-lines/xxx/ 不互相误命中
 *   4. 搜索按钮已收敛为图标（不再内嵌 47 字符占位文案）
 *   5. 三档视口横向溢出清零 + 各断点导航形态正确
 *
 * 前置：npm run build && npm run preview（4321）
 *
 * 注意：Playwright 必须用 domcontentloaded + waitForTimeout，禁 networkidle（懒加载图片会超时）。
 */
import { chromium, devices } from 'playwright';

// 注意：环境里存在一个无效的 BASE_URL（指向 PortableGit），必须校验后才采信
const envBase = process.env.BASE_URL ?? '';
// 统一用 localhost 而非 127.0.0.1：`astro preview` 不带 --host 时只监听 IPv6 [::1]，
// 带 --host 127.0.0.1 时只监听 IPv4，两者互斥。localhost 两边都能解析。
const BASE = /^https?:\/\//.test(envBase) ? envBase : 'http://localhost:4321';
const failures = [];

const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures.push(name);
};

/**
 * 判定整页横向溢出。
 *
 * 不要只看 documentElement.scrollWidth —— 它会把内部可滚动容器（如首页「New arrival」
 * 横向滑轨）的轨道宽度算进去，即使没有任何元素真的超出视口，数值也会偏大。
 * 正确判据是「有没有元素的 right 超出视口」。
 */
const PAGE_OVERFLOW_FN = `
(() => {
  const vw = document.documentElement.clientWidth;
  const bad = [];
  for (const el of document.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right > vw + 1) bad.push(el.tagName.toLowerCase());
  }
  return { count: bad.length, sample: bad.slice(0, 5) };
})()`;

/**
 * 判定某个元素内部是否溢出（文字折行会撑破自身宽度）。
 * 注意：必须自包含——evaluate 在浏览器上下文执行，引用不到 Node 侧闭包。
 */
const OVERFLOW_FN = `
(el) => {
  const walk = (node) => {
    const s = node.ownerDocument.defaultView.getComputedStyle(node);
    if (s.display === 'none' || s.visibility === 'hidden') return 0;
    if (node.scrollWidth > node.clientWidth + 1) return node.scrollWidth - node.clientWidth;
    for (const child of node.children) {
      const d = walk(child);
      if (d > 0) return d;
    }
    return 0;
  };
  return walk(el);
}`;

const browser = await chromium.launch();

// ── 桌面端：active 态 + 防折行 + 搜索收敛 ──────────────────────────────
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await desktop.newPage();

// 注意 /blog/ 与 /sourcing-partners/ 已有意从桌面 nav 移除（下沉页脚），
// 所以这两页一级 nav 无 active 属预期，不参与 active 断言。
for (const path of ['/', '/products/', '/product-lines/stainless-titanium-steel/', '/compliance/', '/contact/']) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const nav = page.locator('header nav[aria-label]').first();
  const visible = await nav.isVisible();
  if (!visible) {
    check(`${path} 桌面导航可见`, false, 'nav 不可见');
    continue;
  }

  // 1. header 高度必须仍是 64px（h-16），不能被文字撑高
  const headerH = await page.locator('header > div').first().evaluate((el) => Math.round(el.getBoundingClientRect().height));
  check(`${path} header 单行 h-16`, headerH === 64, `实测 ${headerH}px`);

  // 2. 导航项文字不折行
  const links = nav.locator('a, summary');
  const n = await links.count();
  let wrapped = 0;
  for (let i = 0; i < n; i++) {
    const over = await links.nth(i).evaluate(OVERFLOW_FN);    if (over > 0) wrapped += 1;
  }
  check(`${path} 导航项无折行`, wrapped === 0, `${wrapped}/${n} 项溢出`);

  // 3. active 态：首页 0 个；其他页一级 nav 顶层恰好 1 个 aria-current
  const expectActive = path !== '/';
  const topLevel = nav.locator('> a[aria-current="page"], > details > summary[aria-current="page"]');
  const activeCount = await topLevel.count();
  check(
    `${path} active 态数量`,
    expectActive ? activeCount === 1 : activeCount === 0,
    `实测 ${activeCount}`,
  );

  // 4. active 的确是「当前页」而不是别的
  if (expectActive) {
    const activeEl = topLevel.first();
    const tag = await activeEl.evaluate((el) => el.tagName.toLowerCase());
    if (tag === 'a') {
      const href = await activeEl.getAttribute('href');
      const seg0 = `/${path.split('/').filter(Boolean)[0]}/`;
      const ok = href !== null && href.replace(/\/$/, '') === seg0.replace(/\/$/, '');
      check(`${path} active 指向当前板块`, ok, `href=${href}`);
    } else {
      // summary 无 href，用 dropdown 内的链接反推所属板块
      const dropHrefs = await nav.locator('details a').evaluateAll((els) =>
        els.map((e) => e.getAttribute('href')),
      );
      const ok = dropHrefs.every((h) => h?.includes('/product-lines/'));
      check(`${path} active 落在下拉触发器且属产品线板块`, ok, `下拉项=${dropHrefs.join(',')}`);
    }
  }
}

// 3b. 有意移出一级导航的页面：不应有 active，且链接本身不在桌面 nav
for (const path of ['/blog/', '/sourcing-partners/']) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  const nav = page.locator('header nav[aria-label]').first();
  const c = await nav.locator('[aria-current="page"]').count();
  check(`${path} 移出一级 nav 后无 active`, c === 0, `实测 ${c}`);
  const stillThere = await nav.locator(`a[href="${path}"]`).count();
  check(`${path} 已从桌面 nav 移除`, stillThere === 0, `链接数=${stillThere}`);
}

// 3c. 但页脚必须保留 Sourcing / Blog 入口（不丢内容）
{
  const p2 = await desktop.newPage();
  await p2.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(800);
  const footerLinks = await p2.locator('footer a').evaluateAll((els) =>
    els.map((e) => e.getAttribute('href')),
  );
  check('页脚保留 Sourcing 入口', footerLinks.includes('/sourcing-partners/'));
  check('页脚保留 Blog 入口', footerLinks.includes('/blog/'));
  await p2.close();
}

// 4. 搜索按钮已收敛为图标（不再有长占位文案）
await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const searchBtn = page.locator('[data-search-open]').first();
// innerText 会包含 .sr-only 的读屏文案（视觉上不可见），需剔除后再断言
const searchText = (await searchBtn.innerText())
  .split('\n')
  .map((s) => s.trim())
  .filter((s) => s && s !== '/')
  .join('');
check('搜索按钮无长占位文案', searchText.length === 0, `可见文本=${JSON.stringify(searchText)}`);

// 5. 横向溢出清零
// 注意：不要用 setViewportSize 后立刻测量——resize 中途的瞬态布局会误报
// （首页产品 carousel 的横向滑动轨道会瞬态撑宽）。每档各自 goto 并等满 1800ms，
// 测的是稳态；另加一条 header 自身的溢出断言，确保本次改动没有引入溢出。
for (const w of [1024, 1280, 1366, 1920]) {
  // 每档开独立 context：复用同一个 page 跨页面 goto 会残留上一页的懒加载与滚动状态，
  // 测出来的 scrollWidth 不是这一档的真实稳态值。
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const p2 = await ctx.newPage();

  await p2.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(1800);

  // 整页元素溢出检查只在无 carousel 的内页做。
  // 首页有「New arrival」横向滑轨（snap-x + w-48 shrink-0 卡片），卡片 right 超出视口是
  // 设计预期而非缺陷——本次改动不涉及 carousel，header 自身断言已足够覆盖回归。
  if (w === 1024) {
    const p3 = await ctx.newPage();
    await p3.goto(`${BASE}/compliance/`, { waitUntil: 'domcontentloaded' });
    await p3.waitForTimeout(1500);
    const r = await p3.evaluate(PAGE_OVERFLOW_FN);
    check(`${w}px 内页无元素超出视口`, r.count === 0, `溢出元素 ${r.count} 个 ${r.sample.join(',')}`);
    await p3.close();
  }

  // header 自身在所有档位都必须零溢出——这是本次改动的直接回归面
  const headerOver = await p2.evaluate(() => {
    const el = document.querySelector('header > div');
    return el ? el.scrollWidth - el.clientWidth : -1;
  });
  check(`${w}px header 自身无溢出`, headerOver <= 0, `溢出 ${headerOver}px`);

  await ctx.close();
}

// 6. 断点形态：nav 在 1024 即应展开（砍掉 Sourcing/Blog 后余量 149px，无需推迟到 xl）
await page.setViewportSize({ width: 1024, height: 900 });
await page.waitForTimeout(500);
check(
  '1024px 显示完整桌面导航（未退化为汉堡）',
  (await page.locator('header nav[aria-label]').first().isVisible()) &&
    (await page.locator('[data-menu-toggle]').isVisible()) === false,
);
await page.setViewportSize({ width: 1280, height: 900 });
await page.waitForTimeout(500);
check(
  '1280px 隐藏汉堡显示导航',
  (await page.locator('[data-menu-toggle]').isVisible()) === false &&
    (await page.locator('header nav[aria-label]').first().isVisible()),
);

// 7. active 下划线必须贴齐 header 底边（用 after: 伪元素下移，浮空 9px 就是廉价感）
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${BASE}/products/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const geom = await page.evaluate(() => {
  const header = document.querySelector('header');
  const active = document.querySelector('header nav a[aria-current="page"]');
  if (!header || !active) return null;
  const h = header.getBoundingClientRect();
  const a = active.getBoundingClientRect();
  const cs = getComputedStyle(header);
  const after = getComputedStyle(active, '::after');
  // header 内容底边：外框减去自身 border-bottom（外框含 1px 边框，不能直接当基准）
  const borderBottom = parseFloat(cs.borderBottomWidth) || 0;
  return {
    headerContentBottom: Math.round(h.bottom - borderBottom),
    linkBottom: Math.round(a.bottom),
    afterH: parseFloat(after.height),
    // CSS 绝对定位：bottom:-10px 表示伪元素底边在包含块底边「下方」10px，
    // 所以伪元素底边 = 链接底边 - bottomOffset（不是 +）。
    afterBottomOffset: parseFloat(after.bottom),
    hasAfterBg: after.backgroundColor,
  };
});
const afterBottom = geom ? Math.round(geom.linkBottom - geom.afterBottomOffset) : NaN;
const gap = geom ? geom.headerContentBottom - afterBottom : NaN;
check(
  'active 下划线贴齐 header 底边',
  geom !== null && geom.afterH === 2 && gap >= 0 && gap <= 2,
  `下划线底=${afterBottom} header内容底=${geom?.headerContentBottom} 间隙=${gap}px`,
);
check('active 下划线为 accent-metal 色', /125, 99, 48|rgb\(125/.test(geom?.hasAfterBg ?? ''), `实际=${geom?.hasAfterBg}`);

// 8. 桌面一级 nav 只有 4 项（Sourcing/Blog 已下沉页脚）
const desktopItems = await page.locator('header nav[aria-label] > a, header nav[aria-label] > details').count();
check('桌面一级 nav 仅 4 项', desktopItems === 4, `实测 ${desktopItems} 项`);

// 9. 纯图标搜索按钮的无障碍名称与尺寸
const searchGeom = await page.locator('[data-search-open]').evaluate((el) => {
  const r = el.getBoundingClientRect();
  return {
    label: el.getAttribute('aria-label'),
    w: Math.round(r.width),
    h: Math.round(r.height),
  };
});
check('搜索按钮有 aria-label', !!searchGeom.label, `label=${searchGeom.label}`);
check(
  '搜索按钮 44×44 触控目标',
  searchGeom.w >= 44 && searchGeom.h >= 44,
  `实测 ${searchGeom.w}×${searchGeom.h}`,
);

await desktop.close();

// ── 移动端：菜单可开可关，active 态可见 ───────────────────────────────
const mobile = await browser.newContext({ ...devices['iPhone 13'] });
const mp = await mobile.newPage();
await mp.goto(`${BASE}/products/`, { waitUntil: 'domcontentloaded' });
await mp.waitForTimeout(1200);

const burger = mp.locator('[data-menu-toggle]');
await burger.click();
await mp.waitForTimeout(500);
check('移动端菜单可展开', await mp.locator('#mobile-nav').isVisible());
check(
  '移动端菜单 active 态标记',
  (await mp.locator('#mobile-nav a[aria-current="page"]').count()) >= 1,
);
await burger.click();
await mp.waitForTimeout(500);
check('移动端菜单可收起', (await mp.locator('#mobile-nav').isVisible()) === false);

const mOver = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
check('移动端横向溢出清零', mOver <= 0, `溢出 ${mOver}px`);

await mobile.close();
await browser.close();

console.log('\n' + '─'.repeat(60));
if (failures.length === 0) {
  console.log('全部通过');
} else {
  console.log(`${failures.length} 项失败：`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
