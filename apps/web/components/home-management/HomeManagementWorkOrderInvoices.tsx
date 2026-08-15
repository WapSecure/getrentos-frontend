'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Ban,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  ClipboardList,
  FileText,
  Landmark,
  Plus,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Toast, type ToastVariant } from '@/components/ui/Toast';
import { unwrap } from '@/lib/apiHelpers';
import { getStoredUser } from '@/lib/authStorage';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type CreateHomeManagementWorkOrderInvoiceInput,
  type HomeManagementWorkOrder,
  type HomeManagementWorkOrderInvoice,
  type HomeManagementWorkOrderInvoiceStatus,
} from '@/services/homeManagementService';

type InvoiceLineItemForm = {
  id: string;
  description: string;
  quantity: string;
  unitAmount: string;
};

type InvoiceForm = {
  invoiceNumber: string;
  completionNote: string;
  lineItems: InvoiceLineItemForm[];
};

type InvoiceAction = 'submit' | 'approve' | 'reject' | 'void';

type InvoiceActionDialog = {
  action: InvoiceAction;
  invoice: HomeManagementWorkOrderInvoice;
} | null;

const DEFAULT_INVOICE_CURRENCY = 'NGN';

const invoiceStatusMeta: Record<
  HomeManagementWorkOrderInvoiceStatus,
  { label: string; variant: BadgeVariant }
> = {
  DRAFT: { label: 'Draft', variant: 'neutral' },
  SUBMITTED: { label: 'Submitted', variant: 'info' },
  APPROVED: { label: 'Ready for finance review', variant: 'success' },
  REJECTED: { label: 'Rejected', variant: 'danger' },
  VOID: { label: 'Voided', variant: 'neutral' },
};

let lineItemSequence = 0;

const newLineItem = (): InvoiceLineItemForm => ({
  id: `invoice-line-${++lineItemSequence}`,
  description: '',
  quantity: '1',
  unitAmount: '',
});

const newInvoiceForm = (): InvoiceForm => ({
  invoiceNumber: '',
  completionNote: '',
  lineItems: [newLineItem()],
});

const wholeNumber = (value: string) => {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 1 ? amount : null;
};

const sumLineItems = (lineItems: InvoiceLineItemForm[]) => {
  let total = 0;

  for (const lineItem of lineItems) {
    const quantity = wholeNumber(lineItem.quantity);
    const unitAmount = wholeNumber(lineItem.unitAmount);
    if (quantity === null || unitAmount === null) return null;

    const lineTotal = quantity * unitAmount;
    if (!Number.isSafeInteger(lineTotal)) return null;

    total += lineTotal;
    if (!Number.isSafeInteger(total)) return null;
  }

  return total;
};

const lineItemTotal = (lineItem: InvoiceLineItemForm) => {
  const quantity = wholeNumber(lineItem.quantity);
  const unitAmount = wholeNumber(lineItem.unitAmount);
  if (quantity === null || unitAmount === null) return null;

  const total = quantity * unitAmount;
  return Number.isSafeInteger(total) ? total : null;
};

const currencyCode = (currency?: string | null) =>
  currency?.trim().toUpperCase() || DEFAULT_INVOICE_CURRENCY;

const formatInvoiceCurrency = (amount: number, currency?: string | null) => {
  const safeAmount = Number.isFinite(amount) ? Math.trunc(amount) : 0;
  const normalizedCurrency = currencyCode(currency);

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return `${normalizedCurrency} ${safeAmount.toLocaleString('en-NG')}`;
  }
};

const dateLabel = (value?: string | null) => (value ? formatDate(value) : null);

const invoiceVendorLabel = (invoice: HomeManagementWorkOrderInvoice) =>
  invoice.vendor?.name?.trim() || 'Vendor record unavailable';

const invoiceNumberLabel = (invoice: HomeManagementWorkOrderInvoice) =>
  invoice.invoiceNumber?.trim() || 'Unnumbered invoice';

