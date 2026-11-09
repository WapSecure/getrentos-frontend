'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Whether the desktop sidebar is folded to an icon rail, remembered in this
 * browser and shared by every workspace (a person who wants more room wants it
 * everywhere). The page offset follows through `--workspace-sidebar-width`,
 * set from `data-sidebar` on <html>, so layouts only need `.workspace-main`.
 *
 * Browser state goes through an external store, not setState in an effect:
 * the React Compiler lint forbids the latter.
 */
const KEY = 'sureground.sidebar.rail';
const listeners = new Set<() => void>();
let cached: boolean | undefined;

const read = (): boolean => {
  if (cached !== undefined) return cached;
  try {
    cached = window.localStorage.getItem(KEY) === '1';
  } catch {
    cached = false;
  }
  return cached;
};

const write = (rail: boolean) => {
  cached = rail;
  try {
    window.localStorage.setItem(KEY, rail ? '1' : '0');
  } catch {
    // Private mode or a full store: the choice lasts for this page only.
  }
  listeners.forEach((l) => l());
};

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      cached = undefined;
      onChange();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
};

export function useSidebarRail() {
  const rail = useSyncExternalStore(subscribe, read, () => false);

  // Tell the page shell how wide the sidebar is; cleared when the sidebar
  // leaves (sign-out, public pages) so nothing else is offset.
  useEffect(() => {
    const root = document.documentElement;
    if (rail) root.dataset.sidebar = 'rail';
    else delete root.dataset.sidebar;
    return () => {
      delete root.dataset.sidebar;
    };
  }, [rail]);

  const setRail = useCallback((next: boolean) => write(next), []);
  return { rail, setRail };
}
