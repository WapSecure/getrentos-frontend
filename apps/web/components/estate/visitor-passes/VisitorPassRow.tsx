'use client';

import { passTimeline } from '@sureground/shared';
import { Badge, Button } from '@sureground/ui';
import { IdCheckDialog } from '@/components/estate/visitor-passes/IdCheckDialog';
import { EstateRow, RowAvatar } from '@/components/estate/shared/EstateListSection';
import type { VisitorPass } from '@/types/estate';

const statusVariant: Record<VisitorPass['status'], 'success' | 'warning' | 'neutral' | 'danger'> = {
  pending: 'warning',
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
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
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

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

interface VisitorPassRowProps {
  pass: VisitorPass;
  estateId: string;
  onRevoke: () => void;
  isRevoking?: boolean;
}

export const VisitorPassRow = ({ pass, estateId, onRevoke, isRevoking }: VisitorPassRowProps) => {
  const when = [pass.purpose, passTimeline(pass, formatDate, formatTime)]
    .filter(Boolean)
    .join(' · ');
  return (
    <EstateRow
      leading={<RowAvatar name={pass.visitorName} />}
      title={
        <>
          <p className="truncate text-sm font-medium text-foreground">{pass.visitorName}</p>
          <Badge variant={statusVariant[pass.status]}>{statusLabels[pass.status]}</Badge>
        </>
      }
      meta={
        <>
          <p className="truncate">
            {pass.unitLabel} · {pass.residentName}
          </p>
          {when && <p className="tabular-nums">{when}</p>}
        </>
      }
      actions={
        <>
          <IdCheckDialog estateId={estateId} passId={pass.id} visitorName={pass.visitorName} />
          {pass.status === 'pending' && (
            <Button variant="outline" size="sm" disabled={isRevoking} onClick={onRevoke}>
              Revoke
            </Button>
          )}
        </>
      }
    />
  );
};
