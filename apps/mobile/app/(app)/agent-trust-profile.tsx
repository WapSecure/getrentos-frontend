import { agentTrustProfileApi } from '@/lib/api/agentTrustProfile';
import { qk } from '@/lib/query/keys';
import { TrustProfileView } from '@/components/trust/TrustProfileView';

export default function AgentTrustProfile() {
  return (
    <TrustProfileView
      portal="agent"
      audience="clients and admins"
      queryKey={qk.agent.trustProfile}
      queryFn={agentTrustProfileApi.get}
      eyebrow="Professional reputation"
    />
  );
}
