'use client';

import { useState } from 'react';
import { Card } from '@getrentos/ui';
import { useSearchParams } from 'next/navigation';
import { useAgentUser } from '../layout';
import { User, Bell, Landmark, MapPin, ShieldCheck } from 'lucide-react';
import { ProfileSettings } from '@/components/agent/settings/ProfileSettings';
import { NotificationSettings } from '@/components/agent/settings/NotificationSettings';
import { SellerPayoutSettings } from '@/components/shared/payouts/SellerPayoutSettings';
import { AgencyAgentSelfPayout } from '@/components/agency/AgencyAgentSelfPayout';
import { FieldPreferencesSettings } from '@/components/agent/settings/FieldPreferencesSettings';
import { LicenseVerificationSettings } from '@/components/shared/verification/LicenseVerificationSettings';

type SettingsTab = 'profile' | 'verification' | 'notifications' | 'payouts' | 'preferences';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payouts', label: 'Payout Account', icon: Landmark },
  { id: 'preferences', label: 'Field Preferences', icon: MapPin },
];

export default function AgentSettingsPage() {
  const user = useAgentUser();
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
        return (
          <>
            <SellerPayoutSettings description="Where money from properties you sell on the marketplace is sent once GetRentos pays it out to you: transfers run through Paystack." />
            <AgencyAgentSelfPayout standalone />
          </>
        );
      case 'preferences':
        return <FieldPreferencesSettings />;
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
          <Card className="lg:sticky lg:top-20">
            <nav aria-label="Settings sections" className="p-2 space-y-1">
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
            </nav>
          </Card>
        </div>

        <div className="min-w-0 flex-1">
          <Card className="p-6">{renderContent()}</Card>
        </div>
      </div>
    </>
  );
}
