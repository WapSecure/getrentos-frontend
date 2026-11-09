'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { realtorService } from '@/services/realtorService';
import { realtorKeys } from '@/lib/queryKeys';

export default function RealtorTrustProfilePage() {
  return (
    <TrustProfileView
      portal="realtor"
      audience="clients and leads"
      queryKey={realtorKeys.trustProfile}
      queryFn={() => realtorService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="Your identity, what you need here, and your trust score."
    />
  );
}
