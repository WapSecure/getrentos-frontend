'use client';

import { Building2, Home, MessageSquare } from 'lucide-react';
import { Badge, Button, Card, type BadgeVariant } from '@getrentos/ui';
import { getInitials, formatDate } from '@/lib/format';
import type { RealtorClient } from '@/types/realtor';

const statusConfig: Record<RealtorClient['status'], { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  inactive: { label: 'Inactive', variant: 'neutral' },
};

interface ClientCardProps {
  client: RealtorClient;
  onMessage: () => void;
}

export const ClientCard = ({ client, onMessage }: ClientCardProps) => {
  const status = statusConfig[client.status];
  const RoleIcon = client.role === 'owner' ? Building2 : Home;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm shrink-0">
            {getInitials(client.clientName)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{client.clientName}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <RoleIcon className="w-3 h-3" />
              {client.role === 'owner' ? 'Property Owner' : 'Landlord'}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0 whitespace-nowrap">
          {status.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted-foreground">Properties</p>
          <p className="text-sm font-medium text-foreground">{client.propertiesRepresented}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Client Since</p>
          <p className="text-sm font-medium text-foreground">{formatDate(client.joinedDate)}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          onClick={onMessage}
        >
          Message
        </Button>
      </div>
    </Card>
  );
};
