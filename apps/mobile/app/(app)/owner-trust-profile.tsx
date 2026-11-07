import { ownerApi } from '@/lib/api/owner';
import { qk } from '@/lib/query/keys';
import { TrustProfileView } from '@/components/trust/TrustProfileView';

export default function OwnerTrustProfile() {
  return (
    <TrustProfileView
      portal="owner"
      audience="buyers and realtors"
      queryKey={qk.owner.trustProfile}
      queryFn={ownerApi.trustProfile}
      eyebrow="Seller reputation"
    />
  );
}
