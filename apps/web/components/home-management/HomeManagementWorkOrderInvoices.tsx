'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BadgeCheck,
  Ban,
  Banknote,
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
} from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui';
import { Button } from '@sureground/ui';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@sureground/ui';
import { EmptyState } from '@sureground/ui';
import { Skeleton } from '@sureground/ui';
import { Field } from '@sureground/ui';
import { CurrencyInput, Input, NumberInput } from '@sureground/ui';
import { Pagination } from '@sureground/ui';
import { Textarea } from '@sureground/ui';
import { useToast } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { getStoredUser } from '@/lib/authStorage';
import { formatCurrency, formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type CreateHomeManagementWorkOrderInvoiceInput,
  type HomeManagementInvoicePaymentPreview,
  type HomeManagementWorkOrder,
  type HomeManagementWorkOrderInvoice,
  type HomeManagementWorkOrderInvoiceStatus,
} from '@/services/homeManagementService';
import { InvoiceCheckPanel } from './InvoiceCheckPanel';
import { PayDialog } from '@/components/shared/payments/PayDialog';
import { ReasonDialog } from '@sureground/ui';
import { duplicateFlagsOf, isDuplicateInvoiceRefusal } from '@sureground/shared';
import type { DuplicateAcknowledgement, DuplicateFlag, EvidenceInvoice } from '@/types/managed';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/types/payments';

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
const INVOICE_PAGE_SIZE = 5;

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

const payoutStatusMeta: Record<
  HomeManagementWorkOrderInvoice['payoutStatus'],
  { label: string; variant: BadgeVariant } | null
