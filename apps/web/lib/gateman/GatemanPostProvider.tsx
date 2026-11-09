'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import type { Estate, Gate } from '@/types/estate';

// Kept parallel to apps/mobile/lib/gateman/GatemanPostProvider.tsx. The gate is remembered so
// a reload never files an arrival unattributed.
export interface GatemanPost {
  estates: Estate[];
  estate: Estate | null;
  gates: Gate[];
  gate: Gate | null;
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

const KEY = 'sureground.gateman.post';

type StoredPost = {
  estateId?: string;
  gateId?: string;
};

// An external store because localStorage can't be read during render without a hydration
// mismatch, and an effect would flash the wrong estate. Same shape as lib/gateOfflineQueue.ts.
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

// Keeps other tabs in step, or one would attribute arrivals to the barrier the other left.
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

  // `/estate/mine`, not `/estate/me`: the singular endpoint returns one estate with no way to ask for another.
  const estatesQuery = useQuery({
    queryKey: estateKeys.myEstates,
    queryFn: () => unwrap(estateService.listMyEstates()),
  });

  // Stable identity: `?? []` would allocate a new array every render and recompute every memo downstream.
  const estates = useMemo(() => estatesQuery.data ?? [], [estatesQuery.data]);

  const estate = useMemo(() => {
    if (estates.length === 0) return null;
    return estates.find((e) => e.id === estateId) ?? estates[0];
  }, [estates, estateId]);

  const gatesQuery = useQuery({
    queryKey: estateKeys.gates(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.listGates(estate!.id)),
    enabled: !!estate,
  });

  const gates = useMemo(() => gatesQuery.data ?? [], [gatesQuery.data]);

  // Only a lone gate is auto-selected: a wrong gate in the audit trail names a barrier nobody stood at.
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
