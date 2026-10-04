// src/components/rfq/items.ts — 篮内条目：加入 / 渲染 / 改量 / 删除 / 批量加入 / 粘贴 SKU
import { computed } from 'nanostores';
import {
  rfqItems,
  rfqCount,
  rfqPcs,
  addToRfq,
  setQty,
  removeItem,
  MAX_QTY_PER_SKU,
  type RfqEntry,
} from '../../stores/rfq';
import { roundToMoq } from '../../lib/shared/format';
import { t } from '../../i18n';
import type { SkuIndexItem } from '../../lib/products/queries';
import { esc, trashIcon, skuIndex } from './dom';
import { ensureTurnstile } from './submit';

/* ---------- Add to RFQ（卡片 hover 按钮 / PDP / 批量勾选） ---------- */
function handleAddToRfq(btn: HTMLElement) {
  const sku = btn.dataset.sku ?? '';
  if (!sku) return;
  let qty = Number(btn.dataset.moq ?? 0);
  const panel = btn.closest('[data-rfq-scope]') ?? document;
  const qtyInput = panel.querySelector<HTMLInputElement>('[data-qty-input]');
  if (qtyInput && qtyInput.value) {
    qty = roundToMoq(Number(qtyInput.value) || qty, qty);
  }
  addToRfq({ sku, slug: btn.dataset.slug ?? '', title: btn.dataset.title ?? '', qty });
  flashAdded(btn);
}

function flashAdded(btn: HTMLElement) {
  const label = btn.querySelector<HTMLElement>('[data-add-label]');
  if (!label || label.dataset.busy === '1') return;
  label.dataset.busy = '1';
  const prev = label.textContent ?? '';
  label.textContent = t('cta.addedToRfq');
  setTimeout(() => {
    label.textContent = prev;
    delete label.dataset.busy;
  }, 800);
}

/* ---------- 条目列表渲染（所有 [data-rfq-panel] 实例同步） ---------- */
export function renderItems() {
  const items = rfqItems.get();
  document.querySelectorAll<HTMLElement>('[data-rfq-panel]').forEach((panel) => {
    const empty = panel.querySelector<HTMLElement>('[data-rfq-empty]');
    const list = panel.querySelector<HTMLUListElement>('[data-rfq-items]');
    const form = panel.querySelector<HTMLFormElement>('[data-rfq-form]');
    if (!empty || !list || !form) return;
    const hasItems = items.length > 0;
    empty.classList.toggle('hidden', hasItems);
    list.classList.toggle('hidden', !hasItems);
    // form 的初始隐藏是 SSR 的 hidden 属性（非 class）——必须同步属性本体，
    // 否则 class 切了 attribute 还挂着，表单永远 display:none（历史 bug）。
    form.hidden = !hasItems;
    form.classList.toggle('hidden', !hasItems);
    // 表单首次可见（有 SKU 入篮）时预渲染 Turnstile widget，token 通过 callback
    // 自动收集。此时 form 已从 hidden 切到可见，容器尺寸正常，widget 能完成挑战。
    if (hasItems) void ensureTurnstile(panel);
    list.innerHTML = items
      .map(
        (it: RfqEntry) => `
        <li class="flex items-start gap-3 py-3">
          <div class="min-w-0 flex-1">
            <p class="font-mono text-xs text-meta">${esc(it.sku)}</p>
            <p class="truncate text-sm text-fg">${esc(it.title)}</p>
            <label class="mt-1 block text-xs text-muted">
              ${esc(t('pdp.qty.label'))}
              <input type="number" inputmode="numeric" min="1" max="${MAX_QTY_PER_SKU}" step="1"
                value="${it.qty}" data-qty-for="${esc(it.sku)}"
                class="tnum ml-2 h-8 w-20 rounded-xs border border-border px-2 text-center text-sm" />
            </label>
          </div>
          <button type="button" data-remove-sku="${esc(it.sku)}"
            aria-label="${esc(t('rfq.item.remove', { sku: it.sku }))}"
            class="flex size-9 items-center justify-center rounded-sm text-muted hover:text-danger">
            ${trashIcon()}
          </button>
        </li>`,
      )
      .join('');
  });
}

/* ---------- 粘贴 SKU ---------- */
function handlePaste(scope: HTMLElement | null) {
  if (!scope) return;
  const input = scope.querySelector<HTMLTextAreaElement>('[data-paste-input]');
  const status = scope.querySelector<HTMLElement>('[data-paste-status]');
  if (!input || !status) return;
  const codes = input.value
    .split(/[\s,;]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const index = skuIndex();
  const matched: SkuIndexItem[] = [];
  const unmatched: string[] = [];
  for (const code of codes) {
    const hit = index.find((it) => it.sku.toUpperCase() === code);
    if (hit) matched.push(hit);
    else unmatched.push(code);
  }
  for (const it of matched) {
    addToRfq({ sku: it.sku, slug: it.slug, title: it.title, qty: it.rfqQty });
  }
  status.textContent = t('rfq.paste.parse', {
    matched: matched.length,
    unmatched: unmatched.length,
  });
  status.classList.remove('hidden');
}

export function bindItemEvents() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const addBtn = target.closest<HTMLElement>('[data-add-to-rfq]');
    if (addBtn) handleAddToRfq(addBtn);
    const btn = target.closest<HTMLElement>('[data-remove-sku]');
    if (btn) removeItem(btn.dataset.removeSku ?? '');
    /* 批量加入（勾选 SKU 一次入篮） */
    const bulkBtn = target.closest<HTMLElement>('[data-bulk-add]');
    if (bulkBtn) {
      const checked = Array.from(
        document.querySelectorAll<HTMLInputElement>('[data-bulk-check]:checked'),
      );
      for (const cb of checked) {
        addToRfq({
          sku: cb.value,
          slug: cb.dataset.slug ?? '',
          title: cb.dataset.title ?? '',
          qty: Number(cb.dataset.moq ?? 0),
        });
        cb.checked = false;
      }
    }
    /* 粘贴 SKU 面板开合与提交 */
    const toggle = target.closest<HTMLElement>('[data-paste-toggle]');
    if (toggle) {
      const block = toggle
        .closest('[data-rfq-empty]')
        ?.querySelector<HTMLElement>('[data-paste-block]');
      if (block) block.hidden = !block.hidden;
    }
    const pasteSubmit = target.closest<HTMLElement>('[data-paste-submit]');
    if (pasteSubmit) handlePaste(pasteSubmit.closest('[data-rfq-empty]') as HTMLElement);
  });
  document.addEventListener('change', (e) => {
    const input = (e.target as HTMLElement).closest<HTMLInputElement>('[data-qty-for]');
    if (input) setQty(input.dataset.qtyFor ?? '', Number(input.value) || 1);
  });
}

/* 总计行（抽屉头部） */
export function bindTotals() {
  computed([rfqCount, rfqPcs], (c, p) => ({ c, p })).subscribe(({ c, p }) => {
    document.querySelectorAll<HTMLElement>('[data-rfq-total]').forEach((el) => {
      el.textContent = t('rfq.total', { count: c, pcs: p });
    });
  });
}

/* 订阅 store：任何入篮/删除/改量都触发 renderItems 重渲染。
 * 修复「addToRfq 后表单仍 hidden、看不到验证弹窗与提交按钮」的核心 bug——
 * 此前 renderItems 只在 rfq-client 初始化时跑一次，store 变化后无人重绘。 */
export function bindItems() {
  rfqItems.subscribe(() => renderItems());
}

