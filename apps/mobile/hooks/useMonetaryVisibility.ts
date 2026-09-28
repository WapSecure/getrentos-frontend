import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { preferencesApi, type RenterPreferences } from '@/lib/api/preferences';

const KEY = ['account', 'preferences'] as const;

export function useMonetaryVisibility() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: KEY, queryFn: preferencesApi.get });
  const visible = query.data?.hideMonetaryValues !== true;

  const mutation = useMutation({
    mutationFn: (nextVisible: boolean) =>
      preferencesApi.update({ hideMonetaryValues: !nextVisible }),
    onMutate: async (nextVisible) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<RenterPreferences>(KEY);
      queryClient.setQueryData<RenterPreferences>(KEY, {
        ...(previous ?? {}),
        hideMonetaryValues: !nextVisible,
      });
      return { previous };
    },
    onError: (_error, _nextVisible, context) => {
      queryClient.setQueryData(KEY, context?.previous);
    },
    onSuccess: (saved) => queryClient.setQueryData(KEY, saved),
  });

  return {
    visible,
    toggle: () => mutation.mutate(!visible),
    saving: mutation.isPending,
  };
}
