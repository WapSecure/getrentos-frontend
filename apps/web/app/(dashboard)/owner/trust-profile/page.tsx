'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { ownerService } from '@/services/ownerService';
import { ownerKeys } from '@/lib/queryKeys';

export default function OwnerTrustProfilePage() {
  return (
    <TrustProfileView
      queryKey={ownerKeys.trustProfile}
      queryFn={() => ownerService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="What buyers and realtors see about your credibility on GetRentos"
    />
  );
}
