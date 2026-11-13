'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, ConfirmDialog, Select } from '@sureground/ui';
import { UsersRound } from '@sureground/icons';
import { unwrap } from '@/lib/apiHelpers';
import { PURCHASE_ROUTES } from '@/lib/constants/purchaseRoutes';
import { formatDate } from '@/lib/format';
import {
  approvalOutcomeMessage,
  coApprovalConfirmDescription,
  HANDOVER_NOT_DELIVERED_NOTE,
  pendingApprovalStatus,
  stepAwaitingDelivery,
} from '@sureground/shared';
import type { CoApprovalPendingStep } from '@/types/landRepresentative';
import {
  representativeKeys,
  representativeService,
  type LandDealRef,
} from '@/services/representativeService';

export const BUYER_REPRESENTATIVES_ROUTE = PURCHASE_ROUTES.BUYER_REPRESENTATIVES;

const COPY = {
  // Plot purchases and land resales: each step can release money held for the deal.
  steps: {
    on: 'Money is only released to the seller once you and',
    onTail: 'have both approved each step.',
    off: 'Buying from abroad? Require someone you trust in Nigeria to approve each step too, before any money is released to the seller.',
    representative:
      'The buyer asked that money is only released with your approval too. Approve a step only once you have seen the document or been on site yourself.',
  },
  // Built homes (D11): Sureground holds only the deposit, never the rest of the price.
  deposit: {
    on: 'The deposit held under Payment Protection is only released to the seller once you and',
    onTail: 'have both approved the handover. Sureground does not hold the rest of the price.',
    off: 'Buying from abroad? Require someone you trust in Nigeria to approve the handover too, before the deposit held under Payment Protection is released to the seller.',
    representative:
      'The buyer asked that the deposit is only released with your approval too. Approve only once you have seen the keys handed over or the document yourself.',
  },
} as const;

/**
 * Two-person approval on a deal. The buyer turns it on or off (switching off takes 48 hours); the
 * representative it names gives the second approval here. A step needing both is confirmed only
 * once both have approved.
 */
