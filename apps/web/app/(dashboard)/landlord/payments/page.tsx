'use client';

import { AlertTriangle, CreditCard } from 'lucide-react';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';
import { PaymentsView } from '@/components/landlord/payments/PaymentsView';
import { ArrearsView } from '@/components/landlord/payments/ArrearsView';

const TABS: HubTab[] = [
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'arrears', label: 'Arrears', icon: AlertTriangle },
];

export default function LandlordPaymentsPage() {
  const [activeTab, setTab] = useHubTab(
    'payments',
    TABS.map((tab) => tab.id)
  );

  return (
    <>
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
      {activeTab === 'arrears' ? <ArrearsView /> : <PaymentsView />}
    </>
  );
}
