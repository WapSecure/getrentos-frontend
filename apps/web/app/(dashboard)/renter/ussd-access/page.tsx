'use client';

import { UssdExplainer } from '@/components/renter/ussd/UssdExplainer';
import { UssdSimulator } from '@/components/renter/ussd/UssdSimulator';

export default function RenterUssdAccessPage() {
  return (
    <div className="grid lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-2">
        <UssdExplainer />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <UssdSimulator />
      </div>
    </div>
  );
}
