'use client';

import { ROUTES } from '@/lib/constants/auth';
import { TrustHub } from '@/components/shared/trust/TrustHub';

export default function EstateTrustPage() {
  return (
    <TrustHub
      portal="estate"
      purpose="PROPERTY_MANAGER_ONBOARDING"
      verificationDescription="Verify your identity to publish your estate's listings in the market."
      trustHref={ROUTES.ESTATE_TRUST_PROFILE}
    />
  );
}
