'use client';

import { FileBarChart, PieChart } from 'lucide-react';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';
import { FinancialsOverviewView } from '@/components/landlord/financials/FinancialsOverviewView';
import { OwnerStatementsView } from '@/components/landlord/financials/OwnerStatementsView';

const TABS: HubTab[] = [
  { id: 'overview', label: 'Overview', icon: PieChart },
  { id: 'statements', label: 'Owner Statements', icon: FileBarChart },
];

export default function LandlordFinancialsPage() {
  const [activeTab, setTab] = useHubTab(
    'overview',
    TABS.map((tab) => tab.id)
  );

  return (
    <>
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
      {activeTab === 'statements' ? <OwnerStatementsView /> : <FinancialsOverviewView />}
    </>
  );
}
