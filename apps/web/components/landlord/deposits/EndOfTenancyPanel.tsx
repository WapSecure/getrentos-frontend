'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  CardSkeleton,
  CurrencyInput,
  DatePicker,
  DocumentUpload,
  Field,
  Textarea,
  type PendingUpload,
} from '@sureground/ui';
import { Plus, Trash2 } from '@sureground/icons';
import {
  DEPOSIT_END_STAGE_LABELS,
  DEPOSIT_REFUND_STATUS_LABELS,
  SETTLED_HOW_TEXT,
  depositService,
  type DepositClaim,
  type DepositEndView,
} from '@/services/depositService';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';

const naira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
const today = () => new Date().toISOString().slice(0, 10);

interface DraftItem {
  key: string;
  reason: string;
  amount: number;
  files: PendingUpload[];
}

const newItem = (): DraftItem => ({ key: crypto.randomUUID(), reason: '', amount: 0, files: [] });

/** The claimed items with their evidence, read-only. */
export const ClaimItems = ({ claim }: { claim: DepositClaim }) => (
  <ul className="divide-y divide-border rounded-xl border border-border">
    {claim.items.map((item) => (
      <li key={item.id} className="p-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <p className="text-foreground">{item.reason}</p>
          <span className="shrink-0 font-medium text-foreground">{naira(item.amount)}</span>
        </div>
        {(item.evidence.length > 0 || item.inspectionId) && (
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
            {item.inspectionId && <span>Backed by the move-out inspection</span>}
          </p>
        )}
      </li>
    ))}
  </ul>
);

const ClaimForm = ({ view, onDone }: { view: DepositEndView; onDone: () => void }) => {
  const [items, setItems] = useState<DraftItem[]>([newItem()]);
  const total = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const update = (key: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));

  const submit = useMutation({
    mutationFn: async () => {
      const prepared = [];
      for (const item of items) {
        const keys: string[] = [];
        for (const upload of item.files) {
          const { key } = await unwrap(
            depositService.uploadClaimEvidence(view.holdId, upload.file)
          );
          keys.push(key);
        }
        prepared.push({ reason: item.reason.trim(), amount: item.amount, evidenceKeys: keys });
      }
      return unwrap(depositService.fileClaim(view.holdId, prepared));
    },
    onSuccess: onDone,
  });

  const ready =
    items.length > 0 &&
    items.every((i) => i.amount > 0 && i.reason.trim().length >= 10 && i.files.length > 0) &&
    total <= view.funded;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.key} className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Deduction {index + 1}</p>
            {items.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setItems((prev) => prev.filter((i) => i.key !== item.key))}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </Button>
            )}
          </div>
          <Field label="What it is for">
            <Textarea
              rows={2}
              value={item.reason}
              onChange={(e) => update(item.key, { reason: e.target.value })}
              placeholder="For example, broken kitchen door hinge, replaced"
            />
          </Field>
          <Field label="Amount">
            <CurrencyInput
              value={item.amount}
              onValueChange={(amount) => update(item.key, { amount })}
              placeholder="Amount"
            />
          </Field>
          <Field label="Evidence">
            <DocumentUpload
              value={item.files}
              onChange={(files) => update(item.key, { files })}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              maxSizeMB={10}
              hint="Photos, receipts or quotes. At least one."
              checkPhotoQuality
            />
          </Field>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => setItems((prev) => [...prev, newItem()])}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add another deduction
        </Button>
        <p className="text-sm text-muted-foreground">
          Total {naira(total)} of {naira(view.funded)}
        </p>
      </div>
      {total > view.funded && (
        <Alert variant="warning">
          The deductions add up to more than the deposit held by Sureground.
        </Alert>
      )}
      {submit.error && <Alert variant="danger">{(submit.error as Error).message}</Alert>}
      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={!ready}
          isLoading={submit.isPending}
          loadingText="Sending claim…"
          onClick={() => submit.mutate()}
        >
          Claim deductions
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        The tenant then has 7 days to accept or dispute. If they do not respond, the claim counts as
        accepted.
      </p>
    </div>
  );
};

