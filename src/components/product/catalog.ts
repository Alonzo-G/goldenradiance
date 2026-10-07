// src/components/product/catalog.ts — 目录筛选/排序/双视图/批量加入（vanilla TS，AC-02/02a/03/04）
// 真实素材款（dataStatus: real）：渲染实拍图，价格/MOQ 未确认时走降级文案；
// 未确认字段不参与 facet，选中材质/镀层/MOQ 档筛选时这类款自然被排除（诚实的过滤结果）。
import { t } from '../../i18n';
import type { SkuIndexItem } from '../../lib/products/queries';
import { priceRange, imageSrcset, lineToken } from '../../lib/shared/format';

interface Index {
  window: { __SKU_INDEX__?: SkuIndexItem[] };
}

const items: SkuIndexItem[] = (window as unknown as Index['window']).__SKU_INDEX__ ?? [];

const listBody = document.querySelector<HTMLTableSectionElement>('[data-catalog-list-body]');
const listView = document.querySelector<HTMLElement>('[data-catalog-list]');
const gridView = document.querySelector<HTMLElement>('[data-catalog-grid]');
const empty = document.querySelector<HTMLElement>('[data-catalog-empty]');
const chipsBox = document.querySelector<HTMLElement>('[data-chips]');
const countLabel = document.querySelector<HTMLElement>('[data-results-count]');
const bulkBar = document.querySelector<HTMLElement>('[data-bulk-bar]');
const bulkCount = document.querySelector<HTMLElement>('[data-bulk-count]');
const form = document.querySelector<HTMLFormElement>('[data-filter-form]');

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

let view: 'grid' | 'list' =
  (localStorage.getItem('catalog_view') as 'grid' | 'list') || 'grid';

function activeFilters(): { axis: string; value: string; label: string }[] {
  if (!form) return [];
  const out: { axis: string; value: string; label: string }[] = [];
  form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked:not(:disabled)').forEach((cb) => {
    const axis = cb.name;
    const label =
      axis === 'band'
        ? cb.value === 'on_request'
          ? t('filter.moq.onRequest')
          : t(`filter.moq.${cb.value === '12-30' ? 'b1' : cb.value === '31-60' ? 'b2' : 'b3'}` as 'filter.moq.b1')
        : axis === 'category'
          ? t(`category.${cb.value}` as 'category.earrings')
          : axis === 'line'
            ? t(`nav.line.${cb.value === 'fashion-alloy-brass' ? 'alloy' : cb.value === 'stainless-titanium-steel' ? 'steel' : 'stone'}` as 'nav.line.alloy')
            : axis === 'scenario'
              ? cb.value === 'statement'
                ? t('home.scenarios.statement.title')
                : t(`filter.scenario.${cb.value === 'daily' ? 'daily' : 'volume'}` as 'filter.scenario.daily')
              : cb.value;
    out.push({ axis, value: cb.value, label });
  });
  return out;
}

function apply(): SkuIndexItem[] {
  const filters = activeFilters();
  const by = (axis: string) => new Set(filters.filter((f) => f.axis === axis).map((f) => f.value));
  const lines = by('line');
  const mats = by('material');
  const plats = by('plating');
  const cats = by('category');
  const bands = by('band');
  const scenarios = by('scenario');
  const sort = document.querySelector<HTMLSelectElement>('[data-sort]')?.value ?? 'featured';
  const rows = items.filter(
    (it) =>
      (!lines.size || lines.has(it.line)) &&
      (!scenarios.size || scenarios.has(it.scenario)) &&
      (!mats.size || (it.material != null && mats.has(it.material))) &&
      (!plats.size || (it.plating != null && plats.has(it.plating))) &&
      (!cats.size || cats.has(it.category)) &&
      (!bands.size || (bands.has('on_request') ? it.band == null : it.band != null && bands.has(it.band))),
  );
  if (sort === 'moqAsc') {
    // 未确认 MOQ 的一律排在最后，不假装它是最小值
    return rows.sort((a, b) => {
      if (a.moqMin == null && b.moqMin == null) return a.sku.localeCompare(b.sku);
      if (a.moqMin == null) return 1;
      if (b.moqMin == null) return -1;
      return a.moqMin - b.moqMin;
    });
  }
  if (sort === 'priceAsc') {
    return rows.sort((a, b) => {
      if (a.priceLow == null && b.priceLow == null) return a.sku.localeCompare(b.sku);
      if (a.priceLow == null) return 1;
      if (b.priceLow == null) return -1;
      return a.priceLow - b.priceLow;
    });
  }
  if (sort === 'newest') return rows.reverse();
  // featured：真实新品（本次入库实拍款）优先，随后按 SKU 稳定排序
  return rows.sort((a, b) => {
    const rank = (x: SkuIndexItem) => (x.dataStatus === 'real' ? 0 : 1);
    const d = rank(a) - rank(b);
    return d !== 0 ? d : a.sku.localeCompare(b.sku);
  });
}

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

