'use client';

import { ROUTES } from '@/lib/constants/auth';
import { TrustHub } from '@/components/shared/trust/TrustHub';

export default function LandlordTrustPage() {
  return (
    <TrustHub
      portal="landlord"
      purpose="LANDLORD_ONBOARDING"
      verificationDescription="Verify your identity to list properties, sign leases and receive verified payouts."
      trustHref={ROUTES.LANDLORD_TRUST_PROFILE}
    />
  );
}
