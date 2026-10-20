'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@getrentos/ui';
import { RealtorRegister } from '@/components/admin/marketplace/RealtorRegister';
import { RealtorPayoutOversight } from '@/components/admin/marketplace/RealtorPayoutOversight';
import { RealtorCommissionRates } from '@/components/admin/marketplace/RealtorCommissionRates';

type Tab = 'register' | 'payouts' | 'rates';

const TABS: { id: Tab; label: string }[] = [
  { id: 'register', label: 'Register' },
  { id: 'payouts', label: 'Commission payouts' },
  { id: 'rates', label: 'Commission split' },
];

/**
 * Realtor oversight, in three views.
 *
 * The register answers "who is this realtor"; the other two answer "where did
 * the money go" and "what do we pay from now on", which are different jobs and
 * were previously only visible as read-only figures on a realtor's card.
 */
export default function AdminRealtorsPage() {
  const [tab, setTab] = useState<Tab>('register');

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList aria-label="Realtor views" className="max-w-full">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-sm">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'register' && <RealtorRegister />}
      {tab === 'payouts' && <RealtorPayoutOversight />}
      {tab === 'rates' && <RealtorCommissionRates />}
    </div>
  );
}
