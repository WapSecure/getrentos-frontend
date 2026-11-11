'use client';

import { ROUTES } from '@/lib/constants/auth';
import { TrustHub } from '@/components/shared/trust/TrustHub';
import { useForeignIdentityTabs } from '@/components/diaspora/ForeignIdentityPanel';
import { TrustProfileDetails } from '@/components/shared/trust/TrustProfileDetails';
import { buyerService } from '@/services/buyerService';
import { buyerKeys } from '@/lib/queryKeys';

export default function BuyerTrustPage() {
  // Diaspora investors only: passport and documents from abroad.
  const extraTabs = useForeignIdentityTabs();
  return (
    <TrustHub
      extraTabs={extraTabs}
      portal="buyer"
      purpose="RENTER_ONBOARDING"
      verificationDescription="Verify your identity to make offers, sign documents and transact safely."
      trustHref={ROUTES.BUYER_TRUST_PROFILE}
      moreDetails={
        <TrustProfileDetails
          audience="owners and realtors"
          queryKey={buyerKeys.trustProfile}
          queryFn={() => buyerService.getTrustProfile()}
        />
      }
    />
  );
}
