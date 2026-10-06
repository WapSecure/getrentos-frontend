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

/**
 * Which client the manager is acting for.
 *
 * A manager and an owner are not the same kind of actor, and the difference that
 * matters on every screen is *whose* asset is on it. This holds that answer for
 * the whole agency shell, so no page has to ask again and no page can quietly
 * assume.
 *
 * Two rules are the reason this is a context rather than a prop:
 *
 * **The selection survives navigation but not reality.** It is restored from
 * `localStorage` so switching tabs does not lose the client, and it is CLEARED
 * when the mandate it named is no longer one the manager holds. A stale selection
 * is precisely the failure the custody bar exists to prevent — a manager working
 * on a property they were removed from yesterday, with the screen still saying
 * "Managing for Emeka Chukwu" because nobody checked.
 *
 * **Nothing is selected by default when the choice is real.** With one mandate it
 * selects it, because there is no decision to make. With several it deliberately
 * selects none, so the first act is choosing rather than discovering halfway
 * through an edit which client the form was about.
 */

const STORAGE_KEY = 'getrentos:agency:client';

interface CustodyValue {
  /** Every mandate the caller manages, including ones not yet live. */
  mandates: ManagementMandateDto[];
  /** Only the ones a manager may act under right now. */
  live: ManagementMandateDto[];
  selected: ManagementMandateDto | null;
  /** The mandate the caller is acting under, by id. Null clears it. */
  select: (mandateId: string | null) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const CustodyContext = createContext<CustodyValue | null>(null);

/**
 * The stored client, read as an external store.
 *
 * The choice lives in localStorage, which is outside React, so `useState` plus
 * an effect to load it is the wrong shape: it copies external state into React
 * state and then has to keep the two in step. `useSyncExternalStore` reads it
 * during render instead, and `getServerSnapshot` is what stops the server (which
 * has no localStorage) and the first client pass disagreeing about the markup.
 */
const listeners = new Set<() => void>();

function subscribeToStore(onChange: () => void) {
  listeners.add(onChange);
  // Another tab changing client should move this one too.
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
  // False on the server and on the hydration pass, true after. Reading the
  // stored client before then would either mismatch the server's markup or make
  // the bar say "no client" for a frame, which is the one message it exists to
  // reserve for a real absence.
  const hydrated = useSyncExternalStore(subscribeToNothing, alwaysTrue, alwaysFalse);

  // A stored client the manager no longer holds is not a client. This is
  // DERIVED rather than "cleared" in an effect, so the stale id cannot be acted
  // on even by the render that discovers it.
  const heldId = chosenId && mandates.some((mandate) => mandate.id === chosenId) ? chosenId : null;

  // One live engagement is not a decision, so it is adopted. Several are, so
  // nothing is chosen until the manager says which — the alternative is a form
  // that edits the wrong client's property until somebody notices. An explicitly
  // chosen client is honoured even when the engagement is not live, because the
  // bar should be able to say *why* it is not.
  const soleLiveId = live.length === 1 ? live[0].id : null;
  const activeId = heldId ?? soleLiveId;

  const selected = useMemo(
    () => mandates.find((mandate) => mandate.id === activeId) ?? null,
    [mandates, activeId]
  );

  // Storage is not React state, so this is a write and not a cascade. Dropping
  // the id matters: left in place, a manager later re-added to that engagement
  // would silently resume acting for them without ever choosing to.
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
    error: error ? (error as Error).message : null,
    reload: () => void refetch(),
  };

  return <CustodyContext.Provider value={value}>{children}</CustodyContext.Provider>;
}

/**
 * The client the manager is acting for.
 *
 * Throws outside the provider rather than returning a permissive default: a
 * screen that reads "no client" as "the whole portfolio" is the bug this exists
 * to stop, and it would fail silently.
 */
export function useCustody(): CustodyValue {
  const value = useContext(CustodyContext);
  if (!value) {
    throw new Error('useCustody must be used inside an agency layout');
  }
  return value;
}
