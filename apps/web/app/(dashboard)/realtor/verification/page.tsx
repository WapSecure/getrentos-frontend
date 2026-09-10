'use client';

import { getStoredUser } from '@/lib/authStorage';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function RealtorVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="AGENT_ONBOARDING"
      description="Verify your identity to list and manage properties on behalf of clients."
      documentsHref={ROUTES.REALTOR_DOCUMENTS}
      trustScoreHref={ROUTES.REALTOR_TRUST_PROFILE}
    />
  );
}
