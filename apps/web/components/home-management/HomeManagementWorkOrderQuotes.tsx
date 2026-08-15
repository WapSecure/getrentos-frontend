'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ClipboardList,
  Landmark,
  Plus,
  UserRound,
  XCircle,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { DatePicker } from '@/components/ui/DatePicker';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Toast, type ToastVariant } from '@/components/ui/Toast';
import { unwrap } from '@/lib/apiHelpers';
import { getStoredUser } from '@/lib/authStorage';
import { formatCurrency, formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type CreateHomeManagementWorkOrderQuoteInput,
  type HomeManagementVendor,
  type HomeManagementWorkOrder,
  type HomeManagementWorkOrderQuote,
} from '@/services/homeManagementService';

type QuoteRole = 'owner' | 'landlord';

type QuoteForm = {
  vendorId: string;
  amount: string;
  scopeOfWork: string;
  validUntil: string;
};

type QuoteActionDialog =
  | { action: 'approve'; quote: HomeManagementWorkOrderQuote }
  | { action: 'reject'; quote: HomeManagementWorkOrderQuote }
  | null;

const initialQuoteForm: QuoteForm = {
  vendorId: '',
  amount: '',
  scopeOfWork: '',
  validUntil: '',
};

const quoteStatusMeta: Record<
  HomeManagementWorkOrderQuote['status'],
  { label: string; variant: BadgeVariant }
