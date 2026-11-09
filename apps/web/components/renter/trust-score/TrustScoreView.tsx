'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TrustOverviewView } from '@/components/shared/trust/TrustOverviewView';
import { TrustScoreHistory } from '@/components/renter/trust-score/TrustScoreHistory';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { TrustRequirementKey } from '@/types/trust-score';

interface TrustScoreViewProps {
  /** Opens the in-page Verification tab. */
  onVerify: () => void;
}

/**
 * The renter's trust page: the shared overview, plus the renter's real score
 * changes (each one recorded with its reason) inside the details.
 */
export const TrustScoreView = ({ onVerify }: TrustScoreViewProps) => {
  const router = useRouter();
  const history = useQuery({
    queryKey: renterKeys.trustScore,
    queryFn: () => unwrap(renterService.getTrustScore()),
    select: (d) => d.history,
  });

  const onAction = (key: TrustRequirementKey) => {
    if (key === 'EMAIL') {
      router.push('/renter/settings?tab=account');
      return;
    }
    onVerify();
  };

  return (
    <TrustOverviewView
      portal="renter"
      onAction={onAction}
      moreDetails={history.data?.length ? <TrustScoreHistory history={history.data} /> : null}
    />
  );
};
