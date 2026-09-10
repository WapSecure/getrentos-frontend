'use client';

import { BillingPage } from '@/components/shared/subscription/BillingPage';

export default function LandlordBillingPage() {
  return (
    <BillingPage
      persona="landlord"
      description="See what's included on Free and what Pro unlocks for scaling your portfolio."
    />
  );
}
