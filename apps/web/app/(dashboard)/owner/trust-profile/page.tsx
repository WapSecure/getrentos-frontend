'use client';

import { ROUTES } from '@/lib/constants/auth';
import { TrustHub } from '@/components/shared/trust/TrustHub';
import { TrustProfileDetails } from '@/components/shared/trust/TrustProfileDetails';
import { ownerService } from '@/services/ownerService';
import { ownerKeys } from '@/lib/queryKeys';

export default function OwnerTrustPage() {
  return (
    <TrustHub
      portal="owner"
      purpose="PROPERTY_OWNER_ONBOARDING"
      verificationDescription="Verify your identity and ownership to sell property and unlock Sureground Payment Protection."
      trustHref={ROUTES.OWNER_TRUST_PROFILE}
      moreDetails={
        <TrustProfileDetails
          audience="buyers and realtors"
          queryKey={ownerKeys.trustProfile}
          queryFn={() => ownerService.getTrustProfile()}
        />
      }
    />
  );
}