const canVoidInvoice = (invoice: HomeManagementWorkOrderInvoice) =>
  ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(invoice.status);

const isActiveInvoice = (invoice: HomeManagementWorkOrderInvoice) =>
  ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(invoice.status);

const invoiceActionLabel: Record<InvoiceAction, string> = {
  submit: 'Submit invoice',
  approve: 'Approve for finance review',
  reject: 'Reject invoice',
  void: 'Void invoice',
};

interface HomeManagementWorkOrderInvoicesProps {
  workOrder: HomeManagementWorkOrder;
}

/**
 * Keeps the vendor invoice decision record local to the work order it settles.
 * This deliberately stops at finance review: payment initiation and payout
 * reconciliation remain separate controlled workflows.
 */
export function HomeManagementWorkOrderInvoices({
  workOrder,
}: HomeManagementWorkOrderInvoicesProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(newInvoiceForm);
  const [actionDialog, setActionDialog] = useState<InvoiceActionDialog>(null);
  const [actionReason, setActionReason] = useState('');
  const [currentUserId] = useState<string | null | undefined>(
    () => getStoredUser<{ id?: string }>()?.id ?? null
  );
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const invoicesQuery = useQuery({
    enabled: isExpanded,
    queryKey: homeManagementKeys.workOrderInvoices(workOrder.id),
    queryFn: () => unwrap(homeManagementService.listWorkOrderInvoices(workOrder.id)),
  });

  const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);
  const activeInvoice = invoices.find(isActiveInvoice);
  const approvedCost = workOrder.approvedCost;
  const hasApprovedCost =
    typeof approvedCost === 'number' && Number.isSafeInteger(approvedCost) && approvedCost > 0;
  const assignedVendorId = workOrder.assignedVendor?.id ?? null;
  const workOrderCreationBlocker =
    workOrder.status !== 'RESOLVED'
      ? 'Resolve the work order before recording the vendor invoice.'
      : !assignedVendorId
        ? 'Assign the completing vendor before recording their invoice.'
        : !hasApprovedCost
          ? 'A whole-money approved spend limit greater than zero is required before invoicing.'
          : null;
  const activeInvoiceBlocker = activeInvoice
    ? `${invoiceNumberLabel(activeInvoice)} is still ${invoiceStatusMeta[activeInvoice.status].label.toLowerCase()}. Only one active invoice can exist for this work order; reject or void it before recording a replacement.`
    : isExpanded && invoicesQuery.isLoading
      ? 'Checking whether this work order already has an active invoice.'
      : null;
  const creationBlocker = workOrderCreationBlocker ?? activeInvoiceBlocker;

  const invoiceTotal = useMemo(() => sumLineItems(form.lineItems), [form.lineItems]);
  const everyLineItemIsValid = form.lineItems.every(
    (lineItem) => lineItem.description.trim().length >= 3 && lineItemTotal(lineItem) !== null
  );
  const invoiceTotalWithinApprovedCost =
    hasApprovedCost && invoiceTotal !== null && invoiceTotal <= approvedCost;
  const canCreateInvoice =
    !creationBlocker && everyLineItemIsValid && invoiceTotalWithinApprovedCost;
  const invoiceTotalError =
    invoiceTotal !== null && hasApprovedCost && invoiceTotal > approvedCost
      ? `The invoice total cannot exceed the approved ${formatInvoiceCurrency(
          approvedCost,
          DEFAULT_INVOICE_CURRENCY
        )} spend limit.`
      : undefined;

  const invalidateInvoiceViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: homeManagementKeys.workOrderInvoices(workOrder.id),
      }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.workOrders }),
      queryClient.invalidateQueries({ queryKey: homeManagementKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: ['home-management', 'timeline'] }),
    ]);
  };

  const createInvoice = useMutation<
    HomeManagementWorkOrderInvoice,
    Error,
    CreateHomeManagementWorkOrderInvoiceInput
  >({
    mutationFn: (input) =>
      unwrap(homeManagementService.createWorkOrderInvoice(workOrder.id, input)),
    onSuccess: async () => {
      await invalidateInvoiceViews();
      setForm(newInvoiceForm());
      setIsCreateOpen(false);
      setToast({
        message: 'Invoice draft created. Submit it when the completion record is ready for review.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setToast({
        message: error.message || 'Unable to create this invoice draft.',
        variant: 'error',
      });
    },
  });

  const submitInvoice = useMutation<HomeManagementWorkOrderInvoice, Error, { invoiceId: string }>({
    mutationFn: ({ invoiceId }) => unwrap(homeManagementService.submitWorkOrderInvoice(invoiceId)),
    onSuccess: async () => {
      await invalidateInvoiceViews();
      setActionDialog(null);
      setToast({
        message: 'Invoice submitted for a different operator to approve.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setToast({ message: error.message || 'Unable to submit this invoice.', variant: 'error' });
    },
  });

  const approveInvoice = useMutation<HomeManagementWorkOrderInvoice, Error, { invoiceId: string }>({
    mutationFn: ({ invoiceId }) => unwrap(homeManagementService.approveWorkOrderInvoice(invoiceId)),
    onSuccess: async () => {
      await invalidateInvoiceViews();
      setActionDialog(null);
      setToast({
        message:
          'Invoice approved and ready for finance review. No vendor payment has been initiated.',
        variant: 'success',
      });
    },
    onError: (error) => {
      setToast({ message: error.message || 'Unable to approve this invoice.', variant: 'error' });
    },
  });

  const rejectInvoice = useMutation<
    HomeManagementWorkOrderInvoice,
    Error,
    { invoiceId: string; reason: string }
  >({
    mutationFn: ({ invoiceId, reason }) =>
      unwrap(homeManagementService.rejectWorkOrderInvoice(invoiceId, { reason })),
    onSuccess: async () => {
      await invalidateInvoiceViews();
      setActionDialog(null);
      setActionReason('');
      setToast({ message: 'Invoice rejected and the reason was recorded.', variant: 'success' });
    },
    onError: (error) => {
      setToast({ message: error.message || 'Unable to reject this invoice.', variant: 'error' });
    },
  });

  const voidInvoice = useMutation<
    HomeManagementWorkOrderInvoice,
    Error,
    { invoiceId: string; reason: string }
  >({
    mutationFn: ({ invoiceId, reason }) =>
      unwrap(homeManagementService.voidWorkOrderInvoice(invoiceId, { reason })),
    onSuccess: async () => {
      await invalidateInvoiceViews();
      setActionDialog(null);
      setActionReason('');
      setToast({ message: 'Invoice voided and the decision was recorded.', variant: 'success' });
    },
    onError: (error) => {
      setToast({ message: error.message || 'Unable to void this invoice.', variant: 'error' });
    },
  });

  const sortedInvoices = useMemo(
    () =>
      [...invoices].sort((left, right) => {
        const statusWeight: Record<HomeManagementWorkOrderInvoiceStatus, number> = {
          DRAFT: 0,
          SUBMITTED: 1,
          APPROVED: 2,
          REJECTED: 3,
          VOID: 4,
        };
        const statusDifference = statusWeight[left.status] - statusWeight[right.status];
        if (statusDifference !== 0) return statusDifference;

        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }),
    [invoices]
  );

  const updateLineItem = (
    lineItemId: string,
    field: Exclude<keyof InvoiceLineItemForm, 'id'>,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      lineItems: current.lineItems.map((lineItem) =>
        lineItem.id === lineItemId ? { ...lineItem, [field]: value } : lineItem
      ),
    }));
  };

  const openCreateDialog = () => {
    if (creationBlocker) return;
    setForm(newInvoiceForm());
    setIsCreateOpen(true);
  };

  const closeCreateDialog = () => {
    if (!createInvoice.isPending) setIsCreateOpen(false);
  };

  const openActionDialog = (action: InvoiceAction, invoice: HomeManagementWorkOrderInvoice) => {
    setActionReason('');
    setActionDialog({ action, invoice });
  };

  const actionDialogPending =
    (actionDialog?.action === 'submit' && submitInvoice.isPending) ||
    (actionDialog?.action === 'approve' && approveInvoice.isPending) ||
    (actionDialog?.action === 'reject' && rejectInvoice.isPending) ||
    (actionDialog?.action === 'void' && voidInvoice.isPending);

  const closeActionDialog = () => {
    if (!actionDialogPending) {
      setActionDialog(null);
      setActionReason('');
    }
  };

  const submitInvoiceForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateInvoice || !assignedVendorId || invoiceTotal === null) return;

    createInvoice.mutate({
      vendorId: assignedVendorId,
      invoiceNumber: form.invoiceNumber.trim() || undefined,
      currency: DEFAULT_INVOICE_CURRENCY,
      lineItems: form.lineItems.map((lineItem) => ({
        description: lineItem.description.trim(),
        quantity: wholeNumber(lineItem.quantity)!,
        unitAmount: wholeNumber(lineItem.unitAmount)!,
      })),
      completionNote: form.completionNote.trim() || undefined,
    });
  };

  const submitInvoiceAction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!actionDialog || actionDialogPending) return;

    const reason = actionReason.trim();
    if (['reject', 'void'].includes(actionDialog.action) && reason.length < 3) return;

    switch (actionDialog.action) {
      case 'submit':
        submitInvoice.mutate({ invoiceId: actionDialog.invoice.id });
        return;
      case 'approve':
        approveInvoice.mutate({ invoiceId: actionDialog.invoice.id });
        return;
      case 'reject':
        rejectInvoice.mutate({ invoiceId: actionDialog.invoice.id, reason });
        return;
      case 'void':
        voidInvoice.mutate({ invoiceId: actionDialog.invoice.id, reason });
    }
  };

  const actionNeedsReason = actionDialog?.action === 'reject' || actionDialog?.action === 'void';
  const actionReasonLabel = actionDialog?.action === 'void' ? 'Void reason' : 'Rejection reason';
  const actionReasonPlaceholder =
    actionDialog?.action === 'void'
      ? 'e.g. Invoice duplicated the vendor’s corrected submission.'
      : 'e.g. The submitted quantity does not match the completion record.';

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Vendor invoices</p>
            {isExpanded && !invoicesQuery.isLoading && (
              <Badge variant="neutral">{invoices.length}</Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Reconcile completed vendor work. Approval makes an invoice ready for finance review — it
            does not pay a vendor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isExpanded && (
            <Button
              size="sm"
              rounded="md"
              icon={<Plus className="h-3.5 w-3.5" />}
              disabled={Boolean(creationBlocker)}
              title={creationBlocker ?? undefined}
              onClick={openCreateDialog}
            >
              Create invoice
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
            {isExpanded ? 'Hide invoices' : 'View invoices'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {creationBlocker && (
            <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-300">
              {creationBlocker}
            </p>
          )}

          {invoicesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-xl bg-card" />
              ))}
            </div>
          ) : invoicesQuery.isError ? (
            <EmptyState
              className="border-dashed bg-card p-6"
              icon={CircleAlert}
              title="Invoices could not be loaded"
              description="Try again to see the current vendor billing and finance-review record."
              action={
                <Button
                  size="sm"
                  variant="outline"
                  rounded="md"
                  onClick={() => void invoicesQuery.refetch()}
                >
                  Retry
                </Button>
              }
            />
          ) : sortedInvoices.length === 0 ? (
            <EmptyState
              className="border-dashed bg-card p-6"
              icon={ClipboardList}
              title="No vendor invoices recorded"
              description={
                creationBlocker
                  ? 'The service and spend record must be complete before an invoice can be created.'
                  : 'Create the first invoice draft to capture completed work, line items, and the approval record.'
              }
              action={
                !creationBlocker ? (
                  <Button size="sm" rounded="md" onClick={openCreateDialog}>
                    Create invoice
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {sortedInvoices.map((invoice) => {
                const meta = invoiceStatusMeta[invoice.status] ?? invoiceStatusMeta.DRAFT;
                const invoiceCreatorId = invoice.createdById ?? invoice.submittedById;
                const createdByCurrentUser = Boolean(
                  currentUserId && invoiceCreatorId && currentUserId === invoiceCreatorId
                );
                const approvalAuthorityIsLoading =
                  invoice.status === 'SUBMITTED' && currentUserId === undefined;
                const canApproveInvoice =
                  invoice.status === 'SUBMITTED' &&
                  Boolean(invoiceCreatorId) &&
                  currentUserId !== null &&
                  currentUserId !== undefined &&
                  !createdByCurrentUser;
                const canSubmitInvoice = invoice.status === 'DRAFT';
                const pendingForInvoice =
                  (submitInvoice.isPending && submitInvoice.variables?.invoiceId === invoice.id) ||
                  (approveInvoice.isPending &&
                    approveInvoice.variables?.invoiceId === invoice.id) ||
                  (rejectInvoice.isPending && rejectInvoice.variables?.invoiceId === invoice.id) ||
                  (voidInvoice.isPending && voidInvoice.variables?.invoiceId === invoice.id);

                return (
                  <article key={invoice.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {invoiceNumberLabel(invoice)}
                          </p>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {invoiceVendorLabel(invoice)}
                          {invoice.vendor?.serviceType ? ` · ${invoice.vendor.serviceType}` : ''}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <Landmark className="h-3.5 w-3.5" />
                            {formatInvoiceCurrency(invoice.totalAmount, invoice.currency)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" />
                            Created {dateLabel(invoice.createdAt) ?? 'recently'}
                          </span>
                          {invoice.submittedAt && (
                            <span className="inline-flex items-center gap-1.5">
                              <Send className="h-3.5 w-3.5" />
                              Submitted {dateLabel(invoice.submittedAt)}
                            </span>
                          )}
                          {invoice.approvedAt && (
                            <span className="inline-flex items-center gap-1.5">
                              <BadgeCheck className="h-3.5 w-3.5" />
                              Approved {dateLabel(invoice.approvedAt)}
                            </span>
                          )}
                        </div>

                        {invoice.lineItems.length > 0 && (
                          <div className="mt-4 overflow-hidden rounded-xl border border-border/80">
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 bg-secondary/60 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                              <span>Description</span>
                              <span>Qty</span>
                              <span className="text-right">Amount</span>
                            </div>
                            <div className="divide-y divide-border/70">
                              {invoice.lineItems.map((lineItem, index) => (
                                <div
                                  key={lineItem.id ?? `${invoice.id}-line-${index}`}
                                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 px-3 py-2 text-xs text-muted-foreground"
                                >
                                  <span className="min-w-0 truncate text-foreground">
                                    {lineItem.description}
                                  </span>
                                  <span>{lineItem.quantity}</span>
                                  <span className="text-right font-medium text-foreground">
                                    {formatInvoiceCurrency(lineItem.totalAmount, invoice.currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {invoice.completionNote && (
                          <p className="mt-3 whitespace-pre-wrap rounded-xl bg-secondary/60 px-3 py-2 text-xs leading-5 text-muted-foreground">
                            {invoice.completionNote}
                          </p>
                        )}
                        {invoice.status === 'APPROVED' && (
                          <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs leading-5 text-emerald-800 dark:text-emerald-300">
                            Approved and ready for finance review. This is not a vendor payment
                            confirmation.
                          </p>
                        )}
                        {invoice.status === 'REJECTED' && invoice.rejectionReason && (
                          <p className="mt-3 rounded-xl bg-destructive/5 px-3 py-2 text-xs leading-5 text-destructive">
                            Rejection reason: {invoice.rejectionReason}
                          </p>
                        )}
                        {invoice.status === 'VOID' && invoice.voidReason && (
                          <p className="mt-3 rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                            Void reason: {invoice.voidReason}
                          </p>
                        )}
                      </div>

                      <div className="w-full shrink-0 space-y-2 lg:w-56">
                        {invoice.status === 'SUBMITTED' && (
                          <>
                            {approvalAuthorityIsLoading ? (
                              <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                                Checking approval authority…
                              </p>
                            ) : currentUserId === null ? (
                              <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                                Refresh your session to confirm approval authority.
                              </p>
                            ) : !invoiceCreatorId ? (
                              <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                                The creator record is unavailable. Refresh before approving.
                              </p>
                            ) : createdByCurrentUser ? (
                              <p className="rounded-xl bg-secondary px-3 py-2 text-xs leading-5 text-muted-foreground">
                                A different authorised operator must approve the invoice you
                                created.
                              </p>
                            ) : null}
                            <Button
                              size="sm"
                              rounded="md"
                              fullWidth
                              icon={<BadgeCheck className="h-3.5 w-3.5" />}
                              disabled={!canApproveInvoice || pendingForInvoice}
                              isLoading={
                                approveInvoice.isPending &&
                                approveInvoice.variables?.invoiceId === invoice.id
                              }
                              onClick={() => openActionDialog('approve', invoice)}
                            >
                              Approve for finance
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              rounded="md"
                              fullWidth
                              icon={<XCircle className="h-3.5 w-3.5" />}
                              disabled={pendingForInvoice}
                              onClick={() => openActionDialog('reject', invoice)}
                            >
                              Reject invoice
                            </Button>
                          </>
                        )}

                        {canSubmitInvoice && (
                          <Button
                            size="sm"
                            rounded="md"
                            fullWidth
                            icon={<Send className="h-3.5 w-3.5" />}
                            isLoading={
                              submitInvoice.isPending &&
                              submitInvoice.variables?.invoiceId === invoice.id
                            }
                            disabled={pendingForInvoice}
                            onClick={() => openActionDialog('submit', invoice)}
                          >
                            Submit for approval
                          </Button>
                        )}

                        {canVoidInvoice(invoice) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            rounded="md"
                            fullWidth
                            icon={<Ban className="h-3.5 w-3.5" />}
                            isLoading={
                              voidInvoice.isPending &&
                              voidInvoice.variables?.invoiceId === invoice.id
                            }
                            disabled={pendingForInvoice}
                            onClick={() => openActionDialog('void', invoice)}
                          >
                            Void invoice
                          </Button>
                        )}
                      </div>
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
        <DialogContent className="max-w-3xl">
          <form onSubmit={submitInvoiceForm} className="p-6">
            <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Create vendor invoice
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
              Capture the completed work for “{workOrder.issueTitle}”. This starts as a draft and
              remains capped by the approved spend limit.
            </DialogDescription>

            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-border bg-secondary/45 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Assigned vendor
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {workOrder.assignedVendor?.name ?? 'Vendor record unavailable'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Approved spend limit:{' '}
                  {hasApprovedCost
                    ? formatInvoiceCurrency(approvedCost, DEFAULT_INVOICE_CURRENCY)
                    : 'Unavailable'}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Invoice number"
                  htmlFor={`home-work-order-invoice-number-${workOrder.id}`}
                  hint="Optional vendor reference."
                >
                  <Input
                    id={`home-work-order-invoice-number-${workOrder.id}`}
                    autoFocus
                    maxLength={120}
                    value={form.invoiceNumber}
                    disabled={createInvoice.isPending}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, invoiceNumber: event.target.value }))
                    }
                    placeholder="e.g. INV-2048"
                  />
                </Field>
                <Field label="Currency" hint="Matches the approved work-order spend.">
                  <div className="flex min-h-11 items-center rounded-xl border border-border bg-secondary/60 px-3.5 text-sm text-foreground">
                    NGN — Nigerian naira
                  </div>
                </Field>
              </div>

              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Line items</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Record only completed work, materials, and approved service charges.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    rounded="md"
                    icon={<Plus className="h-3.5 w-3.5" />}
                    disabled={createInvoice.isPending}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        lineItems: [...current.lineItems, newLineItem()],
                      }))
                    }
                  >
                    Add line
                  </Button>
                </div>

                <div className="mt-3 space-y-3">
                  {form.lineItems.map((lineItem, index) => {
                    const total = lineItemTotal(lineItem);
                    const descriptionValid = lineItem.description.trim().length >= 3;
                    const quantityValid = wholeNumber(lineItem.quantity) !== null;
                    const unitAmountValid = wholeNumber(lineItem.unitAmount) !== null;

                    return (
                      <div
                        key={lineItem.id}
                        className="rounded-xl border border-border bg-card p-3 sm:p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
                          <Field
                            className="sm:col-span-6"
                            label={`Line ${index + 1} description`}
                            htmlFor={`home-work-order-invoice-description-${workOrder.id}-${lineItem.id}`}
                            required
                            error={
                              lineItem.description && !descriptionValid
                                ? 'Use at least three characters.'
                                : undefined
                            }
                          >
                            <Input
                              id={`home-work-order-invoice-description-${workOrder.id}-${lineItem.id}`}
                              maxLength={300}
                              value={lineItem.description}
                              disabled={createInvoice.isPending}
                              onChange={(event) =>
                                updateLineItem(lineItem.id, 'description', event.target.value)
                              }
                              placeholder="e.g. Replace condenser capacitor"
                            />
                          </Field>
                          <Field
                            className="sm:col-span-2"
                            label="Quantity"
                            htmlFor={`home-work-order-invoice-quantity-${workOrder.id}-${lineItem.id}`}
                            required
                            error={
                              lineItem.quantity && !quantityValid
                                ? 'Whole number required.'
                                : undefined
                            }
                          >
                            <Input
                              id={`home-work-order-invoice-quantity-${workOrder.id}-${lineItem.id}`}
                              type="number"
                              min={1}
                              step={1}
                              inputMode="numeric"
                              value={lineItem.quantity}
                              disabled={createInvoice.isPending}
                              onChange={(event) =>
                                updateLineItem(lineItem.id, 'quantity', event.target.value)
                              }
                            />
                          </Field>
                          <Field
                            className="sm:col-span-3"
                            label="Unit amount"
                            htmlFor={`home-work-order-invoice-amount-${workOrder.id}-${lineItem.id}`}
                            required
                            error={
                              lineItem.unitAmount && !unitAmountValid
                                ? 'Whole amount required.'
                                : undefined
                            }
                          >
                            <Input
                              id={`home-work-order-invoice-amount-${workOrder.id}-${lineItem.id}`}
                              type="number"
                              min={1}
                              step={1}
                              inputMode="numeric"
                              leadingIcon={
                                <span className="text-sm">{DEFAULT_INVOICE_CURRENCY}</span>
                              }
                              value={lineItem.unitAmount}
                              disabled={createInvoice.isPending}
                              onChange={(event) =>
                                updateLineItem(lineItem.id, 'unitAmount', event.target.value)
                              }
                              placeholder="85000"
                            />
                          </Field>
                          <div className="flex min-h-11 items-center justify-between gap-2 sm:col-span-1 sm:justify-end">
                            <p className="text-right text-xs font-semibold text-foreground sm:hidden">
                              {total === null
                                ? '—'
                                : formatInvoiceCurrency(total, DEFAULT_INVOICE_CURRENCY)}
                            </p>
                            {form.lineItems.length > 1 && (
                              <Button
                                size="xs"
                                variant="ghost"
                                rounded="md"
                                title={`Remove line ${index + 1}`}
                                icon={<Trash2 className="h-3.5 w-3.5" />}
                                disabled={createInvoice.isPending}
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    lineItems: current.lineItems.filter(
                                      (currentLineItem) => currentLineItem.id !== lineItem.id
                                    ),
                                  }))
                                }
                              >
                                <span className="sr-only">Remove</span>
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="mt-3 text-right text-xs text-muted-foreground">
                          Line total:{' '}
                          <span className="font-semibold text-foreground">
                            {total === null
                              ? '—'
                              : formatInvoiceCurrency(total, DEFAULT_INVOICE_CURRENCY)}
                          </span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Field
                label="Completion note"
                htmlFor={`home-work-order-invoice-completion-note-${workOrder.id}`}
                hint="Optional context for the approver and finance team."
              >
                <Textarea
                  id={`home-work-order-invoice-completion-note-${workOrder.id}`}
                  maxLength={2000}
                  value={form.completionNote}
                  disabled={createInvoice.isPending}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, completionNote: event.target.value }))
                  }
                  placeholder="e.g. The replacement was tested in the tenant’s presence and the area was cleaned before handover."
                />
              </Field>

              <div className="rounded-xl border border-border bg-secondary/45 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Invoice total</p>
                  <p className="text-base font-semibold tracking-[-0.01em] text-foreground">
                    {invoiceTotal === null
                      ? '—'
                      : formatInvoiceCurrency(invoiceTotal, DEFAULT_INVOICE_CURRENCY)}
                  </p>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Approved limit:{' '}
                  {hasApprovedCost
                    ? formatInvoiceCurrency(approvedCost, DEFAULT_INVOICE_CURRENCY)
                    : 'Unavailable'}
                </p>
                {invoiceTotalError && (
                  <p className="mt-2 text-xs leading-5 text-destructive">{invoiceTotalError}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                rounded="md"
                disabled={createInvoice.isPending}
                onClick={closeCreateDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                rounded="md"
                isLoading={createInvoice.isPending}
                disabled={!canCreateInvoice}
              >
                Create draft invoice
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
        <DialogContent className="max-w-lg" showClose={!actionDialogPending}>
          {actionDialog && (
            <form onSubmit={submitInvoiceAction} className="p-6">
              <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
                {invoiceActionLabel[actionDialog.action]}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm leading-6 text-muted-foreground">
                {actionDialog.action === 'submit'
                  ? `Submit “${invoiceNumberLabel(actionDialog.invoice)}” for approval. A different authorised operator must approve it.`
                  : actionDialog.action === 'approve'
                    ? `Approve “${invoiceNumberLabel(actionDialog.invoice)}” at ${formatInvoiceCurrency(actionDialog.invoice.totalAmount, actionDialog.invoice.currency)}. This makes it ready for finance review; it does not initiate or confirm payment.`
                    : actionDialog.action === 'reject'
                      ? `Reject “${invoiceNumberLabel(actionDialog.invoice)}”. The reason will remain with the operational record.`
                      : `Void “${invoiceNumberLabel(actionDialog.invoice)}”. This preserves the invoice record while preventing further processing.`}
              </DialogDescription>

              {actionNeedsReason && (
                <div className="mt-6">
                  <Field
                    label={actionReasonLabel}
                    htmlFor="home-management-invoice-action-reason"
                    required
                    hint="Use at least three characters. This is retained in the decision record."
                    error={
                      actionReason && actionReason.trim().length < 3
                        ? 'Use at least three characters.'
                        : undefined
                    }
                  >
                    <Textarea
                      id="home-management-invoice-action-reason"
                      autoFocus
                      maxLength={2000}
                      value={actionReason}
                      disabled={actionDialogPending}
                      onChange={(event) => setActionReason(event.target.value)}
                      placeholder={actionReasonPlaceholder}
                    />
                  </Field>
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  rounded="md"
                  disabled={actionDialogPending}
                  onClick={closeActionDialog}
                >
                  Keep invoice unchanged
                </Button>
                <Button
                  type="submit"
                  variant={
                    actionDialog.action === 'reject' || actionDialog.action === 'void'
                      ? 'danger'
                      : 'primary'
                  }
                  rounded="md"
                  isLoading={actionDialogPending}
                  disabled={
                    (actionNeedsReason && actionReason.trim().length < 3) || actionDialogPending
                  }
                >
                  {invoiceActionLabel[actionDialog.action]}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
