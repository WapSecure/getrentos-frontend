'use client';

import { useOwnerUser } from '../layout';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Bell, Landmark, SlidersHorizontal, Download } from 'lucide-react';
import { ProfileSettings } from '@/components/owner/settings/ProfileSettings';
import { NotificationSettings } from '@/components/owner/settings/NotificationSettings';
import { SellerPayoutSettings } from '@/components/shared/payouts/SellerPayoutSettings';
import { PreferencesSettings } from '@/components/owner/settings/PreferencesSettings';
import { DataExport } from '@/components/shared/settings/DataExport';

type SettingsTab = 'profile' | 'notifications' | 'payouts' | 'preferences' | 'data';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payouts', label: 'Payout Account', icon: Landmark },
  { id: 'preferences', label: 'Preferences', icon: SlidersHorizontal },
  { id: 'data', label: 'Your data', icon: Download },
];

export default function OwnerSettingsPage() {
  const user = useOwnerUser();
  // Deep link (e.g. ?tab=payouts from a land sale awaiting a payout account).
  const requested = useSearchParams().get('tab');
  const [activeTab, setActiveTab] = useState<SettingsTab>(() =>
    tabs.some((tab) => tab.id === requested) ? (requested as SettingsTab) : 'profile'
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'notifications':
        return <NotificationSettings />;
      case 'payouts':
        return (
          <SellerPayoutSettings description="Where your marketplace sale money is sent once GetRentos pays it out to you: transfers run through Paystack." />
        );
      case 'preferences':
        return <PreferencesSettings />;
      case 'data':
        return <DataExport />;
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
