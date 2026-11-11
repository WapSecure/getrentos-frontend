'use client';

import { Suspense } from 'react';
import { InvestorOnboarding } from '@/components/diaspora/workspace/InvestorOnboarding';

export default function OwnerInvestOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <InvestorOnboarding portal="owner" />
    </Suspense>
  );
}
