'use client';

import { useEffect, type ReactNode, type RefObject } from 'react';

/** Hairline between the icon buttons and the account menu. */
export function TopBarDivider({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`h-6 w-px shrink-0 bg-border ${className}`} />;
}

/** The workspace the top bar belongs to, with a small blue dot. */
export function WorkspacePill({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span
      className={`min-w-0 items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-xs ${className}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Wraps the account menu so its avatar picks up the blue halo from the shared styles. */
export function TopBarAccount({ children }: { children: ReactNode }) {
  return <div className="shell-account flex shrink-0 items-center">{children}</div>;
}

/** The "/" key hint inside the search field. Hidden while the field has focus or text. */
export function SearchShortcutHint() {
  return (
    <kbd
      aria-hidden="true"
      className="pointer-events-none absolute right-2.5 top-1/2 hidden h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-md border border-border bg-background px-1.5 font-mono text-2xs font-medium text-muted-foreground lg:inline-flex lg:group-focus-within:hidden lg:group-has-[input:not(:placeholder-shown)]:hidden"
    >
      /
    </kbd>
  );
}

const isEditable = (el: Element | null) =>
  el instanceof HTMLElement &&
  (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

/**
 * Pressing "/" anywhere outside a field focuses the first visible search box inside `scope`.
 * Skipped while a dialog or menu has focus, so it never pulls focus out of an overlay.
 */
export function useSlashToSearch(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const visibleInput = () =>
      Array.from(scope.current?.querySelectorAll('input') ?? []).find(
        (input) => input.getClientRects().length > 0
      );
    scope.current
      ?.querySelectorAll('input')
      .forEach((input) => input.setAttribute('aria-keyshortcuts', '/'));
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.defaultPrevented) return;
      const active = document.activeElement;
      if (isEditable(active)) return;
      if (active?.closest('[role="dialog"], [role="alertdialog"], [role="menu"]')) return;
      const input = visibleInput();
      if (!input) return;
      event.preventDefault();
      input.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [scope]);
}
