'use client';

import { getStoredUser } from '@/lib/authStorage';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function AgentVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="AGENT_ONBOARDING"
      description="Verify your identity to manage clients and run verification visits."
    />
  );
}
