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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences and settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="bg-card rounded-xl border border-border overflow-hidden sticky top-20">
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
