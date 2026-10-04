// src/components/rfq/dom.ts — RFQ 客户端共享 DOM 工具（转义 / 服务端图标克隆 / SKU 索引读取）
import type { SkuIndexItem } from '../../lib/products/queries';

declare global {
  interface Window {
    __SKU_INDEX__?: SkuIndexItem[];
  }
}

export function skuIndex(): SkuIndexItem[] {
  return window.__SKU_INDEX__ ?? [];
}

/** 服务端渲染好的 Lucide trash-2 图标（禁手写 SVG；客户端克隆 astro-icon 产物） */
export function trashIcon(): string {
  return document.querySelector<HTMLElement>('[data-icon-trash-src]')?.innerHTML ?? '';
}

export function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
