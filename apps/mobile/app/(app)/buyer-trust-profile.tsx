import { buyerTrustProfileApi } from '@/lib/api/buyerTrustProfile';
import { qk } from '@/lib/query/keys';
import { TrustScreen } from '@/components/trust/TrustScreen';

export default function BuyerTrustProfile() {
  return (
    <TrustScreen
      portal="buyer"
      eyebrow="Buyer reputation"
      profile={{
        audience: 'owners and realtors',
        queryKey: qk.buyer.trustProfile,
        queryFn: buyerTrustProfileApi.get,
      }}
    />
  );
}
