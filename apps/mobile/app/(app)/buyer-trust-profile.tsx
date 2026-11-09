import { buyerTrustProfileApi } from '@/lib/api/buyerTrustProfile';
import { qk } from '@/lib/query/keys';
import { TrustProfileView } from '@/components/trust/TrustProfileView';

export default function BuyerTrustProfile() {
  return (
    <TrustProfileView
      portal="buyer"
      audience="owners and realtors"
      queryKey={qk.buyer.trustProfile}
      queryFn={buyerTrustProfileApi.get}
      eyebrow="Buyer reputation"
    />
  );
}
