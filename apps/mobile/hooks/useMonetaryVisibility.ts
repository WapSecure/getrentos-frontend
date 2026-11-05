import { useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi, type RenterPreferences } from '@/lib/api/preferences';
import { useOptimisticMutation } from '@/lib/query/optimistic';

const KEY = ['account', 'preferences'] as const;

export function useMonetaryVisibility() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: preferencesApi.get });
  const visible = query.data?.hideMonetaryValues !== true;

  const mutation = useOptimisticMutation({
    mutationFn: (nextVisible: boolean) =>
      preferencesApi.update({ hideMonetaryValues: !nextVisible }),
    patches: (nextVisible) => [
      {
        queryKey: KEY,
        update: (old) => ({ ...(old as RenterPreferences), hideMonetaryValues: !nextVisible }),
      },
    ],
    onSuccess: (saved) => queryClient.setQueryData(KEY, saved),
  });

  return {
    visible,
    toggle: () => mutation.mutate(!visible),
    saving: mutation.isPending,
  };
}
