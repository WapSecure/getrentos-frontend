'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PiggyBank } from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  CurrencyInput,
  EmptyState,
  Field,
  ListSkeleton,
  PageErrorState,
  PageHeader,
  Tabs,
  TabsList,
  TabsTrigger,
  Textarea,
  useToast,
} from '@sureground/ui';
import { formatCurrency, formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminDepositsService,
  type AdminDeposit,
  type AdminDepositView,
  type DepositRefundStatus,
} from '@/services/adminDepositsService';

type Tab = AdminDepositView | 'OVER_CAP';

const TABS: { value: Tab; label: string }[] = [
  { value: 'IN_MEDIATION', label: 'Mediation' },
  { value: 'NEEDS_FINANCE', label: 'Refunds with finance' },
  { value: 'AWAITING_TENANT', label: 'Waiting for tenant' },
  { value: 'AWAITING_CLAIM', label: 'Claim window open' },
  { value: 'SETTLED', label: 'Settled' },
  { value: 'OVER_CAP', label: 'Over the cap' },
];

const REFUND: Record<
  DepositRefundStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' }
> = {
  NOT_NEEDED: { label: 'Nothing to refund', variant: 'info' },
  REFUNDED: { label: 'Refund sent', variant: 'success' },
  CONFIRMING: { label: 'Being confirmed', variant: 'warning' },
  NEEDS_FINANCE: { label: 'Needs finance', variant: 'danger' },
};

