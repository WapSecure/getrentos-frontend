'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { buyerService } from '@/services/buyerService';
import { buyerKeys } from '@/lib/queryKeys';

export default function BuyerTrustProfilePage() {
  return (
    <TrustProfileView
      queryKey={buyerKeys.trustProfile}
      queryFn={() => buyerService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="What owners and realtors see about your credibility on GetRentos"
    />
  );
}
