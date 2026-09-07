'use client';

import { getStoredUser } from '@/lib/authStorage';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function OwnerVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="PROPERTY_OWNER_ONBOARDING"
      description="Verify your identity and ownership to sell property and unlock escrow protections."
    />
  );
}
