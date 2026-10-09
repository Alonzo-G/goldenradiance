/**
 * scripts/find-overflow.mjs — 横向溢出肇事元素定位器（通用诊断工具）
 *
 * 用法：先起 preview（4321），再 node scripts/find-overflow.mjs [path] [width...]
 * 例：  node scripts/find-overflow.mjs / 1024 1280
 *
 * 为什么需要它：横向溢出的根因往往在深层某个元素，肉眼和「scrollWidth vs clientWidth」
 * 都只能告诉你「溢出了」，不能告诉你「谁溢出的」。这个脚本遍历 DOM 找出所有
 * getBoundingClientRect().right > viewport 的元素，直接点名肇事者。
 */
import { chromium } from 'playwright';

// 注意：环境里存在一个无效的 BASE_URL（指向 PortableGit），必须校验后才采信
const envBase = process.env.BASE_URL ?? '';
const BASE = /^https?:\/\//.test(envBase) ? envBase : 'http://localhost:4321';
// 注意：Git Bash 会把裸 `/` 参数转成 Windows 路径（如 compliance -> D:/WorkBuddy/...），
// 所以路径必须由调用方写成 `compliance` 或 `/compliance`，这里统一补前导斜杠。
const rawPath = process.argv[2] ?? '/';
const path = rawPath.startsWith('/') || rawPath === '' ? rawPath : `/${rawPath}`;
const widths = process.argv.slice(3).map(Number).filter(Boolean);
const viewports = widths.length ? widths : [320, 375, 768, 1024, 1280, 1440];

const browser = await chromium.launch();

for (const width of viewports) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const r = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      if (rect.right > vw + 1) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className?.toString?.() ?? '').slice(0, 120),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          text: (el.textContent ?? '').trim().slice(0, 50),
        });
      }
    }
    return { vw, scrollW: document.documentElement.scrollWidth, out: out.slice(0, 10) };
  });

  const over = r.scrollW - r.vw;
  const verdict = over > 0 ? `溢出 ${over}px` : 'OK';
  console.log(`\n${'='.repeat(58)}\n视口 ${width}px — ${verdict}（scrollW ${r.scrollW}）`);

  if (over > 0 && r.out.length) {
    console.log(`肇事元素 ${r.out.length} 个：\n`);
    for (const o of r.out) {
      console.log(`  ${o.tag}  right=${o.right}  width=${o.width}`);
      console.log(`    class: ${o.cls}`);
      console.log(`    text : ${o.text}\n`);
    }
  }
  await page.close();
}

await browser.close();
