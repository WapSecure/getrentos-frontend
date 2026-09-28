'use client';

import { useState } from 'react';
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
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'register' && <RealtorRegister />}
      {tab === 'payouts' && <RealtorPayoutOversight />}
      {tab === 'rates' && <RealtorCommissionRates />}
    </div>
  );
}
