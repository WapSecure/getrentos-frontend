'use client';

import { useSyncExternalStore } from 'react';
import type { Property } from '@/types/renter';

export const RENTER_COMPARE_MAX = 4;
const KEY = 'sureground.renter.compare';
const EMPTY: Property[] = [];

let cache: Property[] | null = null;
const listeners = new Set<() => void>();

const read = (): Property[] => {
  if (cache) return cache;
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(KEY) ?? '[]');
    cache = Array.isArray(parsed) ? (parsed as Property[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
};

const write = (next: Property[]) => {
  cache = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode or a full store: the list lasts for this page only.
  }
  listeners.forEach((l) => l());
};

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
};

// Session-scoped so the property page and Discover share one comparison list.
export function useRenterCompare() {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    list,
    has: (id: string) => list.some((p) => p.id === id),
    /** Adds the property; returns false when the list is already full. */
    add: (property: Property): boolean => {
      const current = read();
      if (current.some((p) => p.id === property.id)) return true;
      if (current.length >= RENTER_COMPARE_MAX) return false;
      write([...current, property]);
      return true;
    },
    remove: (id: string) => write(read().filter((p) => p.id !== id)),
  };
}
