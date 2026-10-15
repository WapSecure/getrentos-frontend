'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageErrorState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatDate, unwrap } from '@getrentos/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminManagementTransfersService,
  type AdminManagementTransfer,
} from '@/services/adminManagementTransfersService';

const STATUS: Record<
  AdminManagementTransfer['status'],
  { label: string; variant: 'info' | 'success' | 'neutral' | 'warning' | 'danger' }
> = {
  OPEN: { label: 'Scheduled', variant: 'info' },
  SWITCHED: { label: 'Taken effect', variant: 'success' },
  COMPLETED: { label: 'Completed', variant: 'success' },
  CANCELLED: { label: 'Called off', variant: 'neutral' },
  DISPUTED: { label: 'Disputed', variant: 'danger' },
};

/**
 * Every change of manager: who it moves from and to, when, and exactly what
 * the switch did. A failed step is listed for a person to finish by hand.
 */
export default function ManagerChangesPage() {
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canOperate = hasAdminPermission(user?.roles, 'managed.operate');
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'management-transfers'],
    queryFn: () => unwrap(adminManagementTransfersService.list()),
  });
  const switchNow = useMutation({
    mutationFn: (id: string) => unwrap(adminManagementTransfersService.switchNow(id)),
    onSuccess: (t) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'management-transfers'] });
      const failed = t.switchLog.filter((l) => !l.ok).length;
      setToast({
        message: failed ? `Switched with ${failed} step(s) to finish by hand.` : 'Switched.',
        variant: failed ? 'error' : 'success',
      });
    },
    onError: (e: Error) => setToast({ message: e.message || 'Did not switch.', variant: 'error' }),
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ArrowRightLeft className="h-6 w-6 text-primary" aria-hidden />
          Manager changes
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Owners moving a property between managers. Each switches on its effective time on its own:
          the outgoing engagement ends, the incoming one starts, deposits move and tenants are told.
          Anything that did not go through is listed here.
        </p>
      </div>

      {list.isError ? (
        <PageErrorState
          title="Could not load manager changes"
          description={(list.error as Error).message}
          onRetry={() => list.refetch()}
        />
      ) : list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !list.data?.length ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No manager changes yet"
          description="Owners schedule them from their portal."
        />
      ) : (
        <div className="space-y-3">
          {list.data.map((t) => {
            const due = t.status === 'OPEN' && new Date(t.effectiveAt) <= new Date();
            return (
              <Card key={t.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{t.propertyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.outgoing ? `${t.outgoing.manager} → ` : 'Owner → '}
                      {t.incoming.manager} · effective {formatDate(t.effectiveAt)}
                      {t.incoming.mandateId
                        ? t.incoming.ready
                          ? ' · incoming ready'
                          : ' · incoming not verified'
                        : ''}
                    </p>
                    {t.reason && <p className="mt-1 text-sm text-muted-foreground">{t.reason}</p>}
                    {t.acknowledgedItems.length > 0 && (
                      <p className="mt-1 text-xs text-warning">
                        Owner acknowledged {t.acknowledgedItems.length} open matter
                        {t.acknowledgedItems.length === 1 ? '' : 's'}:{' '}
                        {t.acknowledgedItems.map((i) => i.label).join('; ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS[t.status].variant}>{STATUS[t.status].label}</Badge>
                    {canOperate && due && (
                      <Button
                        size="sm"
                        variant="primary"
                        disabled={switchNow.isPending}
                        onClick={() => switchNow.mutate(t.id)}
                      >
                        Switch now
                      </Button>
                    )}
                  </div>
                </div>
                {t.switchLog.length > 0 && (
                  <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
                    {t.switchLog.map((l) => (
                      <li
                        key={l.step}
                        className={l.ok ? 'text-muted-foreground' : 'text-destructive'}
                      >
                        {l.ok ? '✓' : '✗'} {l.step.replace(/_/g, ' ').toLowerCase()}: {l.note}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
