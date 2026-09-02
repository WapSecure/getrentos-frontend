'use client';

import { Megaphone, CalendarClock, UserPlus, Users } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  { label: 'Add Listing', href: ROUTES.REALTOR_LISTINGS, icon: Megaphone },
  { label: 'Schedule Viewing', href: ROUTES.REALTOR_VIEWINGS, icon: CalendarClock },
  { label: 'View Leads', href: ROUTES.REALTOR_LEADS, icon: UserPlus },
  { label: 'Add Client', href: ROUTES.REALTOR_CLIENTS, icon: Users },
];

export const RealtorQuickActions = () => {
  return (
    <div className="rounded-2xl border border-border/90 bg-card p-5 shadow-sm">
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
