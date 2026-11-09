'use client';

import { Search, CalendarClock, Handshake, FileUp } from '@sureground/icons';
import { Button, Card, CardHeader, CardTitle } from '@sureground/ui';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  { label: 'Discover properties', href: ROUTES.BUYER_DISCOVER, icon: Search },
  { label: 'Request viewing', href: ROUTES.BUYER_VIEWINGS, icon: CalendarClock },
  { label: 'View offers', href: ROUTES.BUYER_OFFERS, icon: Handshake },
  { label: 'Upload documents', href: ROUTES.BUYER_DOCUMENTS, icon: FileUp },
];

export const BuyerQuickActions = () => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 p-5 pt-0">
        {actions.map((action) => (
          <Button
            key={action.label}
            href={action.href}
            variant="outline"
            rounded="md"
            className="flex-col h-auto py-4 gap-2"
          >
            <action.icon className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs font-medium text-center">{action.label}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
