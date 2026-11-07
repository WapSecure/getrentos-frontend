'use client';

import { TrustProfileView } from '@/components/shared/trust/TrustProfileView';
import { agentService } from '@/services/agentService';
import { agentKeys } from '@/lib/queryKeys';

export default function AgentTrustProfilePage() {
  return (
    <TrustProfileView
      portal="agent"
      audience="clients and admins"
      queryKey={agentKeys.trustProfile}
      queryFn={() => agentService.getTrustProfile()}
      title="Trust & Verification Profile"
      subtitle="Your identity, what you need here, and your trust score."
    />
  );
}
