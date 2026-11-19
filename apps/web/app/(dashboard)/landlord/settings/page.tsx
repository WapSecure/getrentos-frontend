'use client';

import { useLandlordUser } from '../layout';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Bell, Landmark, Zap, Lock, Download, Trash2 } from '@sureground/icons';
import { Card, PageHeader } from '@sureground/ui';
import { ProfileSettings } from '@/components/landlord/settings/ProfileSettings';
import { NotificationSettings } from '@/components/landlord/settings/NotificationSettings';
import { PayoutSettings } from '@/components/landlord/settings/PayoutSettings';
import { AutomationSettings } from '@/components/landlord/settings/AutomationSettings';
import { DataExport } from '@/components/shared/settings/DataExport';
import { AccountDeletion } from '@/components/shared/settings/AccountDeletion';
import { SecuritySettings } from '@/components/shared/security/SecuritySettings';

type SettingsTab =
  | 'profile'
  | 'notifications'
  | 'payouts'
  | 'automation'
  | 'security'
  | 'data'
  | 'delete';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payouts', label: 'Payout account', icon: Landmark },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'data', label: 'Your data', icon: Download },
  { id: 'delete', label: 'Delete account', icon: Trash2 },
];

const isSettingsTab = (value: string | null): value is SettingsTab =>
  tabs.some((tab) => tab.id === value);

function LandlordSettingsPageContent() {
  const user = useLandlordUser();
  const requestedTab = useSearchParams().get('tab');
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    isSettingsTab(requestedTab) ? requestedTab : 'profile'
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'notifications':
        return <NotificationSettings />;
      case 'payouts':
        return <PayoutSettings />;
      case 'automation':
        return <AutomationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'data':
        return <DataExport />;
      case 'delete':
        return <AccountDeletion />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your account preferences and automation"
      />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <Card className="lg:sticky lg:top-20">
            <div className="p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-accent text-primary'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="flex-1 min-w-0">
          <Card className="p-4 sm:p-6">{renderContent()}</Card>
        </div>
      </div>
    </>
  );
}

export default function LandlordSettingsPage() {
  // useSearchParams needs a Suspense boundary on a statically rendered page.
  return (
    <Suspense fallback={null}>
      <LandlordSettingsPageContent />
    </Suspense>
  );
}
