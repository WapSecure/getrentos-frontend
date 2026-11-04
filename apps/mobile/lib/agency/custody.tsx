import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { agencyApi, isLive, resolveSelection, type Mandate } from '@/lib/api/agency';
import { ApiError } from '@/lib/api/client';
import { readSelectedClient, writeSelectedClient } from './selectedClient';

/**
 * Which client the manager is acting for, shared by every agency screen so no
 * two can disagree. The choice is kept per device and dropped as soon as the
 * mandate it named is no longer one the manager holds: a stale selection is
 * exactly the mistake this exists to prevent.
 */
interface Custody {
  mandates: Mandate[];
  live: Mandate[];
  selected: Mandate | null;
  select: (mandateId: string | null) => void;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

const CustodyContext = createContext<Custody | null>(null);

export function CustodyProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  /** Off outside the agency workspace, so no one else fetches mandates. */
  enabled?: boolean;
}) {
  const [stored, setStored] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const query = useQuery({
    queryKey: qk.agency.managing,
    queryFn: agencyApi.managing,
    enabled,
  });

  useEffect(() => {
    readSelectedClient()
      .then((v) => setStored(v))
      .finally(() => setRestored(true));
  }, []);

  const select = useCallback((id: string | null) => {
    setStored(id);
    void writeSelectedClient(id);
  }, []);

  const value = useMemo<Custody>(() => {
    const mandates = query.data ?? [];
    const id = query.data && restored ? resolveSelection(stored, mandates) : null;
    return {
      mandates,
      live: mandates.filter((m) => isLive(m)),
      selected: mandates.find((m) => m.id === id) ?? null,
      select,
      loading: (enabled && query.isLoading) || !restored,
      error: query.error
        ? query.error instanceof ApiError
          ? query.error.message
          : 'Could not load your clients.'
        : null,
      reload: () => void query.refetch(),
    };
  }, [query, restored, stored, select, enabled]);

  return <CustodyContext.Provider value={value}>{children}</CustodyContext.Provider>;
}

export function useCustody(): Custody {
  const v = useContext(CustodyContext);
  if (!v) throw new Error('useCustody must be used inside CustodyProvider');
  return v;
}
