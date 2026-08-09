'use client';

import { useBuyerUser } from '../layout';
import { useState } from 'react';
import { User, Bell, Landmark, SlidersHorizontal } from 'lucide-react';
import { ProfileSettings } from '@/components/buyer/settings/ProfileSettings';
import { NotificationSettings } from '@/components/buyer/settings/NotificationSettings';
import { PaymentMethodSettings } from '@/components/buyer/settings/PaymentMethodSettings';
import { SearchPreferencesSettings } from '@/components/buyer/settings/SearchPreferencesSettings';

type SettingsTab = 'profile' | 'notifications' | 'payment' | 'preferences';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payment', label: 'Payment Method', icon: Landmark },
  { id: 'preferences', label: 'Search Preferences', icon: SlidersHorizontal },
];

export default function BuyerSettingsPage() {
  const user = useBuyerUser();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'notifications':
        return <NotificationSettings />;
      case 'payment':
        return <PaymentMethodSettings />;
      case 'preferences':
        return <SearchPreferencesSettings />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="bg-card rounded-xl border border-border overflow-hidden lg:sticky lg:top-20">
            <div className="p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
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
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-card rounded-xl border border-border overflow-hidden p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}
