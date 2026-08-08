'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Landmark, SlidersHorizontal } from 'lucide-react';
import { BuyerNavbar } from '@/components/buyer/navigation/BuyerNavbar';
import { BuyerSidebar } from '@/components/buyer/dashboard/BuyerSidebar';
import { ProfileSettings } from '@/components/buyer/settings/ProfileSettings';
import { NotificationSettings } from '@/components/buyer/settings/NotificationSettings';
import { PaymentMethodSettings } from '@/components/buyer/settings/PaymentMethodSettings';
import { SearchPreferencesSettings } from '@/components/buyer/settings/SearchPreferencesSettings';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

type SettingsTab = 'profile' | 'notifications' | 'payment' | 'preferences';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'payment', label: 'Payment Method', icon: Landmark },
  { id: 'preferences', label: 'Search Preferences', icon: SlidersHorizontal },
];

export default function BuyerSettingsPage() {
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
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'buyer') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <BuyerNavbar user={user} />

      <div className="flex">
        <BuyerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your account preferences
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden lg:sticky lg:top-20">
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
