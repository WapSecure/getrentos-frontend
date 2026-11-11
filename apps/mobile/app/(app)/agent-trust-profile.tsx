import { agentTrustProfileApi } from '@/lib/api/agentTrustProfile';
import { qk } from '@/lib/query/keys';
import { TrustScreen } from '@/components/trust/TrustScreen';

export default function AgentTrustProfile() {
  return (
    <TrustScreen
      portal="agent"
      eyebrow="Professional reputation"
      profile={{
        audience: 'clients and admins',
        queryKey: qk.agent.trustProfile,
        queryFn: agentTrustProfileApi.get,
      }}
    />
  );
}
