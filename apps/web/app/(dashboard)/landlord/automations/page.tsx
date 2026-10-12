'use client';

import { Send, FileText, CalendarClock } from 'lucide-react';
import { HubTabs, useHubTab, type HubTab } from '@/components/shared/navigation/HubTabs';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';
import { ROUTES } from '@getrentos/shared';
import { BroadcastComposer } from '@/components/landlord/automations/BroadcastComposer';
import { TemplatesManager } from '@/components/landlord/automations/TemplatesManager';
import { AutomationRulesManager } from '@/components/landlord/automations/AutomationRulesManager';

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

  return (
    <ProFeatureGate
      title="Automations is a Pro feature"
      description="Upgrade to Pro to broadcast announcements to your tenants, save templates, and schedule recurring messages."
      upgradeHref={ROUTES.LANDLORD_BILLING}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">Automations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reach your tenants with a one-off broadcast, saved templates or a recurring schedule.
        </p>
      </div>
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />
      {activeTab === 'templates' ? (
        <TemplatesManager />
      ) : activeTab === 'rules' ? (
        <AutomationRulesManager />
      ) : (
        <BroadcastComposer />
      )}
    </ProFeatureGate>
  );
}