export const CoApprovalCard = ({
  deal,
  labelFor,
  onChanged,
  viewer = 'buyer',
  moneyScope = 'steps',
  onApproved,
}: {
  deal: LandDealRef;
  labelFor: (key: string) => string;
  onChanged?: (message: string, variant: 'success' | 'error') => void;
  viewer?: 'buyer' | 'representative';
  /** `deposit` for a built home, where only the held deposit is released. */
  moneyScope?: 'steps' | 'deposit';
  /** After the representative approves, so the caller can refresh what depends on it. */
  onApproved?: () => void;
}) => {
  const queryClient = useQueryClient();
  const isBuyer = viewer === 'buyer';
  const key = isBuyer
    ? representativeKeys.coApproval(deal)
    : ([...representativeKeys.coApproval(deal), 'representative'] as const);
  const copy = COPY[moneyScope];
  const [choice, setChoice] = useState('');
  const [approving, setApproving] = useState<CoApprovalPendingStep | null>(null);
  const rule = useQuery({
    queryKey: key,
    queryFn: () =>
      unwrap(
        isBuyer
          ? representativeService.coApproval(deal)
          : representativeService.representativeCoApproval(deal)
      ),
    retry: false,
  });
  const reps = useQuery({
    queryKey: representativeKeys.mine,
    queryFn: () => unwrap(representativeService.mine()),
    enabled: isBuyer && rule.data?.binding === false,
  });
  const approve = useMutation({
    mutationFn: async (step: CoApprovalPendingStep): Promise<string> => {
      // A built home's handover approval also stands for the deposit release, which has its own route.
      if (step.releasesDeposit && 'transactionId' in deal) {
        const result = await unwrap(
          representativeService.approveDepositRelease(deal.transactionId)
        );
        return approvalOutcomeMessage(result.outcome);
      }
      await unwrap(representativeService.approveStep(deal, step.milestoneKey));
      return 'Your approval is recorded.';
    },
    onSuccess: (message) => {
      setApproving(null);
      void rule.refetch();
      onApproved?.();
      onChanged?.(message, 'success');
    },
    onError: (reason: Error) => onChanged?.(reason.message, 'error'),
  });
  const act = useMutation({
    mutationFn: (what: 'enable' | 'disable' | 'keep') =>
      unwrap(
        what === 'enable'
          ? representativeService.enableCoApproval(deal, choice)
          : what === 'disable'
            ? representativeService.disableCoApproval(deal)
            : representativeService.keepCoApproval(deal)
      ),
    onSuccess: (next, what) => {
      queryClient.setQueryData(key, next);
      onChanged?.(
        what === 'enable'
          ? 'Two-person approval is on.'
          : what === 'disable'
            ? 'Two-person approval will switch off in 48 hours.'
            : 'Two-person approval stays on.',
        'success'
      );
    },
    onError: (reason: Error) => onChanged?.(reason.message, 'error'),
  });

  if (rule.isLoading || rule.isError || !rule.data) return null;
  const data = rule.data;
  // A representative who does not hold the rule has nothing to approve here.
  if (!isBuyer && !data.binding) return null;
  const stepLabel = (step: CoApprovalPendingStep) =>
    step.releasesDeposit
      ? `${labelFor(step.milestoneKey)} (approves the deposit release)`
      : labelFor(step.milestoneKey);
  const approvers = (reps.data ?? []).filter(
    (a) => a.status === 'ACTIVE' && a.scopes.includes('CO_APPROVE')
  );

  return (
    <Card className="p-5">
      <section aria-labelledby="co-approval-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="co-approval-heading"
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <UsersRound className="h-4 w-4 text-primary" aria-hidden /> Two-person approval
          </h2>
          {data.binding && (
            <Badge variant={data.status === 'DISABLE_PENDING' ? 'warning' : 'success'}>
              {data.status === 'DISABLE_PENDING' ? 'Switching off' : 'On'}
            </Badge>
          )}
        </div>

        {data.binding ? (
          <div className="mt-2 space-y-3 text-sm">
            {isBuyer ? (
              <p className="text-muted-foreground">
                {copy.on}{' '}
                <span className="font-medium text-foreground">
                  {data.representative?.name ?? 'your representative'}
                </span>{' '}
                {copy.onTail}
              </p>
            ) : (
              <p className="text-muted-foreground">{copy.representative}</p>
            )}
            {(data.pending ?? []).length > 0 && (
              <ul className="space-y-1.5">
                {(data.pending ?? []).map((step) => {
                  const awaitingDelivery = stepAwaitingDelivery(step);
                  const noteId = `co-approval-note-${step.milestoneKey}`;
                  return (
                    <li
                      key={step.milestoneKey}
                      className="space-y-1 rounded-xl bg-secondary/50 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-foreground">{stepLabel(step)}</span>
                        <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {pendingApprovalStatus(step, viewer)}
                          {!isBuyer && !step.representativeApproved && (
                            <Button
                              size="sm"
                              disabled={awaitingDelivery}
                              aria-describedby={awaitingDelivery ? noteId : undefined}
                              onClick={() => setApproving(step)}
                            >
                              Approve
                            </Button>
                          )}
                        </span>
                      </div>
                      {awaitingDelivery && (
                        <p id={noteId} className="text-xs text-muted-foreground">
                          {HANDOVER_NOT_DELIVERED_NOTE}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {!isBuyer ? null : data.status === 'DISABLE_PENDING' ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-muted-foreground">
                  Switches off
                  {data.disableEffectiveAt ? ` on ${formatDate(data.disableEffectiveAt)}` : ''}. If
                  you did not ask for this, keep it on and contact Sureground.
                </p>
                <Button size="sm" onClick={() => act.mutate('keep')} isLoading={act.isPending}>
                  Keep it on
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => act.mutate('disable')}
                isLoading={act.isPending}
              >
                Switch off (takes 48 hours)
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-2 space-y-3 text-sm">
            <p className="text-muted-foreground">{copy.off}</p>
            {approvers.length === 0 ? (
              <p className="text-muted-foreground">
                First{' '}
                <Link
                  href={BUYER_REPRESENTATIVES_ROUTE}
                  className="font-medium text-primary hover:underline"
                >
                  appoint a representative
                </Link>{' '}
                who may approve payments.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-64">
                  <Select
                    value={choice}
                    onValueChange={setChoice}
                    ariaLabel="Representative"
                    placeholder="Choose a representative"
                    options={approvers.map((a) => ({
                      value: a.id,
                      label: a.name ?? a.email ?? a.id,
                    }))}
                  />
                </div>
                <Button
                  size="sm"
                  disabled={!choice || act.isPending}
                  isLoading={act.isPending}
                  onClick={() => act.mutate('enable')}
                >
                  Turn on
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
      <ConfirmDialog
        open={approving !== null}
        onOpenChange={(open) => !open && setApproving(null)}
        title="Give your approval?"
        description={
          approving
            ? coApprovalConfirmDescription({
                viewer,
                stepLabel: stepLabel(approving),
                releasesDeposit: approving.releasesDeposit,
                representativeName: data.representative?.name,
              })
            : ''
        }
        confirmLabel="Approve"
        isLoading={approve.isPending}
        onConfirm={() =>
          approving ? approve.mutateAsync(approving).catch(() => undefined) : undefined
        }
      />
    </Card>
  );
};
