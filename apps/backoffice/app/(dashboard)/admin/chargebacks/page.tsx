'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  useToast,
  type BadgeVariant,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import { adminChargebacksService, type Chargeback } from '@/services/adminChargebacksService';
import {
  DecideChargebackDialog,
  canDecideByHand,
} from '@/components/admin/chargebacks/DecideChargebackDialog';
import { RecordMonnifyDisputeDialog } from '@/components/admin/chargebacks/RecordMonnifyDisputeDialog';

type View = 'OPEN' | 'DECIDED';

const PRODUCT: Record<string, string> = {
  RENT: 'Rent',
  ESCROW: 'Sale deposit',
  SHORTLET: 'Short-let stay',
  LAND: 'Land',
  FLEX: 'Flex instalment',
  DUES: 'Estate dues',
  VENDOR_TOP_UP: 'Vendor invoice top-up',
};

const DAY_MS = 86_400_000;

function deadline(c: Chargeback): { label: string; variant: BadgeVariant } {
  if (!c.dueAt) return { label: 'No deadline given', variant: 'neutral' };
  const left = new Date(c.dueAt).getTime() - Date.now();
  if (left < 0) return { label: 'Deadline passed', variant: 'danger' };
  const days = Math.floor(left / DAY_MS);
  if (days < 1) return { label: 'Due today', variant: 'danger' };
  return {
    label: `Due in ${days} day${days === 1 ? '' : 's'}`,
    variant: days <= 2 ? 'warning' : 'info',
  };
}

function moneyLine(c: Chargeback): string {
  if (c.frozenCount > 0) return 'Sureground still holds it: frozen until this is decided.';
  if (c.heldInBalanceOf)
    return "Already in the receiver's balance: kept back from their payouts until this is decided.";
  if (c.moneyAtOpen === 'RELEASED')
    return 'Already paid out to the receiver: if lost, recover it from them.';
  if (c.product === 'FLEX') return 'A Flex repayment to Sureground: nothing to hold back.';
  if (c.product === 'SHORTLET' || c.product === 'LAND')
    return 'Payouts skip it until this is decided.';
  return 'No Sureground record owns this payment.';
}

export default function ChargebacksPage() {
  const [view, setView] = useState<View>('OPEN');
  const queryClient = useQueryClient();
  const user = useAdminUser();
  const canAct = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const toast = useToast();
  const [recording, setRecording] = useState(false);
  const [deciding, setDeciding] = useState<Chargeback | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'chargebacks'] });
  const query = useQuery({
    queryKey: ['admin', 'chargebacks', view],
    queryFn: () => unwrap(adminChargebacksService.list(view)),
    refetchInterval: 60_000,
  });
  const rows = query.data ?? [];

  return (
    <>
      <PageHeader
        title="Chargebacks"
        description="Card payments a payer has asked their bank to reverse. Answer each on the payment company's dashboard with evidence (receipt, move-in or check-in confirmation, messages) before its deadline. The money is held back until it is decided. Monnify does not tell Sureground about disputes, so record each Monnify one here from its dashboard."
        actions={
          canAct ? (
            <Button variant="primary" onClick={() => setRecording(true)}>
              Record Monnify dispute
            </Button>
          ) : undefined
        }
      />

      <Tabs value={view} onValueChange={(v) => setView(v as View)}>
        <TabsList className="mb-4">
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="DECIDED">Decided</TabsTrigger>
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load chargebacks"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ShieldAlert}
          title={view === 'OPEN' ? 'No open chargebacks' : 'Nothing decided yet'}
          description={
            view === 'OPEN'
              ? 'No payer is disputing a card payment right now.'
              : 'Won and lost chargebacks appear here.'
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((c) => {
            const due = deadline(c);
            return (
              <Card key={c.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {formatCurrency(c.amount)} ·{' '}
                      {c.product ? (PRODUCT[c.product] ?? c.product) : 'Not recognised'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {c.provider === 'MONNIFY' ? 'Monnify' : 'Paystack'} dispute{' '}
                      {c.providerDisputeId} · payment {c.reference} · opened{' '}
                      {formatDate(c.createdAt)}
                    </p>
                  </div>
                  {c.status === 'OPEN' ? (
                    <Badge variant={due.variant}>{due.label}</Badge>
                  ) : (
                    <Badge variant={c.status === 'WON' ? 'success' : 'danger'}>
                      {c.status === 'WON' ? 'Won' : 'Lost'}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {c.status === 'OPEN' ? moneyLine(c) : c.resolution}
                </p>
                {c.status === 'OPEN' && c.dueAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Evidence due {formatDate(c.dueAt)} · {c.providerStatus.replace(/-/g, ' ')}
                  </p>
                )}
                {canDecideByHand(c) &&
                  (canAct ? (
                    <Button className="mt-4" variant="outline" onClick={() => setDeciding(c)}>
                      Record outcome
                    </Button>
                  ) : (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Recording the outcome needs the rent-finance approval permission.
                    </p>
                  ))}
              </Card>
            );
          })}
        </div>
      )}

      {recording && (
        <RecordMonnifyDisputeDialog
          onClose={() => setRecording(false)}
          onRecorded={() => {
            setRecording(false);
            refresh();
            toast.success('Dispute recorded. The money is held back until you record the outcome.');
          }}
        />
      )}
      {deciding && (
        <DecideChargebackDialog
          chargeback={deciding}
          onClose={() => setDeciding(null)}
          onDecided={(outcome) => {
            setDeciding(null);
            refresh();
            toast.success(
              outcome === 'WON'
                ? 'Recorded as won. The money stays with the receiver.'
                : 'Recorded as lost. It is taken back from the receiver’s balance.'
            );
          }}
        />
      )}
    </>
  );
}
