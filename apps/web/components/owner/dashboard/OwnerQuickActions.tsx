'use client';

import { Building2, Megaphone, Handshake, FileUp } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle } from '@getrentos/ui';
import { ROUTES } from '@/lib/constants/auth';

const actions = [
  { label: 'Add property', href: ROUTES.OWNER_PROPERTIES, icon: Building2 },
  { label: 'Publish listing', href: ROUTES.OWNER_LISTINGS, icon: Megaphone },
  { label: 'View offers', href: ROUTES.OWNER_OFFERS, icon: Handshake },
  { label: 'Upload ownership docs', href: ROUTES.OWNER_DOCUMENTS, icon: FileUp },
];

export const OwnerQuickActions = () => {
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
