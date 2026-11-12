'use client';

import { Suspense } from 'react';
import { InvestorManaged } from '@/components/diaspora/managed/InvestorManaged';

export default function OwnerInvestManagedPage() {
  // Suspense: the page reads ?statement= to open a linked statement.
  return (
    <Suspense fallback={null}>
      <InvestorManaged />
    </Suspense>
  );
}
