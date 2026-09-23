import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { gatemanApi, type Gate, type GatemanEstate } from '@/lib/api/gateman';
import { qk } from '@/lib/query/keys';

/**
 * The estate a guard is working in, and the barrier they are standing at.
 *
 * The console used to resolve "my estate" from `/estate/me`, which returns the
 * oldest estate of the guard's first membership. A guard posted to two estates
 * was therefore locked to one of them with no way to say otherwise — the same
 * shape of dead-end as the portal-priority lockout, and invisible to tsc for the
 * same reason: every value involved is a valid estate.
 *
 * Gate attribution rides on this rather than on a separate control, because the
 * two questions are the same question: which patch of ground is this guard
 * responsible for right now.
 */
export interface GatemanPost {
  /** Every estate this guard can open. */
  estates: GatemanEstate[];
  estate: GatemanEstate | null;
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

interface StoredPost {
  estateId?: string;
  gateId?: string;
}

/**
 * Remembers the guard's post across launches. Without it a guard at a barrier
 * would re-pick their gate every single time the app restarted, and the one time
 * they forgot, an entry would be filed unattributed.
 */
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

  /**
   * Every estate the guard can open. `/estate/mine` rather than `/estate/me`:
   * the singular endpoint answers with one estate and no way to ask for another.
   */
  const estatesQuery = useQuery({
    queryKey: qk.gateman.myEstates,
    queryFn: () => gatemanApi.listMyEstates(),
  });

  // Memoised identity: `?? []` would otherwise allocate a new array every render
  // and make every memo downstream of it recompute, and every effect re-run.
  const estates = useMemo(() => estatesQuery.data ?? [], [estatesQuery.data]);

  const estate = useMemo(() => {
    if (estates.length === 0) return null;
    // Keep the remembered estate while it is still in the list; otherwise fall
    // back to the first, which is what the console used to show unconditionally.
    return estates.find((e) => e.id === estateId) ?? estates[0];
  }, [estates, estateId]);

  const gatesQuery = useQuery({
    queryKey: qk.gateman.gates(estate?.id ?? ''),
    queryFn: () => gatemanApi.listGates(estate!.id),
    enabled: !!estate,
  });

  const gates = useMemo(() => gatesQuery.data ?? [], [gatesQuery.data]);

  /**
   * The chosen gate, which is NOT simply the first one.
   *
   * Defaulting to the first gate would attach a confident, wrong gate to every
   * entry a guard made until they noticed — and a wrong gate in an audit trail
   * is worse than a missing one, because it names a barrier nobody stood at.
   * So the only gate auto-selected is a lone gate, where there is nothing to get
   * wrong. Anything else waits for the guard to say where they are.
   */
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

  const value = useMemo<GatemanPost>(
    () => ({
      estates,
      estate,
      gates,
      gate,
      needsGateChoice: gates.length > 1 && !gate,
      selectEstate,
      selectGate,
      isLoading: !restored || estatesQuery.isLoading || (!!estate && gatesQuery.isLoading),
    }),
    [
      estates,
      estate,
      gates,
      gate,
      selectEstate,
      selectGate,
      restored,
      estatesQuery.isLoading,
      gatesQuery.isLoading,
    ]
  );

  return <GatemanPostContext.Provider value={value}>{children}</GatemanPostContext.Provider>;
}
