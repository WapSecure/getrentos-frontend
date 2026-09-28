'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { Estate, Gate } from '@/types/estate';

/**
 * The estate a guard is working in, and the barrier they are standing at.
 *
 * The console used to resolve "my estate" from `/estate/me`, which returns the
 * oldest estate of the guard's first membership. A guard posted to two estates
 * was therefore locked to one of them with no way to say otherwise — every value
 * on screen was a valid estate, so nothing failed; the guard simply could not
 * reach the other one.
 *
 * Gate attribution rides on this rather than on a separate control, because the
 * two questions are the same question: which patch of ground is this guard
 * responsible for right now. It is also why the gate is remembered in storage —
 * a guard at a barrier would otherwise re-pick their gate on every reload, and
 * the one time they forgot, an arrival would be filed unattributed.
 *
 * The browser counterpart of `apps/mobile/lib/gateman/GatemanPostProvider.tsx`,
 * kept deliberately parallel so the two consoles behave the same way.
 */
export interface GatemanPost {
  /** Every estate this guard can open. */
  estates: Estate[];
  estate: Estate | null;
  /** Named barriers at the selected estate. */
  gates: Gate[];
  /** The barrier this guard is posted at, when one is known. */
  gate: Gate | null;
  /** True when the estate has gates and none has been chosen yet. */
  needsGateChoice: boolean;
  selectEstate: (estateId: string) => void;
  selectGate: (gateId: string) => void;
  isLoading: boolean;
}

const GatemanPostContext = createContext<GatemanPost | null>(null);

export function useGatemanPost(): GatemanPost {
  const ctx = useContext(GatemanPostContext);
  if (!ctx) throw new Error('useGatemanPost must be used within a <GatemanPostProvider>');
  return ctx;
}

const KEY = 'getrentos.gateman.post';

type StoredPost = {
  estateId?: string;
  gateId?: string;
};

/**
 * The stored post, held as a small external store rather than component state.
 *
 * `localStorage` cannot be read during render (the server has no such thing, so
 * the first client render would disagree with the markup), and copying it into
 * state from an effect costs a second render and a visible flash of the wrong
 * estate. An external store is the shape React is designed to read from during
 * render, and it makes the guard's post shared across the console the same way
 * the offline queue is — this file and `lib/gateOfflineQueue.ts` deliberately
 * work the same way.
 */
const EMPTY_POST: StoredPost = {};

let cache: StoredPost | null = null;
const listeners = new Set<() => void>();

function parseStored(): StoredPost {
  if (typeof localStorage === 'undefined') return EMPTY_POST;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as StoredPost) : EMPTY_POST;
  } catch {
    return EMPTY_POST;
  }
}

/** Cached, because `useSyncExternalStore` compares snapshots by reference. */
function snapshot(): StoredPost {
  if (cache === null) cache = parseStored();
  return cache;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function commit(next: StoredPost) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Losing the preference costs one tap; never fail the console over it.
  }
  for (const listener of listeners) listener();
}

// A guard often has the console open at a desk and on a phone, or simply in two
// tabs. Without this the second one would keep writing to the post the first
// left behind, and its arrivals would be attributed to the wrong barrier.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY) return;
    cache = parseStored();
    for (const listener of listeners) listener();
  });
}

export function GatemanPostProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, snapshot, () => EMPTY_POST);

  const estateId = stored.estateId ?? null;
  const gateId = stored.gateId ?? null;

  /**
   * Every estate the guard can open. `/estate/mine` rather than `/estate/me`:
   * the singular endpoint answers with one estate and no way to ask for another.
   */
  const estatesQuery = useQuery({
    queryKey: estateKeys.myEstates,
    queryFn: () => unwrap(estateService.listMyEstates()),
  });

  // Memoised identity: `?? []` would otherwise allocate a new array every render
  // and make every memo downstream of it recompute.
  const estates = useMemo(() => estatesQuery.data ?? [], [estatesQuery.data]);

  const estate = useMemo(() => {
    if (estates.length === 0) return null;
    // Keep the remembered estate while it is still in the list; otherwise fall
    // back to the first, which is what the console used to show unconditionally.
    return estates.find((e) => e.id === estateId) ?? estates[0];
  }, [estates, estateId]);

  const gatesQuery = useQuery({
    queryKey: estateKeys.gates(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listGates(estate!.id)),
    enabled: !!estate,
  });

  const gates = useMemo(() => gatesQuery.data ?? [], [gatesQuery.data]);

  /**
   * The chosen gate, which is NOT simply the first one.
   *
   * Defaulting to the first gate would attach a confident, wrong gate to every
   * entry a guard made until they noticed — and a wrong gate in an audit trail
   * is worse than a missing one, because it names a barrier nobody stood at. So
   * the only gate auto-selected is a lone gate, where there is nothing to get
   * wrong. Anything else waits for the guard to say where they are.
   */
  const gate = useMemo(() => {
    if (gates.length === 0) return null;
    const remembered = gates.find((g) => g.id === gateId);
    if (remembered) return remembered;
    return gates.length === 1 ? gates[0] : null;
  }, [gates, gateId]);

  const selectEstate = useCallback((nextId: string) => {
    // The gate belongs to the estate being left, so it cannot carry over.
    commit({ estateId: nextId });
  }, []);

  const selectGate = useCallback(
    (nextId: string) => {
      commit({ estateId: estate?.id, gateId: nextId });
    },
    [estate?.id]
  );

  const value = useMemo<GatemanPost>(
    () => ({
      estates,
      estate,
      gates,
      gate,
      needsGateChoice: gates.length > 1 && !gate,
      selectEstate,
      selectGate,
      isLoading: estatesQuery.isLoading || (!!estate && gatesQuery.isLoading),
    }),
    [
      estates,
      estate,
      gates,
      gate,
      selectEstate,
      selectGate,
      estatesQuery.isLoading,
      gatesQuery.isLoading,
    ]
  );

  return <GatemanPostContext.Provider value={value}>{children}</GatemanPostContext.Provider>;
}
