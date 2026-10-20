'use client';

import { UserCheck, CheckCircle2, XCircle, CloudOff, Cloud } from 'lucide-react';
import { Badge, Card } from '@getrentos/ui';
import { formatDate } from '@/lib/format';
import type { VerificationVisit } from '@/types/agent';

interface VerificationCardProps {
  visit: VerificationVisit;
  delay?: number;
}

const subjectLabels: Record<VerificationVisit['subjectType'], string> = {
  tenant: 'Tenant',
  buyer: 'Buyer',
  property: 'Property',
};

export const VerificationCard = ({ visit }: VerificationCardProps) => {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-accent shrink-0">
            <UserCheck className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{visit.subjectName}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {subjectLabels[visit.subjectType]} · {visit.address}
            </p>
          </div>
        </div>
        <Badge
          variant={visit.syncStatus === 'synced' ? 'success' : 'warning'}
          icon={
            visit.syncStatus === 'synced' ? (
              <Cloud className="w-3 h-3" />
            ) : (
              <CloudOff className="w-3 h-3" />
            )
          }
          className="shrink-0 whitespace-nowrap"
        >
          {visit.syncStatus === 'synced' ? 'Synced' : 'Pending Sync'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="flex items-center gap-1.5">
          {visit.idVerified ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground/50" />
          )}
          <span className="text-xs text-muted-foreground">ID Verified</span>
        </div>
        <div className="flex items-center gap-1.5">
          {visit.addressConfirmed ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground/50" />
          )}
          <span className="text-xs text-muted-foreground">Address Confirmed</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
        {formatDate(visit.scheduledDate)}
      </p>
    </Card>
  );
};
