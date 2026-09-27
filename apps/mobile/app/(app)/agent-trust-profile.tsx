import { agentTrustProfileApi } from '@/lib/api/agentTrustProfile';
import { qk } from '@/lib/query/keys';
import { TrustProfileView } from '@/components/trust/TrustProfileView';

export default function AgentTrustProfile() {
  return (
    <TrustProfileView
      queryKey={qk.agent.trustProfile}
      queryFn={agentTrustProfileApi.get}
      eyebrow="Professional reputation"
      subtitle="Credentials, performance and earned badges"
      peers="agent"
    />
  );
}
