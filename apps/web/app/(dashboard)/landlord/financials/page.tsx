'use client';

import { Building2, FileBarChart, PieChart, ClipboardList, Repeat, Target } from 'lucide-react';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';
import { FinancialsOverviewView } from '@/components/landlord/financials/FinancialsOverviewView';
import { OwnerStatementsView } from '@/components/landlord/financials/OwnerStatementsView';
import { PortfolioView } from '@/components/landlord/financials/PortfolioView';
import { ReportsView } from '@/components/landlord/financials/ReportsView';
import { DisbursementScheduleView } from '@/components/landlord/financials/DisbursementScheduleView';
import { BudgetsView } from '@/components/landlord/financials/BudgetsView';

const TABS: HubTab[] = [
  { id: 'overview', label: 'Overview', icon: PieChart },
  { id: 'portfolio', label: 'Portfolio', icon: Building2 },
  { id: 'budgets', label: 'Budgets', icon: Target },
  { id: 'statements', label: 'Owner Statements', icon: FileBarChart },
  { id: 'payouts', label: 'Auto Payouts', icon: Repeat },
  { id: 'reports', label: 'Reports', icon: ClipboardList },
];

export default function LandlordFinancialsPage() {
  const [activeTab, setTab] = useHubTab(
    'overview',
    TABS.map((tab) => tab.id)
  );

  return (
    <>
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
      {activeTab === 'statements' ? (
        <OwnerStatementsView />
      ) : activeTab === 'portfolio' ? (
        <PortfolioView />
      ) : activeTab === 'budgets' ? (
        <BudgetsView />
      ) : activeTab === 'payouts' ? (
        <DisbursementScheduleView />
      ) : activeTab === 'reports' ? (
        <ReportsView />
      ) : (
        <FinancialsOverviewView />
      )}
    </>
  );
}
