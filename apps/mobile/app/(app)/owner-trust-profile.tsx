import { ownerApi } from '@/lib/api/owner';
import { qk } from '@/lib/query/keys';
import { TrustProfileView } from '@/components/trust/TrustProfileView';

export default function OwnerTrustProfile() {
  return (
    <TrustProfileView
      queryKey={qk.owner.trustProfile}
      queryFn={ownerApi.trustProfile}
      eyebrow="Seller reputation"
      subtitle="What buyers and realtors see about your credibility"
      peers="seller"
    />
  );
}
