// scripts/emoji-scan.mjs — P0 emoji 图标门禁（全 src 递归扫描）
//
// P0-1 规则：禁止用 emoji 作功能图标。图标一律为项目锁定图标库（lucide）的 SVG。
//
// 为什么从「手写文件清单」改成「递归扫描 src/」：清单漏一个文件，门禁就有一条缝——
// 新增的 src/components/product-line/* 正是这样最容易漏进来的地方（它们不在旧清单里）。
// 递归扫描后「新文件自动被覆盖」，门禁不再依赖「记得改清单」这种人工纪律。
//
// 例外：`src/content/`（markdown 正文 / 笔记）属 UGC，按 P0 规则允许出现 emoji，故排除。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EMOJI =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu;

const ROOT = 'src';
/** 扫描的文本扩展名（源码 / 样式 / 数据），二进制与图片一律跳过 */
const EXTS = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.json', '.html']);
/** 不扫的目录：content 是 UGC（允许 emoji） */
const SKIP_DIRS = new Set(['content']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walk(path));
    } else if (EXTS.has(name.slice(name.lastIndexOf('.')))) {
      out.push(path);
    }
  }
  return out;
}

const files = walk(ROOT);
let bad = 0;
for (const f of files) {
  const m = readFileSync(f, 'utf8').match(EMOJI);
  if (m) {
    console.log(`EMOJI  ${f}  ${JSON.stringify([...new Set(m)])}`);
    bad += 1;
  }
}

console.log(`\n扫描 ${files.length} 个文件（src/ 递归，已排除 src/content/），含 emoji 的文件：${bad}`);
process.exit(bad ? 1 : 0);