function cardHtml(it: SkuIndexItem): string {
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

function rowHtml(it: SkuIndexItem): string {
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

function render() {
  const rows = apply();
  if (gridView) gridView.innerHTML = rows.map(cardHtml).join('');
  if (listBody) listBody.innerHTML = rows.map(rowHtml).join('');
  empty?.toggleAttribute('hidden', rows.length > 0);
  if (gridView) gridView.toggleAttribute('hidden', rows.length === 0 || view !== 'grid');
  listView?.toggleAttribute('hidden', rows.length === 0 || view !== 'list');
  countLabel && (countLabel.textContent = t('filter.results', { count: rows.length }));

  // Active chips（AC-03）
  const filters = activeFilters();
  if (chipsBox) {
    chipsBox.innerHTML = filters
      .map(
        (f) => `<button type="button" data-chip data-axis="${f.axis}" data-value="${escapeHtml(f.value)}"
          aria-label="${escapeHtml(t('filter.chip.remove', { label: f.label }))}"
          class="flex h-9 items-center gap-1 rounded-pill border border-border bg-surface px-3 text-xs text-fg hover:border-danger hover:text-danger">
          ${escapeHtml(f.label)} ×</button>`,
      )
      .join('');
  }
  const n = filters.length;
  const mobileLabel = document.querySelector<HTMLElement>('[data-filters-count-label]');
  mobileLabel && (mobileLabel.textContent = t('filter.openFilters', { count: n }));

  // URL query 同步（可分享/可回退；静态站无 JS 降级受限，见交付说明）
  const params = new URLSearchParams();
  for (const f of filters) params.append(f.axis, f.value);
  history.replaceState(null, '', [...params.keys()].length ? `?${params.toString()}` : window.location.pathname);
}

function setView(next: 'grid' | 'list') {
  view = next;
  localStorage.setItem('catalog_view', next);
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) => {
    const active = btn.dataset.view === next;
    btn.setAttribute('aria-checked', String(active));
    btn.classList.toggle('text-fg', active);
    btn.classList.toggle('text-muted', !active);
  });
  render();
}

// 移动端筛选 sheet 开合（全屏覆盖 + 背景滚动锁定）
const filtersPanel = document.querySelector<HTMLElement>('[data-filters]');
const FILTERS_SHEET_CLASSES = ['fixed', 'inset-0', 'z-[300]', 'overflow-y-auto', 'bg-bg', 'p-4'];
function openFilters() {
  if (!filtersPanel) return;
  filtersPanel.classList.remove('hidden');
  filtersPanel.classList.add(...FILTERS_SHEET_CLASSES);
  document.body.style.overflow = 'hidden';
}
function closeFilters() {
  if (!filtersPanel) return;
  filtersPanel.classList.add('hidden');
  filtersPanel.classList.remove(...FILTERS_SHEET_CLASSES);
  document.body.style.overflow = '';
}

form?.addEventListener('change', render);
document.querySelector('[data-sort]')?.addEventListener('change', render);
document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((btn) =>
  btn.addEventListener('click', () => setView((btn.dataset.view as 'grid' | 'list') ?? 'grid')),
);

document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const chip = target.closest<HTMLElement>('[data-chip]');
  if (chip && form) {
    const cb = form.querySelector<HTMLInputElement>(
      `input[name="${chip.dataset.axis}"][value="${CSS.escape(chip.dataset.value ?? '')}"]`,
    );
    if (cb) cb.checked = false;
    render();
  }
  if (target.closest('[data-clear-all]') && form) {
    form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked:not(:disabled)').forEach((cb) => {
      cb.checked = false;
    });
    render();
  }
  if (target.closest('[data-clear-last]') && form) {
    const checked = form.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked:not(:disabled)');
    checked[checked.length - 1]?.click();
    render();
  }
  if (target.closest('[data-filters-toggle]')) openFilters();
  if (target.closest('[data-filters-close]')) closeFilters();
  // 批量条显隐
  const checkedCount = document.querySelectorAll<HTMLInputElement>('[data-bulk-check]:checked').length;
  bulkBar?.toggleAttribute('hidden', checkedCount === 0);
  if (bulkCount) bulkCount.textContent = `${checkedCount}`;
});

render();

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeFilters();
});
