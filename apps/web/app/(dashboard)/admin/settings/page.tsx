'use client';

import { useState } from 'react';
import { User, Bell, SlidersHorizontal } from 'lucide-react';
import { ProfileSettings } from '@/components/admin/settings/ProfileSettings';
import { NotificationSettings } from '@/components/admin/settings/NotificationSettings';
import { PlatformConfigSettings } from '@/components/admin/settings/PlatformConfigSettings';
import { cn } from '@/lib/cn';
import { useAdminUser } from '../layout';

type SettingsTab = 'profile' | 'notifications' | 'platform';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'platform', label: 'Platform Configuration', icon: SlidersHorizontal },
];

export default function AdminSettingsPage() {
  const user = useAdminUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'notifications':
        return <NotificationSettings />;
      case 'platform':
        return <PlatformConfigSettings />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and platform preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="bg-card border border-border rounded-lg overflow-hidden lg:sticky lg:top-20">
            <div className="p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-accent text-primary'
                        : 'text-muted-foreground hover:bg-secondary'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-card border border-border rounded-lg overflow-hidden p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}
