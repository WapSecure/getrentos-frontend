'use client';

import { getStoredUser } from '@/lib/authStorage';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function EstateVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="PROPERTY_MANAGER_ONBOARDING"
      description="Verify your identity to publish your estate's listings in the market."
    />
  );
}
