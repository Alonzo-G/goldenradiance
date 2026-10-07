// src/components/rfq/drawer.ts — RFQ 抽屉开合（focus trap + Esc + 下滑关闭 + 焦点归还）
let lastTrigger: HTMLElement | null = null;

export function openDrawer() {
  lastTrigger = document.activeElement as HTMLElement;
  const overlay = document.querySelector<HTMLElement>('[data-rfq-overlay]');
  const drawer = document.querySelector<HTMLElement>('[data-rfq-drawer]');
  if (!overlay || !drawer) return;
  overlay.hidden = false;
  drawer.hidden = false;
  drawer.style.transform = '';
  const focusable = drawer.querySelector<HTMLElement>('button, a, input, select, textarea');
  focusable?.focus();
}

export function closeDrawer() {
  document.querySelectorAll<HTMLElement>('[data-rfq-overlay],[data-rfq-drawer]').forEach((el) => {
    el.hidden = true;
    el.style.transform = '';
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
  bindSwipeToClose();
}

/** 移动端 bottom sheet 下滑关闭：从拖拽 handle 或抽屉顶部（内容滚动到顶时）下滑超过阈值即关闭。
 *  仅移动端生效——桌面右侧抽屉无 handle，起点判定自然不命中，不干扰内部滚动。 */
function bindSwipeToClose() {
  const drawer = document.querySelector<HTMLElement>('[data-rfq-drawer]');
  if (!drawer) return;
  const body = drawer.querySelector<HTMLElement>('[data-rfq-body]');
  let startY = 0;
  let tracking = false;

  drawer.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
      const inHandle = !!el?.closest('[data-rfq-handle]');
      const scrollTop = body?.scrollTop ?? 0;
      const nearTop = t.clientY - drawer.getBoundingClientRect().top < 96;
      // 仅当起点在 handle，或抽屉顶部且内容已滚到顶时，才接管下滑手势
      tracking = inHandle || (nearTop && scrollTop <= 0);
      startY = t.clientY;
    },
    { passive: true },
  );

  drawer.addEventListener(
    'touchmove',
    (e) => {
      if (!tracking) return;
      const dy = e.touches[0].clientY - startY;
      if (dy > 0) drawer.style.transform = `translateY(${dy}px)`;
    },
    { passive: true },
  );

  drawer.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    const dy = e.changedTouches[0].clientY - startY;
    drawer.style.transform = '';
    if (dy > 100) closeDrawer();
  });
}

