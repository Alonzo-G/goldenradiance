// src/components/rfq/rfq-client.ts — RFQ 客户端入口：装配各模块 + 市场联动 + 初始化
// 拆分结构：drawer.ts（抽屉开合）/ items.ts（条目）/ submit.ts（提交）/ dom.ts（工具）
import { pruneExpired, addToRfq } from '../../stores/rfq';
import { complianceContext, type Market } from '../../stores/compliance';
import { t } from '../../i18n';
import { bindDrawerEvents } from './drawer';
import { renderItems, bindItemEvents, bindTotals } from './items';
import { bindSubmit } from './submit';
import { skuIndex } from './dom';

bindDrawerEvents();
bindItemEvents();
bindSubmit();
bindTotals();

/* ---------- 初始化 ---------- */
pruneExpired();
renderItems();
document.querySelectorAll<HTMLFormElement>('[data-rfq-form]').forEach((f) => {
  f.dataset.loadedAt = String(Date.now());
});

/* ---------- 规格邀约入口：/rfq/?sku=XX&note=YY 预填（SpecTable「Request full spec sheet」） ----------
 * 把 SKU 自动加入 RFQ 篮、备注预填进 notes 框——让「看一眼规格不全就走」的买家一键发起询盘。
 * 找不到 SKU（已改名/下架）或没有 note 时静默跳过，不打断正常浏览。 */
function applyDeepLink(): void {
  const params = new URLSearchParams(window.location.search);
  const sku = params.get('sku')?.trim().toUpperCase();
  const note = params.get('note')?.trim();
  if (!sku && !note) return;
  if (sku) {
    const hit = skuIndex().find((it) => it.sku.toUpperCase() === sku);
    if (hit) addToRfq({ sku: hit.sku, slug: hit.slug, title: hit.title, qty: hit.rfqQty });
  }
  if (note) {
    document.querySelectorAll<HTMLTextAreaElement>('[name="message"]').forEach((el) => {
      if (!el.value.trim()) el.value = note;
    });
  }
}
applyDeepLink();

// Compliance-for 标签联动 + 表单市场默认值（SSR 恒 eu_uk）
const MARKET_LABELS: Record<string, string> = {
  eu_uk: t('utility.market.eu_uk'),
  us: t('utility.market.us'),
  middle_east: t('utility.market.middle_east'),
  rest: t('utility.market.rest'),
};
const paintMarket = (m: string) => {
  document.querySelectorAll<HTMLElement>('[data-compliance-market-label]').forEach((el) => {
    el.textContent = MARKET_LABELS[m] ?? m;
  });
  document.querySelectorAll<HTMLSelectElement>('[data-market-input]').forEach((sel) => {
    sel.value = m === 'rest' ? 'other' : m;
  });
  document.querySelectorAll<HTMLSelectElement>('[data-market-select]').forEach((sel) => {
    sel.value = m;
  });
};
complianceContext.subscribe(paintMarket);
document.querySelectorAll<HTMLSelectElement>('[data-market-select]').forEach((sel) => {
  sel.addEventListener('change', () => {
    complianceContext.set(sel.value as Market);
  });
});
