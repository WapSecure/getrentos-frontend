'use client';

import { ROUTES } from '@/lib/constants/auth';
import { TrustHub } from '@/components/shared/trust/TrustHub';
import { TrustProfileDetails } from '@/components/shared/trust/TrustProfileDetails';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';

export default function RealtorTrustPage() {
  return (
    <TrustHub
      portal="realtor"
      purpose="AGENT_ONBOARDING"
      verificationDescription="Verify your identity to list and manage properties on behalf of clients."
      trustHref={ROUTES.REALTOR_TRUST_PROFILE}
      moreDetails={
        <TrustProfileDetails
          audience="clients and leads"
          queryKey={realtorKeys.trustProfile}
          queryFn={() => realtorService.getTrustProfile()}
        />
      }
    />
  );
}
