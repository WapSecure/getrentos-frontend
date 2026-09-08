'use client';

import { useRenterUser } from '../layout';
import { getStoredUser } from '@/lib/authStorage';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';

export default function RenterVerificationPage() {
  const user = useRenterUser();
  // The renter layout populates the user from storage; fall back to raw storage
  // so the PERSON subject id is always available for the trust API.
  const subjectId = user?.id ?? getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <VerificationCenter
      subjectId={subjectId}
      purpose="RENTER_ONBOARDING"
      description="Verify your identity to submit rental applications, sign leases and access higher trust limits."
      documentsHref="/renter/settings?tab=verification"
      trustScoreHref={ROUTES.RENTER_TRUST_SCORE}
    />
  );
}
