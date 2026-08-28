'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRealtorUser } from '../layout';
import { User, Bell, Landmark, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { ProfileSettings } from '@/components/realtor/settings/ProfileSettings';
import { NotificationSettings } from '@/components/realtor/settings/NotificationSettings';
import { PayoutSettings } from '@/components/realtor/settings/PayoutSettings';
import { BusinessPreferencesSettings } from '@/components/realtor/settings/BusinessPreferencesSettings';
import { LicenseVerificationSettings } from '@/components/shared/verification/LicenseVerificationSettings';

type SettingsTab = 'profile' | 'verification' | 'notifications' | 'payouts' | 'preferences';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payouts', label: 'Payout Account', icon: Landmark },
  { id: 'preferences', label: 'Business Preferences', icon: SlidersHorizontal },
];

export default function RealtorSettingsPage() {
  const user = useRealtorUser();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab | null) ?? 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'verification':
        return <LicenseVerificationSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'payouts':
        return <PayoutSettings />;
      case 'preferences':
        return <BusinessPreferencesSettings />;
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
