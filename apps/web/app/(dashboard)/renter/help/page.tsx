'use client';

import { useState } from 'react';
import { LifeBuoy, Scale } from 'lucide-react';
import { HelpHeader } from '@/components/renter/help/HelpHeader';
import { HelpCategories } from '@/components/renter/help/HelpCategories';
import { HelpArticles } from '@/components/renter/help/HelpArticles';
import { HelpFAQs } from '@/components/renter/help/HelpFAQs';
import { HelpGuides } from '@/components/renter/help/HelpGuides';
import { HelpSupport } from '@/components/renter/help/HelpSupport';
import { HelpFeedback } from '@/components/renter/help/HelpFeedback';
import { HelpStatus } from '@/components/renter/help/HelpStatus';
import { LegalResourcesView } from '@/components/renter/legal/LegalResourcesView';
import { HubTabs, useHubTab, type HubTab } from '@/components/renter/shared/HubTabs';

const TABS: HubTab[] = [
  { id: 'help', label: 'Help Center', icon: LifeBuoy },
  { id: 'legal', label: 'Legal Resources', icon: Scale },
];

export default function HelpPage() {
  const [activeTab, setTab] = useHubTab('help', ['help', 'legal']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  return (
    <>
      <HubTabs tabs={TABS} activeTab={activeTab} onChange={setTab} />

      {activeTab === 'legal' ? (
        <LegalResourcesView />
      ) : (
        <>
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
        </>
      )}
    </>
  );
}
