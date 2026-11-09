'use client';

import { Send, FileText, CalendarClock } from 'lucide-react';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import { ROUTES } from '@getrentos/shared';
import { BroadcastComposer } from '@/components/landlord/automations/BroadcastComposer';
import { TemplatesManager } from '@/components/landlord/automations/TemplatesManager';
import { AutomationRulesManager } from '@/components/landlord/automations/AutomationRulesManager';
import { PageHeader } from '@getrentos/ui';

const TABS: HubTab[] = [
  { id: 'broadcast', label: 'Send', icon: Send },
  { id: 'rules', label: 'Rules', icon: CalendarClock },
  { id: 'templates', label: 'Templates', icon: FileText },
];

export default function LandlordAutomationsPage() {
  const [activeTab, setTab] = useHubTab(
    'broadcast',
    TABS.map((tab) => tab.id)
  );

  // The header sits outside the gate, so the page keeps its heading (and its
  // name for screen readers) on the upgrade screen too, as Microsite does.
  return (
    <>
      <PageHeader
        title="Automations"
        description="Reach your tenants with a one-off broadcast, saved templates or a recurring schedule."
      />
      <ProFeatureGate
        title="Automations is a Pro feature"
        description="Upgrade to Pro to broadcast announcements to your tenants, save templates, and schedule recurring messages."
        upgradeHref={ROUTES.LANDLORD_BILLING}
      >
        <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
        {activeTab === 'templates' ? (
          <TemplatesManager />
        ) : activeTab === 'rules' ? (
          <AutomationRulesManager />
        ) : (
          <BroadcastComposer />
        )}
      </ProFeatureGate>
    </>
  );
}
