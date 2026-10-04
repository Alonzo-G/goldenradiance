// src/lib/shared/turnstile.ts — Turnstile 前端辅助（客户端模块）
// sitekey 是公开值可进代码（IMPLEMENTATION-NOTES §3.3）：dev 测试密钥恒通过。
// token 单次有效（坑 §6.10）：提交失败后调用 reset() 重新取 token。
export const TURNSTILE_SITEKEY = '1x00000000000000000000AA';

export interface TurnstileHandle {
  getToken(): string | undefined;
  reset(): void;
}

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
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
    // 离线 dev 兜底：8s 内未加载完成则放弃（走 fallback token，契约仍完整）
    setTimeout(() => resolve(window.turnstile ?? null), 8000);
  });
  return scriptLoading;
}

/** 渲染 widget；脚本不可用（本地离线）时返回 fallback 句柄，dev 流程不断 */
export async function renderTurnstile(container: HTMLElement): Promise<TurnstileHandle> {
  const api = await loadApi();
  if (!api) {
    // 本地无网络降级：以测试 sitekey 作占位 token（minLength 1 满足，siteverify 会拒绝 → 走错误分支）
    return { getToken: () => TURNSTILE_SITEKEY, reset: () => undefined };
  }
  const widgetId = api.render(container, {
    sitekey: TURNSTILE_SITEKEY,
    callback: () => undefined,
  });
  return {
    getToken: () => window.turnstile?.getResponse(widgetId) || undefined,
    reset: () => window.turnstile?.reset(widgetId),
  };
}
