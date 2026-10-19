'use client';

import { House, FileCheck, FileText, ClipboardCheck, PiggyBank } from 'lucide-react';
import { HomeOverviewView } from '@/components/renter/home/HomeOverviewView';
import { LeaseView } from '@/components/renter/lease/LeaseView';
import { DocumentsView } from '@/components/renter/documents/DocumentsView';
import { InspectionsSection } from '@/components/renter/home/InspectionsSection';
import { DepositSection } from '@/components/renter/home/DepositSection';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';

const TABS: HubTab[] = [
  { id: 'overview', label: 'Overview', icon: House },
  { id: 'lease', label: 'Lease', icon: FileCheck },
  { id: 'deposit', label: 'Deposit', icon: PiggyBank },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
];

export default function RenterHomePage() {
  const [activeTab, setTab] = useHubTab('overview', [
    'overview',
    'lease',
    'deposit',
    'documents',
    'inspections',
  ]);

  return (
    <>
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />

      {activeTab === 'lease' && <LeaseView />}
      {activeTab === 'deposit' && <DepositSection />}
      {activeTab === 'documents' && <DocumentsView />}
      {activeTab === 'inspections' && <InspectionsSection />}
      {activeTab === 'overview' && <HomeOverviewView />}
    </>
  );
}