/** D-6 end of tenancy, landlord side: record move-out, claim deductions within 14 days, follow the outcome. */
export const EndOfTenancyPanel = ({
  depositId,
  onChanged,
}: {
  depositId: string;
  onChanged?: () => void;
}) => {
  const queryClient = useQueryClient();
  const [moveOut, setMoveOut] = useState(today());
  const [claiming, setClaiming] = useState(false);
  const {
    data: view,
    isLoading,
    error,
  } = useQuery({
    queryKey: landlordKeys.depositEnd(depositId),
    queryFn: () => unwrap(depositService.endOfTenancy(depositId)),
  });
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: landlordKeys.depositEnd(depositId) });
    onChanged?.();
  };
  const recordMoveOut = useMutation({
    mutationFn: () =>
      unwrap(
        depositService.recordMoveOut(depositId, new Date(`${moveOut}T12:00:00+01:00`).toISOString())
      ),
    onSuccess: refresh,
  });

  if (isLoading) return <CardSkeleton lines={3} />;
  if (error || !view) return null;
  // A deposit Sureground never received is returned by whoever holds it, outside this flow.
  if (view.funded <= 0) return null;

  return (
    <section aria-label="End of tenancy" className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">End of tenancy</p>
        <Badge variant={view.endStage === 'SETTLED' ? 'success' : 'info'}>
          {DEPOSIT_END_STAGE_LABELS[view.endStage]}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {naira(view.funded)} is held by Sureground for this tenancy. It is never part of your
        balance until the deposit is settled.
      </p>

      {view.endStage === 'TENANCY' && (
        <div className="space-y-2">
          <Field label="Move-out date">
            <DatePicker
              value={moveOut}
              onChange={setMoveOut}
              max={today()}
              ariaLabel="Move-out date"
            />
          </Field>
          {recordMoveOut.error && (
            <Alert variant="danger">{(recordMoveOut.error as Error).message}</Alert>
          )}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              isLoading={recordMoveOut.isPending}
              disabled={!moveOut}
              onClick={() => recordMoveOut.mutate()}
            >
              Record move-out
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You then have 14 days to claim deductions. With no claim, the deposit is refunded to the
            tenant in full.
          </p>
        </div>
      )}

      {view.endStage === 'AWAITING_CLAIM' && view.claimBy && (
        <div className="space-y-3">
          <Alert variant="info">
            Claim any deductions by {day(view.claimBy)}, with a reason and evidence for each. After
            that the deposit is refunded to the tenant in full.
          </Alert>
          {claiming ? (
            <ClaimForm
              view={view}
              onDone={() => {
                setClaiming(false);
                refresh();
              }}
            />
          ) : (
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setClaiming(true)}>
                Claim deductions
              </Button>
            </div>
          )}
        </div>
      )}

      {view.claim && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Your claim: {naira(view.claim.amount)}
          </p>
          <ClaimItems claim={view.claim} />
          {view.endStage === 'AWAITING_TENANT' && (
            <p className="text-sm text-muted-foreground">
              The tenant has until {day(view.claim.respondBy)} to accept or dispute. No response
              counts as accepted.
            </p>
          )}
          {view.claim.disputeReason && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="font-medium text-foreground">The tenant disputes this:</span>{' '}
              {view.claim.disputeReason}
              {view.endStage === 'IN_MEDIATION' && (
                <p className="mt-1 text-muted-foreground">
                  Sureground will look at both sides and decide.
                </p>
              )}
            </div>
          )}
          {view.claim.resolution && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Sureground’s decision:</span>{' '}
              {view.claim.resolution}
            </p>
          )}
        </div>
      )}

      {view.settlement && (
        <Alert variant="success">
          {view.settlement.settledHow && SETTLED_HOW_TEXT[view.settlement.settledHow]}{' '}
          {naira(view.settlement.landlordAmount)} added to your balance,{' '}
          {naira(view.settlement.refundAmount)} refunded to the tenant
          {view.settlement.refundStatus &&
            ` (${DEPOSIT_REFUND_STATUS_LABELS[view.settlement.refundStatus].toLowerCase()})`}
          .
        </Alert>
      )}
    </section>
  );
};
