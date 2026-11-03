'use client';

import Link from 'next/link';
import { Building2, Megaphone, FileText, BellRing, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  {
    label: 'Manage properties',
    description: 'Add or update your portfolio',
    href: ROUTES.LANDLORD_PROPERTIES,
    icon: Building2,
  },
  {
    label: 'Manage listings',
    description: 'Prepare a property for the market',
    href: ROUTES.LANDLORD_LISTINGS,
    icon: Megaphone,
  },
  {
    label: 'Review applications',
    description: 'Find your next tenant',
    href: ROUTES.LANDLORD_APPLICATIONS,
    icon: FileText,
  },
  {
    label: 'Rent and reminders',
    description: 'Follow up on unpaid charges',
    href: ROUTES.LANDLORD_PAYMENTS,
    icon: BellRing,
  },
];

export const LandlordQuickActions = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Quick actions</CardTitle>
        <CardDescription>Your everyday tasks, close at hand.</CardDescription>
      </CardHeader>
      <div className="space-y-1 p-3 pt-2">
        {actions.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="group flex min-h-[4.5rem] items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:text-primary">
              <action.icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{action.label}</span>
              <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                {action.description}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </Card>
  );
};
