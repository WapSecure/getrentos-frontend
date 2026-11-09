'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { buyerService } from '@/services/buyerService';
import { buyerKeys } from '@/lib/queryKeys';

export default function BuyerTrustProfilePage() {
  return (
    <TrustProfileView
      portal="buyer"
      audience="owners and realtors"
      queryKey={buyerKeys.trustProfile}
      queryFn={() => buyerService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="Your identity, what you need here, and your trust score."
    />
  );
}
