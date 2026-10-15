'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  NumberInput,
  PageErrorState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatCurrency, unwrap } from '@getrentos/shared';
import {
  adminPartnerCommercialsService,
  type PartnerCommercialRow,
} from '@/services/adminPartnerCommercialsService';

const KEY = ['admin', 'partner-commercials'] as const;

export default function PartnerCommercialsPage() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [payoutTarget, setPayoutTarget] = useState<PartnerCommercialRow | null>(null);

  const {
    data: partners = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: KEY,
    queryFn: () => unwrap(adminPartnerCommercialsService.list()),
  });

  const save = useMutation({
    mutationFn: ({ organizationId, pct }: { organizationId: string; pct: number }) =>
      unwrap(adminPartnerCommercialsService.setConfig(organizationId, pct)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      setToast({ message: 'Partner share updated.', variant: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message || 'Unable to save.', variant: 'error' }),
  });

  const payout = useMutation({
    mutationFn: (organizationId: string) =>
      unwrap(adminPartnerCommercialsService.requestPayout(organizationId)),
    onSuccess: (p) => {
      setPayoutTarget(null);
      queryClient.invalidateQueries({ queryKey: KEY });
      setToast({
        message:
          p.status === 'SUCCESS'
            ? `Paid ${formatCurrency(p.amount)} to the partner.`
            : `Payout of ${formatCurrency(p.amount)} is ${p.status.toLowerCase()}.`,
        variant: p.status === 'FAILED' ? 'error' : 'success',
      });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Unable to pay out.', variant: 'error' }),
  });

  const draftFor = (p: PartnerCommercialRow) =>
    drafts[p.organizationId] ?? String(p.partnerSharePct);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Partner commercials
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          For GetRentos-managed engagements handed to a delivery partner, set the partner&rsquo;s
          share of the management fee. The platform keeps the rest. The split is recorded when each
          owner statement is issued.
        </p>
      </div>

      {isError ? (
        <PageErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary/50" />
      ) : partners.length === 0 ? (
        <Card className="p-2">
          <EmptyState
            icon={Handshake}
            title="No delivery partners yet"
            description="When a GetRentos-managed engagement is handed to a partner firm, it appears here to set its commercials."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {partners.map((p) => {
            const draft = draftFor(p);
            const pct = Number(draft);
            const dirty = pct !== p.partnerSharePct;
            const valid = Number.isInteger(pct) && pct >= 0 && pct <= 100;
            return (
              <Card key={p.organizationId} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{p.name}</h3>
                      <Badge variant="neutral">
                        {p.activeMandates} active engagement{p.activeMandates === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Accrued to partner:{' '}
                      <span className="font-medium text-foreground">
                        {formatCurrency(p.earnedPartnerShare)}
                      </span>{' '}
                      across {p.earnedCount} statement{p.earnedCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-32">
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Partner share %
                      </label>
                      <NumberInput
                        min={0}
                        max={100}
                        value={draft}
                        onValueChange={(v) => setDrafts((d) => ({ ...d, [p.organizationId]: v }))}
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={!dirty || !valid || save.isPending}
                      onClick={() => save.mutate({ organizationId: p.organizationId, pct })}
                    >
                      Save
                    </Button>
                    {p.earnedPartnerShare > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={payout.isPending}
                        onClick={() => setPayoutTarget(p)}
                      >
                        Pay out {formatCurrency(p.earnedPartnerShare)}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <ConfirmDialog
        open={payoutTarget !== null}
        onOpenChange={(open) => !open && setPayoutTarget(null)}
        title="Pay this partner?"
        description={
          payoutTarget
            ? `${formatCurrency(payoutTarget.earnedPartnerShare)} in accrued earnings will be sent to ${payoutTarget.name}. The server will exclude statements already included in another payout.`
            : ''
        }
        confirmLabel="Send payout"
        isLoading={payout.isPending}
        onConfirm={() => payoutTarget && payout.mutate(payoutTarget.organizationId)}
      />
    </div>
  );
}
