'use client';

import { Star, ShieldCheck, TrendingUp } from 'lucide-react';
import { PageHeader } from '@sureground/ui';
import { useRenterUser } from '../layout';
import { getStoredUser } from '@/lib/authStorage';
import { ROUTES } from '@/lib/constants/auth';
import { VerificationCenter } from '@/components/shared/verification/VerificationCenter';
import { TrustScoreView } from '@/components/renter/trust-score/TrustScoreView';
import { CreditReportingView } from '@/components/renter/credit-reporting/CreditReportingView';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';

const TABS: HubTab[] = [
  { id: 'trust', label: 'Trust score', icon: Star },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'credit', label: 'Credit report', icon: TrendingUp },
];

export default function RenterStandingPage() {
  const [activeTab, setTab] = useHubTab('trust', ['trust', 'verification', 'credit']);
  const user = useRenterUser();
  const subjectId = user?.id ?? getStoredUser<{ id?: string }>()?.id ?? '';

  return (
    <>
      {/* Verification and Credit report bring their own page heading; the
          trust tab needs one, so the page always has a name for screen readers. */}
      {activeTab === 'trust' && (
        <PageHeader
          title="Trust score"
          description="Your score, the checks behind it and what to do next."
        />
      )}
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />

      {activeTab === 'verification' && (
        <VerificationCenter
          subjectId={subjectId}
          purpose="RENTER_ONBOARDING"
          description="Verify your identity to submit rental applications, sign leases and access higher trust limits."
          trustScoreHref={ROUTES.RENTER_TRUST_SCORE}
        />
      )}
      {activeTab === 'credit' && <CreditReportingView />}
      {activeTab === 'trust' && <TrustScoreView onVerify={() => setTab('verification')} />}
    </>
  );
}
