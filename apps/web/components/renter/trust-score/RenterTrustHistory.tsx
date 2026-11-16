'use client';

import { useQuery } from '@tanstack/react-query';
import { TrustScoreHistory } from '@/components/renter/trust-score/TrustScoreHistory';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

export function RenterTrustHistory() {
  const history = useQuery({
    queryKey: renterKeys.trustScore,
    queryFn: () => unwrap(renterService.getTrustScore()),
    select: (d) => d.history,
  });

  return history.data?.length ? <TrustScoreHistory history={history.data} /> : null;
}
