import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { shortletsApi } from '@/lib/api/shortlets';

// The API has no single-booking route for guests, so one list feeds both My stays and the stay screen.
export function useMyStays() {
  return useQuery({
    queryKey: qk.shortlets.myStays,
    queryFn: () => shortletsApi.myBookings(1, 100),
    select: (page) => page.items,
  });
}
