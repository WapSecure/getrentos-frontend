import { useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query/keys';
import { shortletsApi } from '@/lib/api/shortlets';

/**
 * Every stay the guest has booked. One list feeds both My stays and the stay
 * screen (the API has no single-booking route for guests), newest first.
 */
export function useMyStays() {
  return useQuery({
    queryKey: qk.shortlets.myStays,
    queryFn: () => shortletsApi.myBookings(1, 100),
    select: (page) => page.items,
  });
}
