import { realtorApi } from '@/lib/api/realtor';
import { qk } from '@/lib/query/keys';
import { TrustScreen } from '@/components/trust/TrustScreen';

export default function RealtorTrustProfile() {
  return (
    <TrustScreen
      portal="realtor"
      eyebrow="Professional reputation"
      profile={{
        audience: 'clients and leads',
        queryKey: qk.realtor.trustProfile,
        queryFn: realtorApi.trustProfile,
      }}
    />
  );
}
