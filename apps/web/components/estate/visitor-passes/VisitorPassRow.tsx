'use client';

import { Badge, Button } from '@getrentos/ui';
import type { VisitorPass } from '@/types/estate';

const statusVariant: Record<VisitorPass['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  pending: 'warning',
  // Warning, not neutral: this one is waiting on the household to answer.
  awaiting_approval: 'warning',
  approved: 'success',
  checked_in: 'success',
  checked_out: 'neutral',
  expired: 'neutral',
  revoked: 'danger',
  denied: 'danger',
};

const statusLabels: Record<VisitorPass['status'], string> = {
  pending: 'Pending',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  checked_in: 'Checked In',
  checked_out: 'Checked Out',
  expired: 'Expired',
  revoked: 'Revoked',
  denied: 'Refused',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));

interface VisitorPassRowProps {
  pass: VisitorPass;
  onRevoke: () => void;
  isRevoking?: boolean;
}

export const VisitorPassRow = ({ pass, onRevoke, isRevoking }: VisitorPassRowProps) => {
  return (
    <div className="p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {pass.visitorName} — {pass.unitLabel}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {pass.residentName}
          {pass.purpose ? ` · ${pass.purpose}` : ''} · Expires {formatDate(pass.expiresAt)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Badge variant={statusVariant[pass.status]}>{statusLabels[pass.status]}</Badge>
        {pass.status === 'pending' && (
          <Button variant="outline" size="sm" disabled={isRevoking} onClick={onRevoke}>
            Revoke
          </Button>
        )}
      </div>
    </div>
  );
};
