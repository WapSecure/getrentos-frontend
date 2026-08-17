'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { agentService } from '@/services/agentService';
import { agentKeys } from '@/lib/queryKeys';

export default function AgentTrustProfilePage() {
  return (
    <TrustProfileView
      queryKey={agentKeys.trustProfile}
      queryFn={() => agentService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="What clients and admins see about your credibility on GetRentos"
    />
  );
}
