'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
import { ProfileSettings } from '@/components/renter/settings/ProfileSettings';
import { AccountSettings } from '@/components/renter/settings/AccountSettings';
import { NotificationSettings } from '@/components/renter/settings/NotificationSettings';
import { PrivacySettings } from '@/components/renter/settings/PrivacySettings';
import { SecuritySettings } from '@/components/renter/settings/SecuritySettings';
import { PaymentSettings } from '@/components/renter/settings/PaymentSettings';
import { ThemeSettings } from '@/components/renter/settings/ThemeSettings';
import { LanguageSettings } from '@/components/renter/settings/LanguageSettings';
import { DataExport } from '@/components/renter/settings/DataExport';
import { AccountDeletion } from '@/components/renter/settings/AccountDeletion';
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';
import {
  Settings,
  User,
  Lock,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  Download,
  Trash2,
} from 'lucide-react';

type SettingsTab =
  | 'profile'
  | 'account'
  | 'notifications'
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
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'export', label: 'Data Export', icon: Download },
  { id: 'delete', label: 'Delete Account', icon: Trash2 },
];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings user={user} />;
      case 'account':
        return <AccountSettings user={user} />;
      case 'notifications':
        return <NotificationSettings />;
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RenterNavbar user={user} />

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account preferences and settings
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden sticky top-20">
                  <div className="p-2 space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab.id
                              ? 'bg-[#c4a747]/10 text-[#c4a747]'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
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
                <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden p-6">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
