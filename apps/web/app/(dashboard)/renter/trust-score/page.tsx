'use client';

import { TrendingUp } from '@sureground/icons';
import { useRenterUser } from '../layout';
import { ROUTES } from '@/lib/constants/auth';
import { TrustHub } from '@/components/shared/trust/TrustHub';
import { RenterTrustHistory } from '@/components/renter/trust-score/RenterTrustHistory';
import { CreditReportingView } from '@/components/renter/credit-reporting/CreditReportingView';

export default function RenterTrustPage() {
  const user = useRenterUser();

  return (
    <TrustHub
      portal="renter"
      purpose="RENTER_ONBOARDING"
      verificationDescription="Verify your identity to submit rental applications, sign leases and access higher trust limits."
      trustHref={ROUTES.RENTER_TRUST_SCORE}
      subjectId={user?.id}
      moreDetails={<RenterTrustHistory />}
      extraTabs={[
        {
          id: 'credit',
          label: 'Credit report',
          icon: TrendingUp,
          description: 'Whether your rent payments are reported to a credit bureau.',
          content: <CreditReportingView />,
        },
      ]}
    />
  );
}
