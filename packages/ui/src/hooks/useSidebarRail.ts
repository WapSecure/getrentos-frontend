'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

// An external store, not setState in an effect: the React Compiler lint forbids the latter.
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

  // Cleared when the sidebar unmounts (sign-out, public pages) so nothing else is offset.
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
