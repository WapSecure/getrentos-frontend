'use client';

import { Search, CalendarClock, Handshake, FileUp } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  { label: 'Discover Properties', href: ROUTES.BUYER_DISCOVER, icon: Search },
  { label: 'Request Viewing', href: ROUTES.BUYER_VIEWINGS, icon: CalendarClock },
  { label: 'View Offers', href: ROUTES.BUYER_OFFERS, icon: Handshake },
  { label: 'Upload Documents', href: ROUTES.BUYER_DOCUMENTS, icon: FileUp },
];

export const BuyerQuickActions = () => {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            href={action.href}
            variant="outline"
            rounded="lg"
            className="flex-col h-auto py-4 gap-2"
          >
            <action.icon className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
