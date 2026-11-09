'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { ownerService } from '@/services/ownerService';
import { ownerKeys } from '@/lib/queryKeys';

export default function OwnerTrustProfilePage() {
  return (
    <TrustProfileView
      portal="owner"
      audience="buyers and realtors"
      queryKey={ownerKeys.trustProfile}
      queryFn={() => ownerService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="Your identity, what you need here, and your trust score."
    />
  );
}
