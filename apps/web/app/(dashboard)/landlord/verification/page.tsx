'use client';

import { getStoredUser } from '@/lib/authStorage';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function LandlordVerificationPage() {
  const subjectId = getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="LANDLORD_ONBOARDING"
      description="Verify your identity to list properties, sign leases and receive verified payouts."
    />
  );
}
