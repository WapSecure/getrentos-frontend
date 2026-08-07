'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
import { HelpHeader } from '@/components/renter/help/HelpHeader';
import { HelpCategories } from '@/components/renter/help/HelpCategories';
import { HelpArticles } from '@/components/renter/help/HelpArticles';
import { HelpFAQs } from '@/components/renter/help/HelpFAQs';
import { HelpGuides } from '@/components/renter/help/HelpGuides';
import { HelpSupport } from '@/components/renter/help/HelpSupport';
import { HelpFeedback } from '@/components/renter/help/HelpFeedback';
import { HelpStatus } from '@/components/renter/help/HelpStatus';
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';

export default function HelpPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
            <HelpHeader searchQuery={searchQuery} onSearch={setSearchQuery} />

            <HelpStatus />

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <HelpCategories
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
                <HelpArticles searchQuery={searchQuery} selectedCategory={selectedCategory} />
                <HelpFAQs selectedCategory={selectedCategory} />
                <HelpGuides selectedCategory={selectedCategory} />
              </div>
              <div className="space-y-6">
                <HelpSupport />
                <HelpFeedback />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
