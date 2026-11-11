'use client';

import { ROUTES } from '@/lib/constants/auth';
import { TrustHub } from '@/components/shared/trust/TrustHub';
import { TrustProfileDetails } from '@/components/shared/trust/TrustProfileDetails';
import { agentService } from '@/services/agentService';
import { agentKeys } from '@/lib/queryKeys';

export default function AgentTrustPage() {
  return (
    <TrustHub
      portal="agent"
      purpose="AGENT_ONBOARDING"
      verificationDescription="Verify your identity to manage clients and run verification visits."
      trustHref={ROUTES.AGENT_TRUST_PROFILE}
      moreDetails={
        <TrustProfileDetails
          audience="clients and admins"
          queryKey={agentKeys.trustProfile}
          queryFn={() => agentService.getTrustProfile()}
        />
      }
    />
  );
}
