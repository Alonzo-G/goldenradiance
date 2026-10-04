// src/components/rfq/drawer.ts — RFQ 抽屉开合（focus trap + Esc + 焦点归还）
let lastTrigger: HTMLElement | null = null;

export function openDrawer() {
  lastTrigger = document.activeElement as HTMLElement;
  const overlay = document.querySelector<HTMLElement>('[data-rfq-overlay]');
  const drawer = document.querySelector<HTMLElement>('[data-rfq-drawer]');
  if (!overlay || !drawer) return;
  overlay.hidden = false;
  drawer.hidden = false;
  const focusable = drawer.querySelector<HTMLElement>('button, a, input, select, textarea');
  focusable?.focus();
}

export function closeDrawer() {
  document.querySelectorAll<HTMLElement>('[data-rfq-overlay],[data-rfq-drawer]').forEach((el) => {
    el.hidden = true;
  });
  lastTrigger?.focus();
  lastTrigger = null;
}

export function bindDrawerEvents() {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-rfq-open]')) openDrawer();
    if (target.closest('[data-rfq-close]') || target.closest('[data-rfq-overlay]')) closeDrawer();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
    // focus trap：Tab 在抽屉内循环
    if (e.key === 'Tab') {
      const drawer = document.querySelector<HTMLElement>('[data-rfq-drawer]:not([hidden])');
      if (!drawer) return;
      const nodes = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((n) => !n.hasAttribute('disabled'));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
}
