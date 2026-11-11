'use client';

import { Suspense } from 'react';
import { InvestorOnboarding } from '@/components/diaspora/workspace/InvestorOnboarding';

export default function BuyerInvestOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <InvestorOnboarding portal="buyer" />
    </Suspense>
  );
}
