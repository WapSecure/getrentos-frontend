import { useQuery } from '@tanstack/react-query';
import { investorApi } from '@/lib/api/investor';
import { qk } from '@/lib/query/keys';

// Off unless the API says it is on: a failed call hides Diaspora Invest rather than offering a workspace the API would refuse.
export function useDiasporaAvailability(): { enabled: boolean; isLoading: boolean } {
  const query = useQuery({
    queryKey: qk.investor.availability,
    queryFn: investorApi.availability,
    staleTime: 5 * 60_000,
    retry: false,
  });
  return { enabled: query.data?.enabled === true, isLoading: query.isLoading };
}
