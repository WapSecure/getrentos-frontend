'use client';

import { BillingPage } from '@/components/shared/subscription/BillingPage';

export default function OwnerBillingPage() {
  return (
    <BillingPage
      persona="owner"
      description="See what's included on Free and what Pro unlocks for your portfolio."
    />
  );
}
