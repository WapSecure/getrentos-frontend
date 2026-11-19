'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Bell, Download, Lock, Trash2, User } from '@sureground/icons';
import { Card, PageHeader } from '@sureground/ui';
import { ProfileSettings } from '@/components/shared/settings/ProfileSettings';
import { NotificationSettings } from '@/components/shared/settings/NotificationSettings';
import { DataExport } from '@/components/shared/settings/DataExport';
import { AccountDeletion } from '@/components/shared/settings/AccountDeletion';
import { SecuritySettings } from '@/components/shared/security/SecuritySettings';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'data' | 'delete';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'data', label: 'Your data', icon: Download },
  { id: 'delete', label: 'Delete account', icon: Trash2 },
];

const isSettingsTab = (value: string | null): value is SettingsTab =>
  tabs.some((tab) => tab.id === value);

function AccountSettingsContent() {
  const requestedTab = useSearchParams().get('tab');
  const [activeTab, setActiveTab] = useState<SettingsTab>(
    isSettingsTab(requestedTab) ? requestedTab : 'profile'
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={null} />;
      case 'notifications':
        return <NotificationSettings />;
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
        description="Your profile, notifications, security and data"
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

/** For portals without their own settings page; profile and notifications use the any-role endpoints. */
export function AccountSettingsPage() {
  // useSearchParams needs a Suspense boundary on a statically rendered page.
  return (
    <Suspense fallback={null}>
      <AccountSettingsContent />
    </Suspense>
  );
}
