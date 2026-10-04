// src/components/rfq/submit.ts — 表单校验与提交（对齐 api-spec CreateRfqRequest）
// 坑 §6.10：Turnstile token 单次有效，提交失败必须 reset；AC-16：失败保留篮内容。
import { rfqItems, clearRfq, type RfqEntry } from '../../stores/rfq';
import { renderTurnstile, type TurnstileHandle } from '../../lib/shared/turnstile';
import { t } from '../../i18n';

let turnstile: TurnstileHandle | null = null;

async function initTurnstile() {
  if (turnstile) return;
  const slot = document.querySelector<HTMLElement>('[data-rfq-panel] [data-turnstile-slot]');
  if (!slot) return;
  turnstile = await renderTurnstile(slot);
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
  await initTurnstile();

  // QA advisory-2（AC-16 路径）：token 未就绪时禁止上送伪 token（原 fallback 会把
  // 公开 sitekey 当 token 送 siteverify）。走与提交失败相同错误路径：保留篮 + 提示重试
  const turnstileToken = turnstile?.getToken();
  if (!turnstileToken) {
    errBox?.removeAttribute('hidden');
    turnstile?.reset();
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