> = {
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  APPROVED: { label: 'Approved', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
};

const isWorkOrderOpen = (workOrder: HomeManagementWorkOrder) =>
  !['RESOLVED', 'CANCELLED'].includes(workOrder.status);

const timestamp = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const isQuoteExpired = (quote: HomeManagementWorkOrderQuote) => {
  const validUntil = timestamp(quote.validUntil);
  return validUntil !== null && validUntil <= Date.now();
};

const formatOptionalDate = (value?: string | null) =>
  timestamp(value) === null || !value ? 'No expiry recorded' : formatDate(value);

const quoteVendorLabel = (quote: HomeManagementWorkOrderQuote) =>
  quote.vendor?.name?.trim() ||
  (quote.vendorId ? 'Vendor record unavailable' : 'Unlinked estimate');

const quoteActorLabel = (quote: HomeManagementWorkOrderQuote) =>
  quote.submittedBy?.legalName?.trim() || 'An authorised operator';

const toValidUntilIso = (dateValue: string) => {
  if (!dateValue) return undefined;
  const parsed = new Date(`${dateValue}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

interface HomeManagementWorkOrderQuotesProps {
  role: QuoteRole;
  workOrder: HomeManagementWorkOrder;
  vendors?: HomeManagementVendor[];
}

/**
 * Keeps quote selection and its audit-sensitive approval flow separate from
 * the broader work-order lifecycle controls.
 */
export function HomeManagementWorkOrderQuotes({
  role,
  workOrder,
  vendors = [],
}: HomeManagementWorkOrderQuotesProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<QuoteForm>(initialQuoteForm);
  const [actionDialog, setActionDialog] = useState<QuoteActionDialog>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentUserId] = useState<string | null | undefined>(
    () => getStoredUser<{ id?: string }>()?.id ?? null
  );
  const [now] = useState(() => Date.now());
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const quotesQuery = useQuery({
    enabled: isExpanded,
    queryKey: homeManagementKeys.workOrderQuotes(workOrder.id),
    queryFn: () => unwrap(homeManagementService.listWorkOrderQuotes(workOrder.id)),
  });

  const quotes = useMemo(() => quotesQuery.data ?? [], [quotesQuery.data]);
  const amount = Number(form.amount);
  const formExpiry = toValidUntilIso(form.validUntil);
  const validAmount = Number.isInteger(amount) && amount >= 1;
  const validScope = form.scopeOfWork.trim().length >= 3;
  const validExpiry = !form.validUntil || Boolean(formExpiry && timestamp(formExpiry)! > now);
  const canCreateQuote = isWorkOrderOpen(workOrder) && validAmount && validScope && validExpiry;
  const workOrderCreatedByCurrentUser = Boolean(
    currentUserId && workOrder.createdById && currentUserId === workOrder.createdById
  );
  const approvalAuthorityIsLoading = Boolean(workOrder.createdById) && currentUserId === undefined;
  const workOrderNeedsQuoteApproval =
    isWorkOrderOpen(workOrder) && workOrder.approvalRequired && !workOrder.approvedAt;

  const invalidateQuoteViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.workOrderQuotes(workOrder.id) }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.workOrders }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['home-management', 'timeline'] }),
    ]);
  };

  const createQuote = useMutation<
    HomeManagementWorkOrderQuote,
    Error,
    CreateHomeManagementWorkOrderQuoteInput
  >({
    mutationFn: (input) => unwrap(homeManagementService.createWorkOrderQuote(workOrder.id, input)),
    onSuccess: async () => {
      await invalidateQuoteViews();
      setForm(initialQuoteForm);
      setIsCreateOpen(false);
      setToast({
        message: 'Vendor quote recorded in the work-order audit trail.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setToast({ message: error.message || 'Unable to record this quote.', variant: 'error' });
    },
  });

  const approveQuote = useMutation<HomeManagementWorkOrderQuote, Error, { quoteId: string }>({
    mutationFn: ({ quoteId }) =>
      unwrap(homeManagementService.approveWorkOrderQuote(workOrder.id, quoteId)),
    onSuccess: async () => {
      await invalidateQuoteViews();
      setActionDialog(null);
      setToast({
        message: 'Quote selected, budget approved, and vendor assignment recorded.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setToast({ message: error.message || 'Unable to approve this quote.', variant: 'error' });
    },
  });

  const rejectQuote = useMutation<
    HomeManagementWorkOrderQuote,
    Error,
    { quoteId: string; reason: string }
  >({
    mutationFn: ({ quoteId, reason }) =>
      unwrap(homeManagementService.rejectWorkOrderQuote(workOrder.id, quoteId, { reason })),
    onSuccess: async () => {
      await invalidateQuoteViews();
      setActionDialog(null);
      setRejectionReason('');
      setToast({ message: 'Quote rejected and the decision was recorded.', variant: 'success' });
    },
    onError: (error) => {
      setToast({ message: error.message || 'Unable to reject this quote.', variant: 'error' });
    },
  });

  const sortedQuotes = useMemo(
    () =>
      [...quotes].sort((left, right) => {
        const statusWeight: Record<HomeManagementWorkOrderQuote['status'], number> = {
          APPROVED: 0,
          SUBMITTED: 1,
          REJECTED: 2,
        };
        const statusDifference = statusWeight[left.status] - statusWeight[right.status];
        if (statusDifference !== 0) return statusDifference;
        return (timestamp(right.submittedAt) ?? 0) - (timestamp(left.submittedAt) ?? 0);
      }),
    [quotes]
  );

  const closeCreateDialog = () => {
    if (!createQuote.isPending) setIsCreateOpen(false);
  };

  const openActionDialog = (
    action: Exclude<QuoteActionDialog, null>['action'],
    quote: HomeManagementWorkOrderQuote
  ) => {
    setRejectionReason('');
    setActionDialog({ action, quote });
  };

  const closeActionDialog = () => {
    if (!approveQuote.isPending && !rejectQuote.isPending) {
      setActionDialog(null);
      setRejectionReason('');
    }
  };

  const submitQuote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateQuote) return;

    createQuote.mutate({
      vendorId: role === 'landlord' && form.vendorId ? form.vendorId : undefined,
      amount,
      scopeOfWork: form.scopeOfWork.trim(),
      validUntil: form.validUntil ? formExpiry : undefined,
    });
  };

  const submitAction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!actionDialog) return;

    if (actionDialog.action === 'approve') {
      approveQuote.mutate({ quoteId: actionDialog.quote.id });
      return;
    }

    const reason = rejectionReason.trim();
    if (reason.length < 3) return;
    rejectQuote.mutate({ quoteId: actionDialog.quote.id, reason });
  };

  const actionDialogIsPending =
    (actionDialog?.action === 'approve' && approveQuote.isPending) ||
    (actionDialog?.action === 'reject' && rejectQuote.isPending);

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Vendor quotes</p>
            {isExpanded && !quotesQuery.isLoading && (
              <Badge variant="neutral">{quotes.length}</Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Compare auditable vendor estimates before a controlled spend is selected.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isExpanded && isWorkOrderOpen(workOrder) && (
            <Button
              size="sm"
              rounded="md"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setForm(initialQuoteForm);
                setIsCreateOpen(true);
              }}
            >
              Record quote
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            rounded="md"
            icon={
              isExpanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )
            }
            iconPosition="right"
            onClick={() => setIsExpanded((current) => !current)}
          >
            {isExpanded ? 'Hide quotes' : 'View quotes'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4">
          {quotesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : quotesQuery.isError ? (
            <EmptyState
              className="border-dashed bg-card p-6"
              icon={CircleAlert}
              title="Quotes could not be loaded"
              description="Try again to view the current vendor decision record."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  rounded="md"
                  onClick={() => void quotesQuery.refetch()}
                >
                  Retry
                </Button>
              }
            />
          ) : sortedQuotes.length === 0 ? (
            <EmptyState
              className="border-dashed bg-card p-6"
              icon={ClipboardList}
              title="No vendor quotes recorded"
              description={
                isWorkOrderOpen(workOrder)
                  ? 'Record the first estimate so cost, scope, expiry, and the final decision remain auditable.'
                  : 'This closed work order has no recorded vendor quote.'
              }
              action={
                isWorkOrderOpen(workOrder) ? (
                  <Button
                    size="sm"
                    rounded="md"
                    onClick={() => {
                      setForm(initialQuoteForm);
                      setIsCreateOpen(true);
                    }}
                  >
                    Record quote
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {sortedQuotes.map((quote) => {
                const status = quoteStatusMeta[quote.status] ?? quoteStatusMeta.SUBMITTED;
                const expired = isQuoteExpired(quote);
                const quoteHasVendor = Boolean(quote.vendorId);
                const canSelectQuote =
                  quote.status === 'SUBMITTED' &&
                  workOrderNeedsQuoteApproval &&
                  quoteHasVendor &&
                  !expired &&
                  !workOrderCreatedByCurrentUser &&
                  currentUserId !== null &&
                  currentUserId !== undefined;
                const canRejectQuote = quote.status === 'SUBMITTED' && isWorkOrderOpen(workOrder);
                const quoteMutationPending =
                  (approveQuote.isPending && approveQuote.variables?.quoteId === quote.id) ||
                  (rejectQuote.isPending && rejectQuote.variables?.quoteId === quote.id);

                return (
                  <article key={quote.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{quoteVendorLabel(quote)}</p>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          {expired && quote.status === 'SUBMITTED' && (
                            <Badge variant="warning">Expired</Badge>
                          )}
                        </div>
                        {quote.vendor?.serviceType && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {quote.vendor.serviceType}
                          </p>
                        )}
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {quote.scopeOfWork || 'No scope of work was provided.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5" />
                            {formatCurrency(Number.isFinite(quote.amount) ? quote.amount : 0)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            {quote.validUntil
                              ? `Valid until ${formatOptionalDate(quote.validUntil)}`
                              : 'No expiry recorded'}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <UserRound className="h-3.5 w-3.5" />
                            Recorded by {quoteActorLabel(quote)}
                          </span>
                        </div>
                        {quote.status === 'REJECTED' && quote.rejectionReason && (
                          <p className="mt-3 rounded-xl bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                            Rejection reason: {quote.rejectionReason}
                          </p>
                        )}
                        {quote.status === 'APPROVED' && quote.approvedBy?.legalName && (
                          <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-800 dark:text-emerald-300">
                            Selected by {quote.approvedBy.legalName}
                            {quote.approvedAt ? ` on ${formatOptionalDate(quote.approvedAt)}` : ''}.
                          </p>
                        )}
                      </div>

                      {quote.status === 'SUBMITTED' && (
                        <div className="w-full shrink-0 space-y-2 lg:w-52">
                          {approvalAuthorityIsLoading ? (
                            <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                              Checking approval authority…
                            </p>
                          ) : workOrderCreatedByCurrentUser ? (
                            <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                              A different authorised operator must select a quote for work you
                              created.
                            </p>
                          ) : !workOrderNeedsQuoteApproval ? (
                            <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                              This work order does not currently need quote approval.
                            </p>
                          ) : !quoteHasVendor ? (
                            <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                              Link a vendor to a new quote before it can be selected for work.
                            </p>
                          ) : expired ? (
                            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
                              This quote has expired and cannot be approved.
                            </p>
                          ) : currentUserId === null ? (
                            <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                              Refresh your session to confirm approval authority.
                            </p>
                          ) : null}
                          <Button
                            size="sm"
                            rounded="md"
                            fullWidth
                            icon={<BadgeCheck className="h-3.5 w-3.5" />}
                            disabled={!canSelectQuote || quoteMutationPending}
                            isLoading={
                              approveQuote.isPending && approveQuote.variables?.quoteId === quote.id
                            }
                            onClick={() => openActionDialog('approve', quote)}
                          >
                            Select quote
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            rounded="md"
                            fullWidth
                            icon={<XCircle className="h-3.5 w-3.5" />}
                            disabled={!canRejectQuote || quoteMutationPending}
                            onClick={() => openActionDialog('reject', quote)}
                          >
                            Reject quote
                          </Button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (open) setIsCreateOpen(true);
          else closeCreateDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <form onSubmit={submitQuote} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Record vendor quote
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
              Capture the vendor&apos;s proposed cost and scope for “{workOrder.issueTitle}”. The
              recorded operator and any final decision remain in the audit trail.
            </DialogDescription>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {role === 'landlord' && (
                <Field
                  className="sm:col-span-2"
                  label="Vendor"
                  hint={
                    vendors.length > 0
                      ? 'Optional, but a linked vendor is required before this quote can be selected.'
                      : 'No active vendors are available. You can record an unlinked estimate, but it cannot be approved until a vendor is linked to a new quote.'
                  }
                >
                  <Select
                    ariaLabel="Quote vendor"
                    value={form.vendorId}
                    disabled={createQuote.isPending || vendors.length === 0}
                    placeholder={vendors.length > 0 ? 'Select a vendor' : 'No active vendors'}
                    onValueChange={(vendorId) => setForm((current) => ({ ...current, vendorId }))}
                    options={[
                      { value: '', label: 'Record an unlinked estimate' },
                      ...vendors.map((vendor) => ({
                        value: vendor.id,
                        label: vendor.serviceType
                          ? `${vendor.name} · ${vendor.serviceType}`
                          : vendor.name,
                      })),
                    ]}
                  />
                </Field>
              )}

              {role === 'owner' && (
                <p className="sm:col-span-2 rounded-xl bg-secondary/70 px-3 py-2 text-xs leading-5 text-muted-foreground">
                  This quote will be recorded as an unlinked estimate. A landlord vendor directory
                  entry is required before a quote can be selected to assign work.
                </p>
              )}

              <Field
                label="Quoted amount"
                htmlFor={`home-work-order-quote-amount-${workOrder.id}`}
                required
                error={
                  form.amount && !validAmount ? 'Enter a whole amount of at least one.' : undefined
                }
              >
                <Input
                  id={`home-work-order-quote-amount-${workOrder.id}`}
                  autoFocus
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  leadingIcon={<span className="text-sm">₦</span>}
                  value={form.amount}
                  disabled={createQuote.isPending}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  placeholder="e.g. 85000"
                />
              </Field>

              <Field
                label="Valid until"
                hint="Optional. A quote must still be valid when selected."
                error={form.validUntil && !validExpiry ? 'Choose a future date.' : undefined}
              >
                <DatePicker
                  min={new Date().toISOString().slice(0, 10)}
                  value={form.validUntil}
                  disabled={createQuote.isPending}
                  onChange={(value) => setForm((current) => ({ ...current, validUntil: value }))}
                />
              </Field>

              <Field
                className="sm:col-span-2"
                label="Scope of work"
                htmlFor={`home-work-order-quote-scope-${workOrder.id}`}
                required
                hint="Include deliverables, materials, exclusions, or access requirements."
                error={
                  form.scopeOfWork && !validScope ? 'Use at least three characters.' : undefined
                }
              >
                <Textarea
                  id={`home-work-order-quote-scope-${workOrder.id}`}
                  maxLength={5000}
                  value={form.scopeOfWork}
                  disabled={createQuote.isPending}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, scopeOfWork: event.target.value }))
                  }
                  placeholder="e.g. Replace the failed pump capacitor, test the unit, and include a 90-day workmanship warranty."
                />
              </Field>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                disabled={createQuote.isPending}
                onClick={closeCreateDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={createQuote.isPending}
                disabled={!canCreateQuote}
              >
                Record quote
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(actionDialog)}
        onOpenChange={(open) => {
          if (!open) closeActionDialog();
        }}
      >
        <DialogContent className="max-w-lg" showClose={!actionDialogIsPending}>
          {actionDialog && (
            <form onSubmit={submitAction} className="p-6">
              <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                {actionDialog.action === 'approve' ? 'Select this quote' : 'Reject this quote'}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                {actionDialog.action === 'approve'
                  ? `Select ${quoteVendorLabel(actionDialog.quote)} at ${formatCurrency(actionDialog.quote.amount)}. This assigns the vendor, approves the work-order spend, and rejects other submitted quotes.`
                  : `Decline the ${formatCurrency(actionDialog.quote.amount)} quote from ${quoteVendorLabel(actionDialog.quote)}. Your reason will be preserved in the decision record.`}
              </DialogDescription>

              {actionDialog.action === 'approve' ? (
                <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">
                  <p className="font-medium text-foreground">Scope of work</p>
                  <p className="mt-1 whitespace-pre-wrap">{actionDialog.quote.scopeOfWork}</p>
                </div>
              ) : (
                <div className="mt-6">
                  <Field
                    label="Rejection reason"
                    htmlFor={`home-work-order-quote-rejection-${actionDialog.quote.id}`}
                    required
                    hint="At least three characters. The vendor decision record cannot be edited later."
                    error={
                      rejectionReason && rejectionReason.trim().length < 3
                        ? 'Use at least three characters.'
                        : undefined
                    }
                  >
                    <Textarea
                      id={`home-work-order-quote-rejection-${actionDialog.quote.id}`}
                      autoFocus
                      maxLength={1000}
                      value={rejectionReason}
                      disabled={rejectQuote.isPending}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="e.g. The scope does not include the required safety inspection."
                    />
                  </Field>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  rounded="md"
                  disabled={actionDialogIsPending}
                  onClick={closeActionDialog}
                >
                  Keep quote
                </Button>
                <Button
                  type="submit"
                  variant={actionDialog.action === 'approve' ? 'primary' : 'danger'}
                  rounded="md"
                  isLoading={actionDialogIsPending}
                  disabled={actionDialog.action === 'reject' && rejectionReason.trim().length < 3}
                >
                  {actionDialog.action === 'approve' ? 'Select quote' : 'Reject quote'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
