import { ownerApi } from '@/lib/api/owner';
import { qk } from '@/lib/query/keys';
import { TrustScreen } from '@/components/trust/TrustScreen';

export default function OwnerTrustProfile() {
  return (
    <TrustScreen
      portal="owner"
      eyebrow="Seller reputation"
      profile={{
        audience: 'buyers and realtors',
        queryKey: qk.owner.trustProfile,
        queryFn: ownerApi.trustProfile,
      }}
    />
  );
}
