// src/components/product/catalog-views.ts — 目录的卡片/行视图渲染（纯函数，无状态）
//
// 从 catalog.ts 拆出：视图渲染与筛选状态是两个关注点。拆开后 catalog.ts 回到
// 300 行以内（P0 单文件上限），且视图可单独演进而不碰筛选逻辑。
import { t } from '../../i18n';
import type { SkuIndexItem } from '../../lib/products/queries';
import { priceRange, imageSrcset, lineToken } from '../../lib/shared/format';

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** 图片位：真实素材优先，否则沿用程序化占位图（与 ProductImage.astro 同构） */
function imageHtml(it: SkuIndexItem): string {
  const lineBar = `<div class="absolute inset-x-0 bottom-0 h-0.5" style="background: var(--color-${lineToken(it.line)})" aria-hidden="true"></div>`;
  const alt = [it.title, it.material, it.plating].filter(Boolean).join(', ');
  if (it.image) {
    const dims =
      it.image.width && it.image.height
        ? ` width="${it.image.width}" height="${it.image.height}"`
        : '';
    // 响应式候选：缩略图 360w + 中间档 640w（仅主图 >640）+ 主图实测宽度。缺实测宽度则不生成（描述符写错比不写更糟）。
    const srcset = it.image.width ? ` srcset="${escapeHtml(imageSrcset(it.image.thumb, it.image.src, it.image.width) ?? '')}"` : '';
    return `
      <figure class="relative aspect-square overflow-hidden rounded-md border border-border-soft bg-surface-warm">
        <img src="${escapeHtml(it.image.src)}"${srcset}${dims} loading="lazy" decoding="async"
          sizes="(min-width: 1280px) 22vw, (min-width: 640px) 33vw, 50vw"
          class="size-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
          alt="${escapeHtml(alt || it.image.alt)}" />
        ${lineBar}
      </figure>`;
  }
  return `
      <div class="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border-soft bg-surface-warm">
        <div class="absolute bottom-[22%] left-1/2 h-[58%] w-[58%] -translate-x-1/2 rounded-lg bg-border-soft" aria-hidden="true"></div>
        ${lineBar}
      </div>`;
}

/** 价格 + MOQ 组合块（未确认时走降级文案，禁止 tooltip） */
function priceBlockHtml(it: SkuIndexItem): string {
  const hasPrice = it.priceLow != null && it.priceHigh != null;
  const pricePart = hasPrice
    ? `<p class="tnum text-base font-semibold text-fg"><span class="font-medium">${t('price.prefix')}</span> ${priceRange(it.priceLow as number, it.priceHigh as number)}<span class="text-xs font-normal text-muted"> ${t('price.unit')}</span></p>`
    : `<p class="text-base font-semibold text-fg">${t('pdp.price.onRequest')}</p>`;
  const moqPart =
    it.moqMin != null
      ? `<p class="tnum text-sm font-medium text-fg-2">${t('pdp.moq.label', { min: it.moqMin })}</p>`
      : `<p class="tnum text-sm font-medium text-fg-2">${t('pdp.moq.onRequest')}</p>`;
  return `
    <div class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-border-soft pt-2">
      ${pricePart}
      <span class="h-4 w-px self-center bg-border" aria-hidden="true"></span>
      ${moqPart}
    </div>
    <p class="mt-1 text-xs text-meta">${hasPrice ? t('pdp.price.qualifier') : t('pdp.price.onRequestBody')}</p>`;
}

export function cardHtml(it: SkuIndexItem): string {
  const specLine = it.spec || t('pdp.spec.pendingStrip');
  const badge =
    it.dataStatus === 'real'
      ? `<span class="absolute right-2 top-2 z-[2] rounded-xs bg-accent px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-on">${t('pdp.newArrival')}</span>`
      : '';
  return `
  <article class="group relative">
    <label class="absolute left-2 top-2 z-[2] flex size-11 cursor-pointer items-center justify-center rounded-xs border border-border bg-surface">
      <input type="checkbox" data-bulk-check value="${escapeHtml(it.sku)}" data-title="${escapeHtml(it.title)}" data-slug="${escapeHtml(it.slug)}" data-moq="${it.rfqQty}" class="size-4 accent-[var(--color-accent-metal)]" aria-label="${escapeHtml(t('cta.addToRfq'))}: ${escapeHtml(it.sku)}" />
    </label>
    ${badge}
    <a href="/products/${escapeHtml(it.slug)}/" class="block">
      ${imageHtml(it)}
    </a>
    <p class="mt-3 font-mono text-xs text-meta">${escapeHtml(it.sku)}</p>
    <h3 class="mt-1 text-sm font-normal leading-snug text-fg"><a href="/products/${escapeHtml(it.slug)}/" class="line-clamp-2 hover:underline">${escapeHtml(it.title)}</a></h3>
    <p class="mt-1 truncate text-xs text-muted">${escapeHtml(specLine)}</p>
    ${priceBlockHtml(it)}
    <button type="button" data-add-to-rfq data-sku="${escapeHtml(it.sku)}" data-slug="${escapeHtml(it.slug)}" data-title="${escapeHtml(it.title)}" data-moq="${it.rfqQty}"
      class="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-sm border border-accent text-sm font-medium text-accent hover:bg-surface-sunken">
      <span data-add-label>${t('cta.addToRfq')}</span>
    </button>
  </article>`;
}

export function rowHtml(it: SkuIndexItem): string {
  const hasPrice = it.priceLow != null && it.priceHigh != null;
  const spec = it.spec || t('pdp.spec.pendingStrip');
  const moq = it.moqMin != null ? t('pdp.moq.label', { min: it.moqMin }) : t('pdp.moq.onRequest');
  const price = hasPrice
    ? `${t('price.prefix')} ${priceRange(it.priceLow as number, it.priceHigh as number)}`
    : t('pdp.price.onRequest');
  return `
  <tr class="h-14 hover:bg-surface-warm">
    <td class="pr-3"><input type="checkbox" data-bulk-check value="${escapeHtml(it.sku)}" data-title="${escapeHtml(it.title)}" data-slug="${escapeHtml(it.slug)}" data-moq="${it.rfqQty}" class="size-4 accent-[var(--color-accent-metal)]" aria-label="${escapeHtml(t('cta.addToRfq'))}: ${escapeHtml(it.sku)}" /></td>
    <td class="pr-3 font-mono text-xs text-meta">${escapeHtml(it.sku)}</td>
    <td class="pr-3 text-fg">${escapeHtml(it.title)}</td>
    <td class="pr-3 text-muted">${escapeHtml(spec)}</td>
    <td class="tnum pr-3 text-right text-fg-2">${escapeHtml(moq)}</td>
    <td class="tnum pr-3 text-right font-semibold text-fg">${escapeHtml(price)}</td>
    <td class="text-right">
      <button type="button" data-add-to-rfq data-sku="${escapeHtml(it.sku)}" data-slug="${escapeHtml(it.slug)}" data-title="${escapeHtml(it.title)}" data-moq="${it.rfqQty}"
        class="flex h-11 items-center rounded-sm border border-accent px-3 text-sm font-medium text-accent hover:bg-surface-sunken"><span data-add-label>${t('cta.addToRfq')}</span></button>
    </td>
  </tr>`;
}