> = {
  PENDING: null,
  PROCESSING: { label: 'Payout on its way', variant: 'info' },
  PAID: { label: 'Paid', variant: 'success' },
  FAILED: { label: 'Payout failed', variant: 'danger' },
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
  ['DRAFT', 'SUBMITTED', 'APPROVED'].includes(invoice.status) &&
  invoice.payoutStatus !== 'PROCESSING' &&
  invoice.payoutStatus !== 'PAID';

const canPayInvoice = (invoice: HomeManagementWorkOrderInvoice) =>
  invoice.status === 'APPROVED' &&
  (invoice.payoutStatus === 'PENDING' || invoice.payoutStatus === 'FAILED');

// Without a preview (loading or failed) it describes the rule, not an amount it doesn't know.
const vendorPayCopy = (
  invoice: HomeManagementWorkOrderInvoice,
  preview: { data?: HomeManagementInvoicePaymentPreview; isLoading: boolean; isError: boolean },
  company: string
) => {
  const retry = invoice.payoutStatus === 'FAILED';
  const fallbackProtection =
    'If a top-up is needed, we send the vendor’s payment once it is confirmed. You’ll see it on this invoice.';
  if (preview.isLoading) {
    return {
      note: 'Working out how much comes from the money Sureground holds for you.',
      buttonLabel: 'Working out the split…',
      disabled: true,
      protection: fallbackProtection,
    };
  }
  const split = preview.data;
  if (!split) {
    return {
      note: preview.isError
        ? 'We couldn’t work out the split here. We pay the vendor from the money Sureground holds for the owner first. If that doesn’t cover the invoice, you top up the rest by card, plus its card or bank fee, on the next page.'
        : 'We pay the vendor from the money Sureground holds for the owner first. A card top-up, with its card or bank fee, is only taken if that does not cover the invoice.',
      buttonLabel: retry ? 'Retry payment' : 'Pay vendor',
      protection: fallbackProtection,
    };
  }
  if (!split.canPay) {
    return {
      note: 'Nothing has been paid.',
      buttonLabel: 'Can’t pay this invoice yet',
      disabled: true,
      error: split.reason ?? 'This invoice can’t be paid right now.',
      protection: undefined,
    };
  }
  const held = { label: 'From money Sureground holds for you', amount: split.fromHeldFunds };
  if (split.topUp <= 0) {
    return {
      parts: [held],
      note: 'Paid in full from the money Sureground holds for the owner. No card payment is needed. The amounts are checked again when you pay.',
      buttonLabel: `${retry ? 'Retry: pay' : 'Pay'} vendor ${formatCurrency(split.invoiceTotal)}`,
      secureLine: 'No card is charged.',
      protection: 'You’ll see the payment on this invoice.',
    };
  }
  const fee = split.topUpFee > 0 ? ` + ${formatCurrency(split.topUpFee)} fee` : '';
  return {
    parts: [
      held,
      {
        label:
          split.topUpFee > 0
            ? `Card top-up (+ ${formatCurrency(split.topUpFee)} fee)`
            : 'Card top-up (no fee)',
        amount: split.topUp,
      },
    ],
    note: `Your card is charged ${formatCurrency(split.topUpCharge)}. The vendor is paid the full ${formatCurrency(split.invoiceTotal)} once the top-up is confirmed. The amounts are checked again when you pay.`,
    buttonLabel: `Pay ${formatCurrency(split.topUp)}${fee} top-up and pay vendor`,
    secureLine: `You finish the top-up on ${company}’s secure page: Sureground never sees your card details.`,
    protection:
      'We send the vendor’s payment once the top-up is confirmed. You’ll see it on this invoice.',
  };
};

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

// Stops at finance review: payment initiation and payout reconciliation are separate controlled workflows.
export function HomeManagementWorkOrderInvoices({
  workOrder,
}: HomeManagementWorkOrderInvoicesProps) {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState<InvoiceForm>(newInvoiceForm);
  const [actionDialog, setActionDialog] = useState<InvoiceActionDialog>(null);
  const [actionReason, setActionReason] = useState('');
  const [currentUserId] = useState<string | null | undefined>(
    () => getStoredUser<{ id?: string }>()?.id ?? null
  );
  const toast = useToast();

  const invoicesQuery = useQuery({
    enabled: isExpanded,
    queryKey: [
      ...homeManagementKeys.workOrderInvoices(workOrder.id),
      { page, pageSize: INVOICE_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listWorkOrderInvoices(workOrder.id, {
          page,
          pageSize: INVOICE_PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const invoices = useMemo(() => invoicesQuery.data?.items ?? [], [invoicesQuery.data]);
  const totalInvoices = invoicesQuery.data?.total ?? 0;
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
      setPage(1);
      setForm(newInvoiceForm());
      setIsCreateOpen(false);
      toast.success(
        'Invoice draft created. Submit it when the completion record is ready for review.'
      );
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to create this invoice draft.');
    },
  });

  const submitInvoice = useMutation<HomeManagementWorkOrderInvoice, Error, { invoiceId: string }>({
    mutationFn: ({ invoiceId }) => unwrap(homeManagementService.submitWorkOrderInvoice(invoiceId)),
    onSuccess: async () => {
      await invalidateInvoiceViews();
      setPage(1);
      setActionDialog(null);
      toast.success('Invoice submitted for a different operator to approve.');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to submit this invoice.');
    },
  });

  // A likely duplicate is refused until someone says why it is not one; that reason is kept.
  const [duplicate, setDuplicate] = useState<
    | { action: 'approve'; invoiceId: string; message: string; flags: DuplicateFlag[] }
    | {
        action: 'pay';
        invoiceId: string;
        provider?: PaymentProvider;
        message: string;
        flags: DuplicateFlag[];
      }
    | null
  >(null);
  // The refusal's own flags can be dropped on the way; the job record lists them per invoice too.
  const duplicateEvidence = useQuery({
    queryKey: homeManagementKeys.workOrderEvidence(workOrder.id),
    queryFn: () => unwrap(homeManagementService.getWorkOrderEvidence(workOrder.id)),
    enabled: Boolean(duplicate) && duplicate?.flags.length === 0,
  });
  const duplicateFlags: DuplicateFlag[] = duplicate?.flags.length
    ? duplicate.flags
    : ((
        duplicateEvidence.data?.stages.find((stage) => stage.key === 'INVOICE')?.items as
          | EvidenceInvoice[]
          | undefined
      )?.find((invoice) => invoice.id === duplicate?.invoiceId)?.duplicateFlags ?? []);

  const approveInvoice = useMutation<
    HomeManagementWorkOrderInvoice,
    Error,
    { invoiceId: string; acknowledge?: DuplicateAcknowledgement }
  >({
    mutationFn: ({ invoiceId, acknowledge }) =>
      unwrap(homeManagementService.approveWorkOrderInvoice(invoiceId, acknowledge)),
    onSuccess: async () => {
      await invalidateInvoiceViews();
      setPage(1);
      setActionDialog(null);
      toast.success(
        'Invoice approved and ready for finance review. No vendor payment has been initiated.'
      );
    },
    onError: (error, { invoiceId, acknowledge }) => {
      if (!acknowledge && isDuplicateInvoiceRefusal(error)) {
        setActionDialog(null);
        setDuplicate({
          action: 'approve',
          invoiceId,
          message: error.message,
          flags: duplicateFlagsOf(error),
        });
        return;
      }
      toast.error(error.message || 'Unable to approve this invoice.');
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
      setPage(1);
      setActionDialog(null);
      setActionReason('');
      toast.success('Invoice rejected and the reason was recorded.');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to reject this invoice.');
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
      setPage(1);
      setActionDialog(null);
      setActionReason('');
      toast.success('Invoice voided and the decision was recorded.');
    },
    onError: (error) => {
      toast.error(error.message || 'Unable to void this invoice.');
    },
  });

  const providers = usePaymentProviders();
  const [payTarget, setPayTarget] = useState<HomeManagementWorkOrderInvoice | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const paymentPreview = useQuery({
    queryKey: homeManagementKeys.invoicePaymentPreview(payTarget?.id ?? '', providers.provider),
    queryFn: () =>
      unwrap(
        homeManagementService.getWorkOrderInvoicePaymentPreview(payTarget!.id, providers.provider)
      ),
    enabled: !!payTarget,
    retry: false,
  });
  const payCopy = payTarget
    ? vendorPayCopy(
        payTarget,
        paymentPreview,
        providers.options.find((o) => o.provider === providers.provider)?.label ??
          'the payment company'
      )
    : null;
  const payInvoice = useMutation<
    { invoiceId: string; payoutStatus: string; topUp?: { authorizationUrl: string } },
    Error,
    { invoiceId: string; provider?: PaymentProvider; acknowledge?: DuplicateAcknowledgement }
  >({
    mutationFn: ({ invoiceId, provider, acknowledge }) =>
      unwrap(homeManagementService.payWorkOrderInvoice(invoiceId, provider, acknowledge)),
    onMutate: () => setProviderError(null),
    onSuccess: async (result) => {
      // Held rent doesn't cover it: the shortfall is paid on Paystack, and the vendor is paid once it lands.
      if (result.topUp) {
        window.location.assign(result.topUp.authorizationUrl);
        return;
      }
      setPayTarget(null);
      await invalidateInvoiceViews();
      if (result.payoutStatus === 'FAILED') {
        toast.error('The transfer to the vendor failed. Check their payout account and try again.');
      } else {
        toast.success(
          result.payoutStatus === 'PAID'
            ? 'Vendor paid.'
            : 'Payment sent: it shows as paid once the bank confirms.'
        );
      }
    },
    onError: (error, { invoiceId, provider, acknowledge }) => {
      if (!acknowledge && isDuplicateInvoiceRefusal(error)) {
        setPayTarget(null);
        setDuplicate({
          action: 'pay',
          invoiceId,
          provider,
          message: error.message,
          flags: duplicateFlagsOf(error),
        });
        return;
      }
      const unavailable = providers.recover(error, provider);
      if (unavailable) setProviderError(unavailable);
      else toast.error(error.message || 'Unable to pay this invoice.');
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
              <Badge variant="neutral">{totalInvoices}</Badge>
            )}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Reconcile completed vendor work. Approval makes an invoice ready for finance review: it
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
            onClick={() =>
              setIsExpanded((current) => {
                if (!current) setPage(1);
                return !current;
              })
            }
          >
            {isExpanded ? 'Hide invoices' : 'View invoices'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {creationBlocker && (
            <p className="rounded-xl bg-warning-subtle px-3 py-2 text-xs leading-5 text-foreground">
              {creationBlocker}
            </p>
          )}

          {invoicesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }, (_, index) => (
                <Skeleton key={index} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : invoicesQuery.isError && !invoicesQuery.data ? (
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
                  (voidInvoice.isPending && voidInvoice.variables?.invoiceId === invoice.id) ||
                  (payInvoice.isPending && payInvoice.variables?.invoiceId === invoice.id);

                return (
                  <article key={invoice.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {invoiceNumberLabel(invoice)}
                          </p>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {payoutStatusMeta[invoice.payoutStatus] && (
                            <Badge variant={payoutStatusMeta[invoice.payoutStatus]!.variant}>
                              {payoutStatusMeta[invoice.payoutStatus]!.label}
                            </Badge>
                          )}
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
                            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 bg-secondary/60 px-3 py-2 text-2xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
                        {invoice.status === 'APPROVED' && invoice.payoutStatus === 'PENDING' && (
                          <p className="mt-3 rounded-xl bg-success-subtle px-3 py-2 text-xs leading-5 text-foreground">
                            Approved and ready to pay. The vendor has not been paid yet.
                          </p>
                        )}
                        {invoice.payoutStatus === 'PAID' && invoice.paidOutAt && (
                          <p className="mt-3 rounded-xl bg-success-subtle px-3 py-2 text-xs leading-5 text-foreground">
                            Paid on {dateLabel(invoice.paidOutAt)}.
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

                        {canPayInvoice(invoice) && (
                          <Button
                            size="sm"
                            rounded="md"
                            fullWidth
                            icon={<Banknote className="h-3.5 w-3.5" />}
                            isLoading={
                              payInvoice.isPending && payInvoice.variables?.invoiceId === invoice.id
                            }
                            disabled={pendingForInvoice}
                            onClick={() => setPayTarget(invoice)}
                          >
                            {invoice.payoutStatus === 'FAILED' ? 'Retry payment' : 'Pay vendor'}
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
          {totalInvoices > 0 && (
            <Pagination
              page={page}
              pageSize={INVOICE_PAGE_SIZE}
              total={totalInvoices}
              onPageChange={setPage}
              className="rounded-xl border border-border bg-card"
            />
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
        <DialogContent className="max-w-3xl p-0">
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
                    NGN: Nigerian naira
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
                            <NumberInput
                              id={`home-work-order-invoice-quantity-${workOrder.id}-${lineItem.id}`}
                              min={1}
                              step={1}
                              value={lineItem.quantity}
                              disabled={createInvoice.isPending}
                              onValueChange={(value) =>
                                updateLineItem(lineItem.id, 'quantity', value)
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
                            <CurrencyInput
                              id={`home-work-order-invoice-amount-${workOrder.id}-${lineItem.id}`}
                              prefix="NGN"
                              min={1}
                              value={lineItem.unitAmount}
                              disabled={createInvoice.isPending}
                              onValueChange={(v) =>
                                updateLineItem(lineItem.id, 'unitAmount', v === 0 ? '' : String(v))
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
        <DialogContent className="max-w-lg p-0" showClose={!actionDialogPending}>
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
              {(actionDialog.action === 'approve' || actionDialog.action === 'reject') && (
                <div className="mt-4">
                  <InvoiceCheckPanel invoiceId={actionDialog.invoice.id} />
                </div>
              )}

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

      <ReasonDialog
        open={Boolean(duplicate)}
        onOpenChange={(open) => !open && setDuplicate(null)}
        title="This invoice may be a duplicate"
        description={
          <>
            <span className="block">
              {duplicate?.message ||
                'It looks like an invoice already approved or paid for this work. Say why it is not a duplicate to continue.'}
            </span>
            {duplicateFlags.map((flag) => (
              <span key={flag.code} className="mt-1 block text-foreground">
                {flag.message}
              </span>
            ))}
          </>
        }
        reasonLabel="Why this is not a duplicate"
        reasonPlaceholder="e.g. A second visit to replace the pump, agreed separately."
        minLength={10}
        maxLength={1000}
        confirmLabel={duplicate?.action === 'pay' ? 'Continue to pay' : 'Approve anyway'}
        onSubmit={async ({ reason }) => {
          if (!duplicate) return;
          const acknowledge: DuplicateAcknowledgement = { acknowledgeDuplicate: true, reason };
          if (duplicate.action === 'approve') {
            await approveInvoice.mutateAsync({ invoiceId: duplicate.invoiceId, acknowledge });
          } else {
            await payInvoice.mutateAsync({
              invoiceId: duplicate.invoiceId,
              provider: duplicate.provider,
              acknowledge,
            });
          }
          setDuplicate(null);
        }}
      />

      <PayDialog
        open={!!payTarget}
        onClose={() => {
          setPayTarget(null);
          setProviderError(null);
        }}
        title="Pay vendor"
        context={
          payTarget
            ? `${invoiceVendorLabel(payTarget)} · ${invoiceNumberLabel(payTarget)}`
            : undefined
        }
        owed={payTarget?.totalAmount ?? 0}
        owedLabel="invoice"
        itemLabel="Invoice"
        itemParts={payCopy?.parts}
        receiverLine={null}
        topUpOnly={{
          note: payCopy?.note,
          buttonLabel: payCopy?.buttonLabel ?? 'Pay vendor',
          disabled: payCopy?.disabled,
          secureLine: payCopy?.secureLine,
        }}
        protection={payCopy?.protection}
        providers={providers}
        providerError={providerError}
        error={payCopy?.error}
        busy={payInvoice.isPending}
        onPay={() =>
          payTarget && payInvoice.mutate({ invoiceId: payTarget.id, provider: providers.provider })
        }
      />
    </div>
  );
}
