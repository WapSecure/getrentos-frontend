'use client';

import { getStoredUser } from '@/lib/authStorage';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function BuyerVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="RENTER_ONBOARDING"
      description="Verify your identity to make offers, sign documents and transact safely."
      documentsHref={ROUTES.BUYER_DOCUMENTS}
      trustScoreHref={ROUTES.BUYER_TRUST_PROFILE}
    />
  );
}
