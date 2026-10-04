// src/lib/shared/turnstile.ts — Turnstile 前端辅助（客户端模块）
// 设计目标：让"提交表单"永远能拿到一个真实 token，而不是把公开 sitekey 当 token 送出去。
//
// 三个坑（历史教训，勿回退）：
//  1. sitekey ≠ token。sitekey 是公钥（挂 widget 用），token 是用户通过挑战后由
//     Cloudflare 下发的随机串。两者绝不能混用——把 sitekey 当 token 送 siteverify
//     必然 invalid。
//  2. widget 渲染是异步的：loadApi（加载脚本）+ render（挑战完成）都需要时间，
//     "点提交瞬间才 render 再 getToken" 拿到的永远是空。
//  3. token 单次有效：siteverify 消费一次后失效，失败重试必须先 reset() 重取。
//
// 本模块用 Cloudflare 官方推荐的「callback 自动收集」模式：
//   renderTurnstile(el, onToken) —— 渲染后自动挑战，拿到 token 通过回调返回，
//   表单提交时直接读缓存的 token，无需等待。

export const TURNSTILE_SITEKEY = '0x4AAAAAAFNrqMuBQzU6nO8t';

export interface TurnstileHandle {
  /** 当前缓存的 token；尚未挑战完成时为 undefined */
  getToken(): string | undefined;
  /** 重置 widget 并触发重新挑战（token 失效后调用） */
  reset(): void;
}

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback?: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
      theme?: 'auto' | 'light' | 'dark';
    },
  ) => string;
  reset: (id?: string) => void;
  getResponse: (id?: string) => string;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptLoading: Promise<TurnstileApi | null> | null = null;

function loadApi(): Promise<TurnstileApi | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptLoading) return scriptLoading;
  scriptLoading = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve(window.turnstile ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
    // 兜底：10s 内未加载完成（离线/被墙）则放弃，返回 null 让调用方走降级分支。
    setTimeout(() => resolve(window.turnstile ?? null), 10000);
  });
  return scriptLoading;
}

/**
 * 渲染 Turnstile widget，token 通过 callback 自动收集到内部缓存。
 * @param container 挂载 widget 的 DOM 节点（必须已在文档流中、可见，尺寸非 0）
 * @param onToken   token 变化回调（挑战完成 / 过期重置后触发），表单据此感知可用性
 * @returns 句柄；脚本不可用时返回降级句柄（getToken 恒 undefined，调用方按失败处理）
 */
export async function renderTurnstile(
  container: HTMLElement,
  onToken?: (token: string | undefined) => void,
): Promise<TurnstileHandle> {
  const api = await loadApi();
  let token: string | undefined;

  if (!api) {
    // 无网络降级：拿不到真 token，getToken 返回 undefined（调用方提示重试，
    // 绝不把 sitekey 当 token 上送）。
    return {
      getToken: () => undefined,
      reset: () => undefined,
    };
  }

  const widgetId = api.render(container, {
    sitekey: TURNSTILE_SITEKEY,
    callback: (t) => {
      token = t;
      onToken?.(t);
    },
    'expired-callback': () => {
      token = undefined;
      onToken?.(undefined);
    },
    'error-callback': () => {
      token = undefined;
      onToken?.(undefined);
    },
  });

  return {
    getToken: () => token,
    reset: () => {
      token = undefined;
      onToken?.(undefined);
      window.turnstile?.reset(widgetId);
    },
  };
}
