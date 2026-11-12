import { useQuery } from '@tanstack/react-query';
import { investorApi } from '@/lib/api/investor';
import { qk } from '@/lib/query/keys';

/** The checks abroad. A passport result arrives by webhook, so look again while one is being checked. */
export function useForeignIdentityStatus(enabled = true) {
  return useQuery({
    queryKey: qk.investor.identity,
    queryFn: investorApi.identityAbroad,
    enabled,
    retry: false,
    refetchInterval: (q) => (q.state.data?.passport.state === 'CHECKING' ? 15_000 : false),
  });
}
