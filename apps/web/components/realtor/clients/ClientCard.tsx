'use client';

import { Building2, Home, MessageSquare } from '@sureground/icons';
import { Badge, Button, type BadgeVariant } from '@sureground/ui';
import { formatDate } from '@/lib/format';
import {
  RecordActions,
  RecordAvatar,
  RecordFacts,
  recordCardClass,
} from '@/components/shared/records/RecordParts';
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
    <div className={recordCardClass()}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <RecordAvatar name={client.clientName} />
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{client.clientName}</h3>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <RoleIcon className="w-3 h-3" aria-hidden="true" />
              {client.role === 'owner' ? 'Property owner' : 'Landlord'}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0 whitespace-nowrap">
          {status.label}
        </Badge>
      </div>

      <RecordFacts
        facts={[
          { label: 'Properties', value: client.propertiesRepresented },
          { label: 'Client since', value: formatDate(client.joinedDate) },
        ]}
      />

      <RecordActions className="flex-nowrap">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          icon={<MessageSquare className="w-3.5 h-3.5" />}
          onClick={onMessage}
        >
          Message
        </Button>
      </RecordActions>
    </div>
  );
};
