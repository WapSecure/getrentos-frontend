'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';

export default function RealtorTrustProfilePage() {
  return (
    <TrustProfileView
      queryKey={realtorKeys.trustProfile}
      queryFn={() => realtorService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="What clients and leads see about your credibility on GetRentos"
    />
  );
}