const DepositCard = ({
  deposit,
  canDecide,
  canRetry,
  onDecide,
  onRetry,
}: {
  deposit: AdminDeposit;
  canDecide: boolean;
  canRetry: boolean;
  onDecide: (d: AdminDeposit) => void;
  onRetry: (d: AdminDeposit) => void;
}) => {
  const claim = deposit.claim;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            {deposit.propertyTitle ?? 'Property'}
            {deposit.unitName ? ` · ${deposit.unitName}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {deposit.tenantName ?? 'Tenant'} · {formatCurrency(deposit.funded)} held by Sureground
            {deposit.moveOutAt && ` · moved out ${formatDate(deposit.moveOutAt)}`}
          </p>
        </div>
        {deposit.settlement?.refundStatus && (
          <Badge variant={REFUND[deposit.settlement.refundStatus].variant}>
            {REFUND[deposit.settlement.refundStatus].label}
          </Badge>
        )}
      </div>

      {claim && (
        <div className="mt-3 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Landlord claims {formatCurrency(claim.amount)}
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {claim.items.map((item) => (
              <li key={item.id} className="p-3">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-foreground">{item.reason}</span>
                  <span className="shrink-0 font-medium text-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                {(item.evidence.length > 0 || item.inspectionId) && (
                  <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
                    {item.evidence.map((file) => (
                      <a
                        key={file.url}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline-offset-2 hover:underline"
                      >
                        {file.name}
                      </a>
                    ))}
                    {item.inspectionId && (
                      <span className="text-muted-foreground">Move-out inspection linked</span>
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
          {claim.disputeReason && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="font-medium text-foreground">Tenant’s dispute:</span>{' '}
              {claim.disputeReason}
            </div>
          )}
          {claim.resolution && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Decision:</span> {claim.resolution}
            </p>
          )}
        </div>
      )}

      {deposit.settlement && (
        <p className="mt-3 text-sm text-muted-foreground">
          {formatCurrency(deposit.settlement.landlordAmount)} to the landlord,{' '}
          {formatCurrency(deposit.settlement.refundAmount)} to the tenant
          {deposit.settlement.settledAt && ` · settled ${formatDate(deposit.settlement.settledAt)}`}
        </p>
      )}
      {deposit.endStage === 'AWAITING_TENANT' && claim && (
        <p className="mt-3 text-sm text-muted-foreground">
          Tenant answers by {formatDate(claim.respondBy)}; silence counts as accepted.
        </p>
      )}
      {deposit.endStage === 'AWAITING_CLAIM' && deposit.claimBy && (
        <p className="mt-3 text-sm text-muted-foreground">
          Landlord may claim until {formatDate(deposit.claimBy)}; otherwise refunded in full.
        </p>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {deposit.endStage === 'IN_MEDIATION' && canDecide && (
          <Button variant="primary" onClick={() => onDecide(deposit)}>
            Decide
          </Button>
        )}
        {deposit.settlement?.refundStatus === 'NEEDS_FINANCE' && canRetry && (
          <Button variant="secondary" onClick={() => onRetry(deposit)}>
            Retry refund
          </Button>
        )}
      </div>
    </Card>
  );
};

const OverCapReport = () => {
  const query = useQuery({
    queryKey: ['admin', 'deposits', 'over-cap'],
    queryFn: () => unwrap(adminDepositsService.overCap()),
  });
  if (query.isLoading) return <ListSkeleton variant="cards" />;
  if (query.isError && !query.data)
    return (
      <PageErrorState
        title="Could not load the report"
        description={(query.error as Error).message}
        onRetry={() => query.refetch()}
      />
    );
  const rows = query.data?.rows ?? [];
  return (
    <div className="space-y-3">
      <Alert variant="info">
        Tenancies whose deposit is over the cap (one month’s rent on a monthly let, 10% of the
        annual rent on a yearly let). Read-only: these records are reported, never changed. The caps
        still need counsel’s confirmation.
      </Alert>
      {rows.length === 0 ? (
        <EmptyState icon={PiggyBank} title="No deposit is over the cap" />
      ) : (
        rows.map((r) => (
          <Card key={r.leaseId} className="p-4 text-sm">
            <p className="font-medium text-foreground">
              {r.propertyTitle} · {r.unitName}
              {r.tenantName ? ` · ${r.tenantName}` : ''}
            </p>
            <p className="mt-1 text-muted-foreground">
              Rent {formatCurrency(r.rentAmount)}{' '}
              {r.rentPeriod === 'MONTHLY' ? 'a month' : 'a year'} · cap {formatCurrency(r.cap)} ·
              lease deposit {formatCurrency(r.leaseDeposit ?? 0)} · recorded{' '}
              {formatCurrency(r.heldAmount ?? 0)} · charged {formatCurrency(r.charged)}
              {r.heldBySureground ? ' · held by Sureground' : ''} · lease{' '}
              {r.leaseStatus.toLowerCase()}
            </p>
          </Card>
        ))
      )}
      {query.data?.truncated && (
        <p className="text-xs text-muted-foreground">Showing the first {rows.length} rows.</p>
      )}
    </div>
  );
};

export default function CautionDepositsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const user = useAdminUser();
  const canDecide = hasAdminPermission(user?.roles, 'disputes.resolve');
  const canRetry = hasAdminPermission(user?.roles, 'rentfinance.approve');
  const canSeeCap = hasAdminPermission(user?.roles, 'rentfinance.view');
  const [tab, setTab] = useState<Tab>('IN_MEDIATION');
  const [deciding, setDeciding] = useState<AdminDeposit | null>(null);
  const [award, setAward] = useState(0);
  const [resolution, setResolution] = useState('');
  const [retryTarget, setRetryTarget] = useState<AdminDeposit | null>(null);

  const view = tab === 'OVER_CAP' ? null : tab;
  const query = useQuery({
    queryKey: ['admin', 'deposits', view],
    queryFn: () => unwrap(adminDepositsService.list(view!)),
    enabled: view !== null,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'deposits'] });

  const decide = useMutation({
    mutationFn: () =>
      unwrap(
        adminDepositsService.decide(deciding!.holdId, {
          landlordAmount: award,
          resolution: resolution.trim(),
        })
      ),
    onSuccess: (d) => {
      setDeciding(null);
      setAward(0);
      setResolution('');
      refresh();
      toast.success(
        `Decided: ${formatCurrency(d.settlement?.landlordAmount ?? 0)} to the landlord, ${formatCurrency(
          d.settlement?.refundAmount ?? 0
        )} refunded.`
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Could not record the decision.'),
  });
  const retry = useMutation({
    mutationFn: () => unwrap(adminDepositsService.retryRefund(retryTarget!.holdId)),
    onSuccess: (d) => {
      setRetryTarget(null);
      refresh();
      if (d.settlement?.refundStatus === 'REFUNDED') toast.success('Refund sent.');
      else toast.error('The refund still needs attention.');
    },
    onError: (e: Error) => toast.error(e.message || 'Could not retry the refund.'),
  });

  const items = query.data ?? [];
  const claimAmount = deciding?.claim?.amount ?? 0;

  return (
    <>
      <PageHeader
        title="Caution deposits"
        description="Deposits held by Sureground at the end of a tenancy. Decide disputed claims after looking at the evidence and both sides; the award goes to the landlord and the rest is refunded to the tenant."
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="mb-4 flex-wrap">
          {TABS.filter((t) => t.value !== 'OVER_CAP' || canSeeCap).map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === 'OVER_CAP' ? (
        <OverCapReport />
      ) : query.isLoading ? (
        <ListSkeleton variant="cards" />
      ) : query.isError && !query.data ? (
        <PageErrorState
          title="Could not load deposits"
          description={(query.error as Error).message}
          onRetry={() => query.refetch()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title={tab === 'IN_MEDIATION' ? 'No disputes to decide' : 'Nothing here'}
        />
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <DepositCard
              key={d.holdId}
              deposit={d}
              canDecide={canDecide}
              canRetry={canRetry}
              onDecide={(target) => {
                setDeciding(target);
                setAward(target.claim?.amount ?? 0);
              }}
              onRetry={setRetryTarget}
            />
          ))}
        </div>
      )}

      {deciding && (
        <Card className="mt-4 space-y-3 p-5">
          <p className="font-medium text-foreground">
            Decide: {deciding.propertyTitle ?? 'Property'}
          </p>
          <Field label="Award to the landlord">
            <CurrencyInput value={award} onValueChange={setAward} placeholder="Amount" />
          </Field>
          <p className="text-xs text-muted-foreground">
            From ₦0 to the {formatCurrency(claimAmount)} claimed. The tenant gets{' '}
            {formatCurrency(Math.max(0, deciding.funded - award))} back.
          </p>
          <Field label="Decision, explained to both sides">
            <Textarea
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="What the evidence showed and why"
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeciding(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={award < 0 || award > claimAmount || resolution.trim().length < 10}
              isLoading={decide.isPending}
              onClick={() => decide.mutate()}
            >
              Record decision
            </Button>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={retryTarget !== null}
        onOpenChange={(open) => !open && !retry.isPending && setRetryTarget(null)}
        title="Retry this deposit refund?"
        description={
          retryTarget
            ? `${formatCurrency(retryTarget.settlement?.refundAmount ?? 0)} owed to ${retryTarget.tenantName ?? 'the tenant'} is asked for again on the payments it came in through. A refund still being confirmed is never sent twice.`
            : ''
        }
        confirmLabel="Retry refund"
        isLoading={retry.isPending}
        onConfirm={() => retry.mutate()}
      />
    </>
  );
}
