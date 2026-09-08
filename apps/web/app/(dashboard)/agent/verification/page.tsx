'use client';

import { getStoredUser } from '@/lib/authStorage';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function AgentVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="AGENT_ONBOARDING"
      description="Verify your identity to manage clients and run verification visits."
      documentsHref={ROUTES.AGENT_DOCUMENTS}
      trustScoreHref={ROUTES.AGENT_TRUST_PROFILE}
    />
  );
}
