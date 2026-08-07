'use client';

import { Building2, Megaphone, FileText, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const actions = [
  { label: 'Add Property', href: '/landlord/properties', icon: Building2 },
  { label: 'Publish Listing', href: '/landlord/listings', icon: Megaphone },
  { label: 'View Applications', href: '/landlord/applications', icon: FileText },
  { label: 'Send Reminder', href: '/landlord/payments', icon: BellRing },
];

export const LandlordQuickActions = () => {
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
