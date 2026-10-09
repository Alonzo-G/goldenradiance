// src/components/product/catalog.ts — 目录筛选/排序/双视图/批量加入（vanilla TS，AC-02/02a/03/04）
// 真实素材款（dataStatus: real）：渲染实拍图，价格/MOQ 未确认时走降级文案；
// 未确认字段不参与 facet，选中材质/镀层/MOQ 档筛选时这类款自然被排除（诚实的过滤结果）。
import { t } from '../../i18n';
import type { SkuIndexItem } from '../../lib/products/queries';
import { styleLabel, MOTIF_TAGS } from '../../lib/products/styles';
import { lineLabel } from '../../lib/products/lines';
import { CATALOG_AXES } from '../../lib/products/deeplink';
import { cardHtml, rowHtml } from './catalog-views';

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
              ? // 查 LINE_LABEL_KEY 而不是现场拼 `nav.line.${alloy/steel}`：
                // 三元拼 key 的失败态是把 t() 返回的 key 字符串直接显示成线名。
                lineLabel(cb.value) || cb.value
            : axis === 'scenario'
              ? t(`filter.scenario.${cb.value === 'daily' ? 'daily' : 'volume'}` as 'filter.scenario.daily')
              : axis === 'style'
                ? styleLabel(cb.value)
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
  const styles = by('style');
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
      // 款式轴内部是 OR：一款可同时带 cuff + bangle，命中任一选中款式即通过。
      // styles 为空数组的产品（手链 80/892）会被自然排除——这是诚实的过滤：
      // 未标注款式的产品本来就不属于任何款式类，不假装它属于。
      (!styles.size || it.styles.some((s) => styles.has(s))) &&
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

// URL 深链初始化：读 ?category= &line= &style= 回填筛选（首页品类/路线区块深链跳转）。
// 只读稳定枚举轴；material/plating 为自由文本、band/scenario 值不稳定，不进深链。
//
// ghost checkbox：URL 里的值在侧栏找不到对应 checkbox 时（款式低于渲染阈值如
// ?style=zodiac，或手输的未知值，或已下架的品类），补一个隐藏的 checked checkbox。
// 因为过滤链路完全建立在「被 checked 的 checkbox」上（activeFilters 读 DOM），
// 不补就等于这个参数被静默忽略——买家以为筛过了、实际看的是全量。
// 补成 checkbox 后，过滤 / chip 显示 / chip 移除 / clear all 全部复用现成逻辑，零特例分支。
function initFromUrl(): void {
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  // 轴名 import 自 deeplink.ts（拼 URL 与读 URL 共用同一份）。两边各写一份时，
  // 打错一个字母的结果就是「深链看着对、点了不筛选」——UI 上完全看不出来。
  for (const axis of CATALOG_AXES) {
    const values = params.getAll(axis);
    if (values.length === 0) continue;
    for (const v of values) {
      const cb = form.querySelector<HTMLInputElement>(
        `input[name="${axis}"][value="${CSS.escape(v)}"]`,
      );
      if (cb) {
        cb.checked = true;
        continue;
      }
      const ghost = document.createElement('input');
      ghost.type = 'checkbox';
      ghost.name = axis;
      ghost.value = v;
      ghost.checked = true;
      ghost.dataset.ghost = '';
      ghost.className = 'hidden';
      form.appendChild(ghost);
    }
  }

  // 深链强制展开：选中项在默认折叠的 Motif 组里时必须展开，
  // 否则会出现「chip 显示已选 Four-leaf clover、侧栏却看不到该项」的自相矛盾。
  const motif = document.querySelector<HTMLDetailsElement>('[data-style-motif]');
  if (motif && form) {
    const motifTags = new Set<string>(MOTIF_TAGS);
    const anyMotifChecked = [...form.querySelectorAll<HTMLInputElement>('input[name="style"]:checked')].some(
      (cb) => motifTags.has(cb.value),
    );
    if (anyMotifChecked) motif.open = true;
  }

  // 移动端筛选是全屏 sheet、纵向可滚，没有「折叠省高度」的必要；
  // 而桌面端 Motif 默认折叠会导致手机买家根本看不到 motif 选项。两端统一全展开。
  if (window.matchMedia('(max-width: 1023px)').matches) {
    document.querySelectorAll<HTMLDetailsElement>('[data-style-motif]').forEach((d) => {
      d.open = true;
    });
  }
}

initFromUrl();
render();

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeFilters();
});
