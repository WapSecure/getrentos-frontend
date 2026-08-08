'use client';

import { Search, CalendarClock, Handshake, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const actions = [
  { label: 'Discover Properties', href: '/buyer/discover', icon: Search },
  { label: 'Request Viewing', href: '/buyer/viewings', icon: CalendarClock },
  { label: 'View Offers', href: '/buyer/offers', icon: Handshake },
  { label: 'Upload Documents', href: '/buyer/documents', icon: FileUp },
];

export const BuyerQuickActions = () => {
  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            href={action.href}
            variant="outline"
            rounded="lg"
            className="flex-col h-auto py-4 gap-2"
          >
            <action.icon className="w-5 h-5 text-[#c4a747]" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
