'use client';

import { useRenterUser } from '../layout';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProfileSettings } from '@/components/renter/settings/ProfileSettings';
import { AccountSettings } from '@/components/renter/settings/AccountSettings';
import { NotificationSettings } from '@/components/renter/settings/NotificationSettings';
import { WhatsAppSettings } from '@/components/renter/settings/WhatsAppSettings';
import { PrivacySettings } from '@/components/renter/settings/PrivacySettings';
import { SecuritySettings } from '@/components/renter/settings/SecuritySettings';
import { PaymentSettings } from '@/components/renter/settings/PaymentSettings';
import { ThemeSettings } from '@/components/renter/settings/ThemeSettings';
import { LanguageSettings } from '@/components/renter/settings/LanguageSettings';
import { DataExport } from '@/components/renter/settings/DataExport';
import { AccountDeletion } from '@/components/renter/settings/AccountDeletion';
import { IdentityVerificationSettings } from '@/components/shared/verification/IdentityVerificationSettings';
import {
  Settings,
  User,
  Lock,
  Bell,
  Shield,
  ShieldCheck,
  CreditCard,
  Palette,
  Globe,
  Download,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import { RenterPageHeader } from '@/components/renter/shared/RenterPageHeader';

type SettingsTab =
  | 'profile'
  | 'account'
  | 'verification'
  | 'notifications'
  | 'whatsapp'
  | 'privacy'
  | 'security'
  | 'payments'
  | 'theme'
  | 'language'
  | 'export'
  | 'delete';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'account', label: 'Account', icon: Settings },
  { id: 'verification', label: 'Verification', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'export', label: 'Data Export', icon: Download },
  { id: 'delete', label: 'Delete Account', icon: Trash2 },
];

export default function SettingsPage() {
  const user = useRenterUser();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab | null) ?? 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'account':
        return <AccountSettings user={user} />;
      case 'verification':
        return (
          <IdentityVerificationSettings description="Verify your identity to unlock submitting rental applications." />
        );
      case 'notifications':
        return <NotificationSettings />;
      case 'whatsapp':
        return <WhatsAppSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'security':
        return <SecuritySettings />;
      case 'payments':
        return <PaymentSettings />;
      case 'theme':
        return <ThemeSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'export':
        return <DataExport />;
      case 'delete':
        return <AccountDeletion />;
      default:
        return null;
    }
  };

  return (
    <>
      <RenterPageHeader
        eyebrow="Account control centre"
        icon={Settings}
        title="Settings"
        description="Manage your renter profile, privacy, security, payments, notifications, and accessibility preferences."
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="shrink-0 lg:w-72">
          <div className="sticky top-20 overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div
              className="flex gap-1 overflow-x-auto p-2 lg:block lg:space-y-1"
              role="tablist"
              aria-label="Settings sections"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex min-h-11 shrink-0 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 lg:w-full ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10'
                        : 'text-foreground hover:bg-secondary'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}
