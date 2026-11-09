'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { unwrap } from '@/lib/apiHelpers';
import { mandateKeys } from '@/lib/queryKeys';
import * as mandateService from '@/services/mandateService';
import type { ManagementMandateDto } from '@/services/mandateService';
import { describeAgencyError } from './agencyAccess';

// A selection naming a mandate the manager no longer holds is cleared, and with several mandates none is preselected: acting for the wrong client is the failure this prevents.

const STORAGE_KEY = 'sureground:agency:client';

interface CustodyValue {
  mandates: ManagementMandateDto[];
  live: ManagementMandateDto[];
  selected: ManagementMandateDto | null;
  select: (mandateId: string | null) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const CustodyContext = createContext<CustodyValue | null>(null);

// useSyncExternalStore with getServerSnapshot keeps the server (no localStorage) and the first client pass agreeing on markup.
const listeners = new Set<() => void>();

function subscribeToStore(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Nothing to subscribe to; used only to ask whether hydration has happened. */
const subscribeToNothing = () => () => {};
const alwaysTrue = () => true;
const alwaysFalse = () => false;

function readStored(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode, or storage disabled. Losing the selection is not worth
    // breaking the page over.
    return null;
  }
}

function writeStored(value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // As above — a convenience, not a guarantee.
  } finally {
    for (const listener of listeners) listener();
  }
}

export function CustodyProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: mandateKeys.managing,
    queryFn: () => unwrap(mandateService.managing()),
  });

  const mandates = useMemo(() => data ?? [], [data]);
  const live = useMemo(() => mandates.filter(mandateService.isLive), [mandates]);

  const chosenId = useSyncExternalStore(subscribeToStore, readStored, () => null);
  // False until after hydration: reading the stored client earlier would mismatch the server markup or flash "no client".
  const hydrated = useSyncExternalStore(subscribeToNothing, alwaysTrue, alwaysFalse);

  // Derived rather than cleared in an effect, so a stale id can't be acted on even by the render that finds it.
  const heldId = chosenId && mandates.some((mandate) => mandate.id === chosenId) ? chosenId : null;

  // One live engagement is adopted; with several, nothing is chosen until the manager picks. An explicit pick is honoured even when not live, so the bar can say why.
  const soleLiveId = live.length === 1 ? live[0].id : null;
  const activeId = heldId ?? soleLiveId;

  const selected = useMemo(
    () => mandates.find((mandate) => mandate.id === activeId) ?? null,
    [mandates, activeId]
  );

  // Drop the id, or a manager later re-added to that engagement would silently resume acting for them.
  useEffect(() => {
    if (!isLoading && chosenId && !heldId) writeStored(null);
  }, [isLoading, chosenId, heldId]);

  const select = useCallback((mandateId: string | null) => {
    writeStored(mandateId);
  }, []);

  const value: CustodyValue = {
    mandates,
    live,
    selected,
    select,
    loading: isLoading || !hydrated,
    error: error ? describeAgencyError(error) : null,
    reload: () => void refetch(),
  };

  return <CustodyContext.Provider value={value}>{children}</CustodyContext.Provider>;
}

/** Throws outside the provider: a permissive default would read "no client" as the whole portfolio. */
export function useCustody(): CustodyValue {
  const value = useContext(CustodyContext);
  if (!value) {
    throw new Error('useCustody must be used inside an agency layout');
  }
  return value;
}
