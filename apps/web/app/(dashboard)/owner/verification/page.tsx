'use client';

import { getStoredUser } from '@/lib/authStorage';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function OwnerVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="PROPERTY_OWNER_ONBOARDING"
      description="Verify your identity and ownership to sell property and unlock escrow protections."
      documentsHref={ROUTES.OWNER_DOCUMENTS}
      trustScoreHref={ROUTES.OWNER_TRUST_PROFILE}
    />
  );
}
