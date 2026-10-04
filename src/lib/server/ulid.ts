// src/lib/server/ulid.ts — Crockford Base32 单调 ULID（IMPLEMENTATION-NOTES-ARCH §4.1）
// 字母表剔除 I/L/O/U，避免人工抄录歧义；时间 10 字符 + 随机 16 字符 = 26 字符。
// 零依赖：时间取 Date.now()，随机取 Web Crypto（Workers 与 Node 18+ 均原生提供）。

const ENC = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// 模块级单调状态：同毫秒内多次生成对随机部分 +1 进位（不回退），
// 让同批 INSERT 在 D1 内保持聚簇友好（notes §4.1 第 4 点）。
let lastTime = -1;
let lastRand = 0n;

function randomBits(): bigint {
  const b = crypto.getRandomValues(new Uint8Array(10));
  let v = 0n;
  for (const x of b) v = (v << 8n) | BigInt(x);
  return v;
}

export function ulid(now: number = Date.now()): string {
  let rand: bigint;
  if (now === lastTime) {
    rand = lastRand + 1n;
    if (rand >> 80n) {
      rand = randomBits();
    }
  } else {
    rand = randomBits();
  }
  lastTime = now;
  lastRand = rand;

  let time = now;
  let head = '';
  for (let i = 0; i < 10; i++) {
    head = ENC[time % 32] + head;
    time = Math.floor(time / 32);
  }

  let tail = '';
  for (let i = 0; i < 16; i++) {
    tail = ENC[Number(rand & 31n)] + tail;
    rand >>= 5n;
  }
  return head + tail;
}
