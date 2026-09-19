'use client';

import { ClipboardList, Wrench } from 'lucide-react';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';
import { MaintenanceRequestsView } from '@/components/landlord/maintenance/MaintenanceRequestsView';
import { HomeManagementWorkspace } from '@/components/home-management/HomeManagementWorkspace';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const TABS: HubTab[] = [
  { id: 'requests', label: 'Requests', icon: Wrench },
  { id: 'home-management', label: 'Home Management', icon: ClipboardList },
];

export default function LandlordMaintenancePage() {
  const [activeTab, setTab] = useHubTab(
    'requests',
    TABS.map((tab) => tab.id)
  );

  return (
    <>
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
      {activeTab === 'home-management' ? (
        <ProFeatureGate
          title="Home Management is a Pro feature"
          description="Upgrade to Pro to unlock SLA-backed maintenance timelines, vendor work orders, quotes, and invoicing."
        >
          <HomeManagementWorkspace role="landlord" />
        </ProFeatureGate>
      ) : (
        <MaintenanceRequestsView />
      )}
    </>
  );
}
