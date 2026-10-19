'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Card, Select } from '@getrentos/ui';
import { UsersRound } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import {
  landRepresentativeKeys,
  landRepresentativeService,
  type LandDealRef,
} from '@/services/landRepresentativeService';

export const BUYER_REPRESENTATIVES_ROUTE = '/buyer/land/representatives';

/**
 * The two-person rule on one of the buyer's deals (§8.4): when on, a step that
 * releases money is confirmed only after the buyer and their representative
 * have both approved it. Switching it off takes effect after 48 hours.
 */
export const CoApprovalCard = ({
  deal,
  labelFor,
  onChanged,
}: {
  deal: LandDealRef;
  /** The step's label, from the deal's milestones. */
  labelFor: (key: string) => string;
  onChanged?: (message: string, variant: 'success' | 'error') => void;
}) => {
  const queryClient = useQueryClient();
  const key = landRepresentativeKeys.coApproval(deal);
  const [choice, setChoice] = useState('');
  const rule = useQuery({
    queryKey: key,
    queryFn: () => unwrap(landRepresentativeService.coApproval(deal)),
    retry: false,
  });
  const reps = useQuery({
    queryKey: landRepresentativeKeys.mine,
    queryFn: () => unwrap(landRepresentativeService.mine()),
    enabled: rule.data?.binding === false,
  });
  const act = useMutation({
    mutationFn: (what: 'enable' | 'disable' | 'keep') =>
      unwrap(
        what === 'enable'
          ? landRepresentativeService.enableCoApproval(deal, choice)
          : what === 'disable'
            ? landRepresentativeService.disableCoApproval(deal)
            : landRepresentativeService.keepCoApproval(deal)
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
            <p className="text-muted-foreground">
              Money is only released to the seller once you and{' '}
              <span className="font-medium text-foreground">
                {data.representative?.name ?? 'your representative'}
              </span>{' '}
              have both approved each step.
            </p>
            {(data.pending ?? []).length > 0 && (
              <ul className="space-y-1.5">
                {(data.pending ?? []).map((step) => (
                  <li
                    key={step.milestoneKey}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/50 px-3 py-2"
                  >
                    <span className="text-foreground">{labelFor(step.milestoneKey)}</span>
                    <span className="text-xs text-muted-foreground">
                      {step.buyerApproved ? 'You approved' : 'Waiting for you'} ·{' '}
                      {step.representativeApproved
                        ? 'representative approved'
                        : 'waiting for your representative'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {data.status === 'DISABLE_PENDING' ? (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-muted-foreground">
                  Switches off
                  {data.disableEffectiveAt ? ` on ${formatDate(data.disableEffectiveAt)}` : ''}. If
                  you did not ask for this, keep it on and contact GetRentos.
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
            <p className="text-muted-foreground">
              Buying from abroad? Require someone you trust in Nigeria to approve each step too,
              before any money is released to the seller.
            </p>
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
    </Card>
  );
};
