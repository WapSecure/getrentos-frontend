import { realtorApi } from '@/lib/api/realtor';
import { qk } from '@/lib/query/keys';
import { TrustProfileView } from '@/components/trust/TrustProfileView';

export default function RealtorTrustProfile() {
  return (
    <TrustProfileView
      portal="realtor"
      audience="clients and leads"
      queryKey={qk.realtor.trustProfile}
      queryFn={realtorApi.trustProfile}
      eyebrow="Professional reputation"
    />
  );
}
