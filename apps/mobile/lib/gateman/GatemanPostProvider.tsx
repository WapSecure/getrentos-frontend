import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { gatemanApi, type Gate, type GatemanEstate } from '@/lib/api/gateman';
import { qk } from '@/lib/query/keys';

export interface GatemanPost {
  estates: GatemanEstate[];
  estate: GatemanEstate | null;
  gates: Gate[];
  gate: Gate | null;
  needsGateChoice: boolean;
  selectEstate: (estateId: string) => void;
  selectGate: (gateId: string) => void;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
  isRefetching: boolean;
}

const GatemanPostContext = createContext<GatemanPost | null>(null);

export function useGatemanPost(): GatemanPost {
  const ctx = useContext(GatemanPostContext);
  if (!ctx) throw new Error('useGatemanPost must be used within a <GatemanPostProvider>');
  return ctx;
}

const KEY = 'sureground.gateman.post';

interface StoredPost {
  estateId?: string;
  gateId?: string;
}

// Without it a guard re-picks the gate every launch, and a forgotten pick files an entry unattributed.
async function readStored(): Promise<StoredPost> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredPost) : {};
  } catch {
    return {};
  }
}

async function writeStored(next: StoredPost): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Losing the preference costs one tap; never fail the console over it.
  }
}

export function GatemanPostProvider({ children }: { children: ReactNode }) {
  const [estateId, setEstateId] = useState<string | null>(null);
  const [gateId, setGateId] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void readStored().then((stored) => {
      if (cancelled) return;
      setEstateId(stored.estateId ?? null);
      setGateId(stored.gateId ?? null);
      setRestored(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // `/estate/mine`, not `/estate/me`: the singular endpoint returns one estate with no way to ask for another.
  const estatesQuery = useQuery({
    queryKey: qk.gateman.myEstates,
    queryFn: () => gatemanApi.listMyEstates(),
  });

  // Memoised: `?? []` would allocate a new array every render and re-run every memo and effect downstream.
  const estates = useMemo(() => estatesQuery.data ?? [], [estatesQuery.data]);

  const estate = useMemo(() => {
    if (estates.length === 0) return null;
    return estates.find((e) => e.id === estateId) ?? estates[0];
  }, [estates, estateId]);

  const gatesQuery = useQuery({
    queryKey: qk.gateman.gates(estate?.id ?? ''),
    queryFn: () => gatemanApi.listGates(estate!.id),
    enabled: !!estate,
  });

  const gates = useMemo(() => gatesQuery.data ?? [], [gatesQuery.data]);

  // Only a lone gate is auto-selected: a wrong gate in an audit trail is worse than a missing one.
  const gate = useMemo(() => {
    if (gates.length === 0) return null;
    const remembered = gates.find((g) => g.id === gateId);
    if (remembered) return remembered;
    return gates.length === 1 ? gates[0] : null;
  }, [gates, gateId]);

  const selectEstate = useCallback((nextId: string) => {
    setEstateId(nextId);
    // The gate belongs to the estate being left, so it cannot carry over.
    setGateId(null);
    void writeStored({ estateId: nextId });
  }, []);

  const selectGate = useCallback(
    (nextId: string) => {
      setGateId(nextId);
      void writeStored({ estateId: estate?.id, gateId: nextId });
    },
    [estate?.id]
  );

  const estatesLoading = estatesQuery.isLoading;
  const estatesError = estatesQuery.isError;
  const estatesRefetching = estatesQuery.isRefetching;
  const refetchEstates = estatesQuery.refetch;
  const gatesLoading = gatesQuery.isLoading;
  const gatesRefetching = gatesQuery.isRefetching;
  const refetchGates = gatesQuery.refetch;

  const value = useMemo<GatemanPost>(
    () => ({
      estates,
      estate,
      gates,
      gate,
      needsGateChoice: gates.length > 1 && !gate,
      selectEstate,
      selectGate,
      isLoading: !restored || estatesLoading || (!!estate && gatesLoading),
      // Gate errors aren't fatal: a guard can still work without a gate, and blocking them at the barrier is worse.
      isError: estatesError,
      refetch: () => {
        void refetchEstates();
        void refetchGates();
      },
      isRefetching: estatesRefetching || gatesRefetching,
    }),
    [
      estates,
      estate,
      gates,
      gate,
      selectEstate,
      selectGate,
      restored,
      estatesLoading,
      estatesError,
      estatesRefetching,
      refetchEstates,
      gatesLoading,
      gatesRefetching,
      refetchGates,
    ]
  );

  return <GatemanPostContext.Provider value={value}>{children}</GatemanPostContext.Provider>;
}
