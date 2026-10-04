// src/components/rfq/submit.ts — 表单校验与提交（对齐 api-spec CreateRfqRequest）
// 坑 §6.10：Turnstile token 单次有效，提交失败必须 reset；AC-16：失败保留篮内容。
// 关键修正：widget 在表单首次可见时即预渲染（renderItems 里触发），token 通过
// callback 缓存；提交时直接读缓存，不再"点提交才 render 导致永远空 token"。
import { rfqItems, clearRfq, type RfqEntry } from '../../stores/rfq';
import { renderTurnstile, type TurnstileHandle } from '../../lib/shared/turnstile';
import { t } from '../../i18n';

// 每个 panel（抽屉 / /rfq/ 页）独立挂载自己的 widget，避免跨 panel 错位取 token。
const turnstiles = new WeakMap<HTMLElement, TurnstileHandle>();

/** 表单变为可见时调用一次：预渲染该 panel 的 widget，token 自动收集。 */
export async function ensureTurnstile(panel: HTMLElement): Promise<void> {
  if (turnstiles.has(panel)) return;
  const slot = panel.querySelector<HTMLElement>('[data-turnstile-slot]');
  if (!slot) return;
  const handle = await renderTurnstile(slot);
  turnstiles.set(panel, handle);
}

function setFieldError(form: HTMLFormElement, field: string, msg: string | null) {
  const err = form.querySelector<HTMLElement>(`[data-err="${field}"]`);
  const input = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${field}"]`);
  if (!err || !input) return;
  if (msg) {
    err.textContent = msg;
    err.classList.remove('hidden');
    input.setAttribute('aria-invalid', 'true');
    input.classList.add('border-danger');
  } else {
    err.classList.add('hidden');
    input.removeAttribute('aria-invalid');
    input.classList.remove('border-danger');
  }
}

function validate(form: HTMLFormElement, items: RfqEntry[]): boolean {
  const v = (name: string) =>
    (form.querySelector(`[name="${name}"]`) as HTMLInputElement)?.value.trim() ?? '';
  let ok = true;
  const checks: [string, boolean, string][] = [
    ['company', !!v('company'), t('validation.required')],
    ['name', !!v('name'), t('validation.required')],
    ['email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email')), t('validation.email')],
    ['country', /^[A-Za-z]{2}$/.test(v('country')), t('validation.country')],
  ];
  for (const [field, valid, msg] of checks) {
    setFieldError(form, field, valid ? null : msg);
    if (!valid) ok = false;
  }
  const minOne = form.querySelector<HTMLElement>('[data-rfq-min-one]');
  if (items.length < 1) {
    minOne?.classList.remove('hidden');
    ok = false;
  } else minOne?.classList.add('hidden');
  return ok;
}

export async function submitRfq(form: HTMLFormElement): Promise<void> {
  const items = rfqItems.get();
  if (!validate(form, items)) return;
  const submitBtn = form.querySelector<HTMLElement>('[data-submit-label]');
  const errBox = form
    .closest('[data-rfq-panel]')
    ?.querySelector<HTMLElement>('[data-rfq-error]');
  const successBox = form
    .closest('[data-rfq-panel]')
    ?.querySelector<HTMLElement>('[data-rfq-success]');
  errBox?.setAttribute('hidden', '');
  if (submitBtn) submitBtn.textContent = t('rfq.form.submitting');

  // 确保 widget 已挂载（若此前从未进入可见态）
  const panel = form.closest<HTMLElement>('[data-rfq-panel]');
  if (panel) await ensureTurnstile(panel);
  const turnstile = panel ? turnstiles.get(panel) : undefined;

  // token 必须真实存在才提交。未就绪（挑战未完成/网络问题）时给明确提示并保留篮，
  // 绝不把公开 sitekey 当 token 上送（历史 bug）。
  const turnstileToken = turnstile?.getToken();
  if (!turnstileToken) {
    errBox?.removeAttribute('hidden');
    if (submitBtn) submitBtn.textContent = t('rfq.form.submit');
    return;
  }

  const body = {
    turnstileToken,
    honeypot: (form.querySelector('[name="honeypot"]') as HTMLInputElement).value,
    formLoadedAt: Number(form.dataset.loadedAt ?? Date.now()),
    contact: {
      company: (form.querySelector('[name="company"]') as HTMLInputElement).value.trim(),
      name: (form.querySelector('[name="name"]') as HTMLInputElement).value.trim(),
      email: (form.querySelector('[name="email"]') as HTMLInputElement).value.trim(),
      country: (form.querySelector('[name="country"]') as HTMLInputElement).value
        .trim()
        .toUpperCase(),
    },
    shipping: {
      destinationMarket: (form.querySelector('[name="destinationMarket"]') as HTMLSelectElement)
        .value,
      incoterm: (form.querySelector('[name="incoterm"]') as HTMLSelectElement).value,
      quantityScale: (form.querySelector('[name="quantityScale"]') as HTMLSelectElement).value,
    },
    items: items.map((it) => ({ sku: it.sku, qty: it.qty, note: it.note || null })),
    message: (form.querySelector('[name="message"]') as HTMLTextAreaElement).value.trim() || null,
    sourcePage: window.location.pathname,
    locale: 'en',
  };

  try {
    const res = await fetch('/api/v1/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message ?? String(res.status));
    const reference: string = json?.data?.reference ?? '';
    clearRfq();
    form.classList.add('hidden');
    if (successBox) {
      successBox.querySelector<HTMLElement>('[data-rfq-success-body]')!.textContent = t(
        'rfq.success.body',
        { reference },
      );
      successBox.hidden = false;
    }
  } catch {
    // AC-16：保留篮内容 + 替代联系方式；坑 §6.10：重新取 token
    errBox?.removeAttribute('hidden');
    turnstile?.reset();
    if (submitBtn) submitBtn.textContent = t('rfq.form.submit');
  }
}

/* 全局 submit 绑定（抽屉与 /rfq/ 页共用） */
export function bindSubmit() {
  document.addEventListener('submit', (e) => {
    const form = (e.target as HTMLElement).closest('[data-rfq-form]');
    if (form) {
      e.preventDefault();
      void submitRfq(form as HTMLFormElement);
    }
  });
}
