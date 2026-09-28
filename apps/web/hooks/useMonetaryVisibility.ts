'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/apiClient';

type AccountPreferences = { hideMonetaryValues?: boolean; [key: string]: unknown };
const KEY = ['account', 'preferences'] as const;

export function useMonetaryVisibility() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: KEY,
    queryFn: () => authFetch<AccountPreferences>('/users/me/preferences'),
  });
  const visible = query.data?.hideMonetaryValues !== true;
  const mutation = useMutation({
    mutationFn: (nextVisible: boolean) =>
      authFetch<AccountPreferences>('/users/me/preferences', {
        method: 'PUT',
        body: JSON.stringify({ hideMonetaryValues: !nextVisible }),
      }),
    onMutate: async (nextVisible) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<AccountPreferences>(KEY);
      queryClient.setQueryData(KEY, { ...(previous ?? {}), hideMonetaryValues: !nextVisible });
      return { previous };
    },
    onError: (_error, _next, context) => queryClient.setQueryData(KEY, context?.previous),
    onSuccess: (saved) => queryClient.setQueryData(KEY, saved),
  });
  return { visible, toggle: () => mutation.mutate(!visible), saving: mutation.isPending };
}
