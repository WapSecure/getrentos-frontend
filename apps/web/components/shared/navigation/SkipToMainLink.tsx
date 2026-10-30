'use client';

import type { MouseEvent } from 'react';

/**
 * WCAG 2.4.1: the first focusable element on every signed-in page, so keyboard
 * users can jump past the top bar and sidebar. Each portal layout renders one
 * <main>; it is focused directly rather than through a fragment id, so layouts
 * do not each have to remember the same id.
 */
export function SkipToMainLink() {
  const skip = (event: MouseEvent<HTMLAnchorElement>) => {
    const main = document.querySelector('main');
    if (!main) return;
    event.preventDefault();
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
    main.focus();
    main.scrollIntoView({ block: 'start' });
  };

  return (
    <a
      href="#main-content"
      onClick={skip}
      className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  );
}
