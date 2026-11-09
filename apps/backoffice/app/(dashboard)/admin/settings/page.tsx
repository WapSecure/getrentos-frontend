'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Bell, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { ProfileSettings } from '@/components/admin/settings/ProfileSettings';
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings';
import { PlatformConfigSettings } from '@/components/admin/settings/PlatformConfigSettings';
import { SecuritySettings } from '@/components/admin/settings/SecuritySettings';
import { cn } from '@sureground/shared';
import { ConfirmDialog, PageHeader } from '@sureground/ui';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'platform';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'platform', label: 'Platform Configuration', icon: SlidersHorizontal },
];

const tabFromUrl = (value: string | null): SettingsTab =>
  tabs.find((tab) => tab.id === value)?.id ?? 'profile';

export default function AdminSettingsPage() {
  // `?tab=security` opens straight on a tab (e.g. from the two-factor prompt).
  const urlTab = tabFromUrl(useSearchParams().get('tab'));
  const [activeTab, setActiveTab] = useState<SettingsTab>(urlTab);
  const [seenUrlTab, setSeenUrlTab] = useState(urlTab);
  if (urlTab !== seenUrlTab) {
    setSeenUrlTab(urlTab);
    setActiveTab(urlTab);
  }
  const [isDirty, setIsDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null);

  useEffect(() => {
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [isDirty]);

  const selectTab = (tab: SettingsTab) => {
    if (tab === activeTab) return;
    if (isDirty) setPendingTab(tab);
    else setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings onDirtyChange={setIsDirty} />;
      case 'security':
        return <SecuritySettings />;
      case 'notifications':
        return <NotificationSettings onDirtyChange={setIsDirty} />;
      case 'platform':
        return <PlatformConfigSettings onDirtyChange={setIsDirty} />;
      default:
        return null;
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and platform preferences" />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="bg-card border border-border rounded-lg overflow-hidden lg:sticky lg:top-20">
            <div className="p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => selectTab(tab.id)}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-accent text-primary'
                        : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-card border border-border rounded-lg overflow-hidden p-4 sm:p-6">
            {renderContent()}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingTab !== null}
        onOpenChange={(open) => !open && setPendingTab(null)}
        title="Discard unsaved changes?"
        description="Changes on this settings page have not been saved and will be lost."
        confirmLabel="Discard changes"
        onConfirm={() => {
          if (pendingTab) setActiveTab(pendingTab);
          setPendingTab(null);
          setIsDirty(false);
        }}
      />
    </>
  );
}
