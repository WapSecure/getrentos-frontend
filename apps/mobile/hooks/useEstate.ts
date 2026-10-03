import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { estateManagerApi, pickEstate } from '@/lib/api/estateManager';
import { qk } from '@/lib/query/keys';

const KEY = 'estate-manager.selected-estate';

/**
 * The estate the manager is working in. Most run one; someone who runs several
 * keeps their choice across launches, and falls back to the first if the chosen
 * one is no longer theirs.
 */
export function useEstate() {
  const qc = useQueryClient();
  const estates = useQuery({
    queryKey: qk.estateManager.estates,
    queryFn: estateManagerApi.listMine,
  });
  const stored = useQuery({
    queryKey: qk.estateManager.selected,
    queryFn: () => AsyncStorage.getItem(KEY).catch(() => null),
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const estate = stored.isPending ? undefined : pickEstate(estates.data, stored.data);

  const select = (id: string) => {
    qc.setQueryData(qk.estateManager.selected, id);
    void AsyncStorage.setItem(KEY, id).catch(() => undefined);
  };

  return {
    estate,
    estateId: estate?.id ?? '',
    estates: estates.data ?? [],
    select,
    isPending: estates.isPending || stored.isPending,
    isError: estates.isError && !estates.data,
    refetch: estates.refetch,
    isRefetching: estates.isRefetching,
  };
}
