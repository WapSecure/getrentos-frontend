import { usePaystackCheckout } from '@/hooks/usePaystackCheckout';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from '@sureground/icons/native';
import {
  Button,
  Card,
  DateField,
  Divider,
  FormAlert,
  IconButton,
  LinkButton,
  NumberField,
  Price,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  homeCareApi,
  sumLines,
  type Invoice,
  type InvoiceLine,
  type InvoicePaymentPreview,
  type Quote,
  type WorkOrder,
} from '@/lib/api/homeCare';
import { apiFetch, errorMessage } from '@/lib/api/client';
import { BankAccountFields } from '@/components/forms/BankAccountFields';
import { withStepUpSummary } from '@/lib/stepUp';
import {
  INCOMPLETE_ACCOUNT_LOOKUP,
  lookupAllowsSave,
  payoutAccountStepUpSummary,
  saveAccountLabel,
  type AccountLookup,
} from '@sureground/shared';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { Sheet } from '@/components/Sheet';
import { StatusPill, type Tone } from '@/components/host/HostUI';
import { VendorPicker } from './VendorPicker';
import { ReasonSheet } from './ReasonSheet';
import { InvoiceCheckCard } from './InvoiceCheckCard';
import { PaySheet } from '@/components/payments/PaySheet';
import { usePaymentProviders } from '@/hooks/usePaymentProviders';
import type { PaymentProvider } from '@/lib/api/paymentStatus';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

// Word for word with the web dialog; without a preview it describes the rule, never an amount it does not know.
function vendorPayCopy(
  invoice: Invoice,
  preview: { data?: InvoicePaymentPreview; isLoading: boolean; isError: boolean },
  company: string
): {
  parts?: { label: string; amount: number }[];
  note: string;
  buttonLabel?: string;
  notReady?: string;
  error?: string;
  secureLine: string;
  protection?: string;
} {
  const retry = invoice.payoutStatus === 'FAILED';
  const fallbackSecure = `If a top-up is needed, you finish on ${company}’s secure page: Sureground never sees your card details.`;
  const fallbackProtection =
    'If a top-up is needed, we send the vendor’s payment once it is confirmed. You’ll see it on this invoice.';
  if (preview.isLoading) {
    return {
      note: 'Working out how much comes from the money Sureground holds for you.',
      notReady: 'Working out the split…',
      secureLine: fallbackSecure,
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
      secureLine: fallbackSecure,
      protection: fallbackProtection,
    };
  }
  if (!split.canPay) {
    return {
      note: 'Nothing has been paid.',
      notReady: 'Can’t pay this invoice yet',
      error: split.reason ?? 'This invoice can’t be paid right now.',
      secureLine: 'No card is charged.',
    };
  }
  const held = { label: 'From money Sureground holds for you', amount: split.fromHeldFunds };
  if (split.topUp <= 0) {
    return {
      parts: [held],
      note: 'Paid in full from the money Sureground holds for the owner. No card payment is needed. The amounts are checked again when you pay.',
      buttonLabel: `${retry ? 'Retry: pay' : 'Pay'} vendor ${naira(split.invoiceTotal)}`,
      secureLine: 'No card is charged.',
      protection: 'You’ll see the payment on this invoice.',
    };
  }
  const fee = split.topUpFee > 0 ? ` + ${naira(split.topUpFee)} fee` : '';
  return {
    parts: [
      held,
      {
        label:
          split.topUpFee > 0
            ? `Card top-up (+ ${naira(split.topUpFee)} fee)`
            : 'Card top-up (no fee)',
        amount: split.topUp,
      },
    ],
    note: `Your card is charged ${naira(split.topUpCharge)}. The vendor is paid the full ${naira(split.invoiceTotal)} once the top-up is confirmed. The amounts are checked again when you pay.`,
    buttonLabel: `Pay ${naira(split.topUp)}${fee} top-up and pay vendor`,
    secureLine: `You finish the top-up on ${company}’s secure page: Sureground never sees your card details.`,
    protection:
      'We send the vendor’s payment once the top-up is confirmed. You’ll see it on this invoice.',
  };
}

const QUOTE_TONE: Record<Quote['status'], { label: string; tone: Tone }> = {
  SUBMITTED: { label: 'To decide', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'neutral' },
};

export function QuotesSection({ w }: { w: WorkOrder }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const quotes = useQuery({
    queryKey: qk.homeCare.quotes(w.id),
    queryFn: () => homeCareApi.quotes(w.id),
  });
  const closed = w.status === 'RESOLVED' || w.status === 'CANCELLED';
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.homeCare.quotes(w.id) });
    qc.invalidateQueries({ queryKey: qk.homeCare.workOrder(w.id) });
  };
  const approve = useMutation({
    mutationFn: (quoteId: string) => homeCareApi.approveQuote(w.id, quoteId),
    onSuccess: () => {
      void haptics.success();
      refresh();
      toast.show('Quote approved. The job’s budget is set.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not approve it.'), 'error'),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      homeCareApi.rejectQuote(w.id, id, reason),
    onSuccess: () => {
      refresh();
      setRejecting(null);
      toast.show('Quote rejected.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not reject it.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="heading" headingLevel={2} style={{ flex: 1 }}>
          Quotes
        </Text>
        {!closed ? (
          <IconButton
            accessibilityLabel="Add a quote"
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => setAdding(true)}
          />
        ) : null}
      </View>
      {quotes.isPending ? (
        <Skeleton height={64} radius={radius.lg} />
      ) : !quotes.data?.items.length ? (
        <Text variant="callout" color="mutedForeground">
          {closed
            ? 'No quotes were recorded.'
            : 'Record a vendor’s estimate to compare prices and set the budget.'}
        </Text>
      ) : (
        quotes.data.items.map((q) => {
          const s = QUOTE_TONE[q.status];
          return (
            <Card key={q.id} elevated style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {q.vendor?.name ?? 'Vendor'}
                </Text>
                <Price amount={q.amount} variant="bodyStrong" />
              </View>
              <Text variant="callout">{q.scopeOfWork}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <StatusPill label={s.label} tone={s.tone} />
                {q.validUntil ? (
                  <Text variant="caption" color="mutedForeground">
                    Valid to {formatDate(q.validUntil, 'medium')}
                  </Text>
                ) : null}
              </View>
              {q.rejectionReason ? (
                <Text variant="caption" color="mutedForeground">
                  “{q.rejectionReason}”
                </Text>
              ) : null}
              {q.status === 'SUBMITTED' && !closed ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Reject"
                    variant="ghost"
                    style={{ flex: 1 }}
                    onPress={() => setRejecting(q.id)}
                  />
                  <Button
                    label="Approve"
                    style={{ flex: 1 }}
                    loading={approve.isPending && approve.variables === q.id}
                    onPress={() => approve.mutate(q.id)}
                  />
                </View>
              ) : null}
            </Card>
          );
        })
      )}
      <ReasonSheet
        open={!!rejecting}
        title="Reject this quote?"
        hint="Say why, for the record (e.g. over budget, chose another vendor)."
        action="Reject quote"
        busy={reject.isPending}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => reject.mutate({ id: rejecting!, reason })}
      />
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a quote">
        {adding ? (
          <QuoteForm
            w={w}
            onDone={() => {
              setAdding(false);
              refresh();
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function QuoteForm({ w, onDone }: { w: WorkOrder; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [vendorId, setVendorId] = useState<string | undefined>(w.assignedVendor?.id);
  const [amount, setAmount] = useState('');
  const [scope, setScope] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const value = Number(amount.replace(/\D/g, '')) || 0;
  const add = useMutation({
    mutationFn: () =>
      homeCareApi.addQuote(w.id, {
        vendorId,
        amount: value,
        scopeOfWork: scope.trim(),
        validUntil: validUntil ? new Date(`${validUntil}T23:59:00`).toISOString() : undefined,
      }),
    onSuccess: () => {
      void haptics.success();
      toast.show('Quote recorded.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <VendorPicker value={vendorId} onChange={setVendorId} />
        <NumberField label="Amount" required currency value={amount} onValueChange={setAmount} />
        <TextField
          label="Scope of work"
          required
          value={scope}
          onChangeText={setScope}
          multiline
          hint="What the vendor will do for this price."
        />
        <DateField
          label="Valid until (optional)"
          value={validUntil}
          onChange={setValidUntil}
          min={toISODate(new Date())}
        />
        {add.error ? (
          <FormAlert message={errorMessage(add.error, 'Could not record the quote.')} />
        ) : null}
        <Button
          label="Record quote"
          disabled={!vendorId || !value || scope.trim().length < 3}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const INVOICE_TONE: Record<Invoice['status'], { label: string; tone: Tone }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  SUBMITTED: { label: 'To approve', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  VOID: { label: 'Void', tone: 'neutral' },
};

const PAYOUT_LABEL: Record<Invoice['payoutStatus'], string> = {
  PENDING: 'Not paid yet',
  PROCESSING: 'Payment on its way',
  PAID: 'Paid',
  FAILED: 'Payment failed',
};

export function InvoicesSection({ w }: { w: WorkOrder }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const checkout = usePaystackCheckout();
  const [adding, setAdding] = useState(false);
  const [payoutFor, setPayoutFor] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<{ kind: 'reject' | 'void'; id: string } | null>(null);
  const providers = usePaymentProviders();
  // Kept while the sheet slides away.
  const [payInv, setPayInv] = useState<Invoice | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);
  const closeSheet = () => {
    setSheetOpen(false);
    setProviderError(null);
  };
  const invoices = useQuery({
    queryKey: qk.homeCare.invoices(w.id),
    queryFn: () => homeCareApi.invoices(w.id),
  });
  const paymentPreview = useQuery({
    queryKey: qk.homeCare.invoicePaymentPreview(payInv?.id ?? '', providers.provider),
    queryFn: () => homeCareApi.invoicePaymentPreview(payInv!.id, providers.provider),
    enabled: sheetOpen && !!payInv,
    retry: false,
  });
  const payCopy = payInv
    ? vendorPayCopy(
        payInv,
        paymentPreview,
        providers.options.find((o) => o.provider === providers.provider)?.label ??
          'the payment company'
      )
    : null;
  const refresh = () => qc.invalidateQueries({ queryKey: qk.homeCare.invoices(w.id) });
  const act = useMutation({
    mutationFn: async ({
      kind,
      id,
      reason,
      provider,
    }: {
      kind: 'submit' | 'approve' | 'reject' | 'void' | 'pay';
      id: string;
      reason?: string;
      provider?: PaymentProvider;
    }) => {
      if (kind === 'submit') return homeCareApi.submitInvoice(id);
      if (kind === 'approve') return homeCareApi.approveInvoice(id);
      if (kind === 'reject') return homeCareApi.rejectInvoice(id, reason!);
      if (kind === 'void') return homeCareApi.voidInvoice(id, reason!);
      return homeCareApi.payInvoice(id, provider);
    },
    onMutate: (v) => {
      if (v.kind === 'pay') setProviderError(null);
    },
    onSuccess: async (result, v) => {
      if (v.kind === 'pay') closeSheet();
      // The owner's held rent doesn't cover it: pay the shortfall on Paystack,
      // and the vendor is paid once it lands.
      const topUp =
        v.kind === 'pay' && result && typeof result === 'object' && 'topUp' in result
          ? (result as { topUp?: { authorizationUrl: string; reference: string } }).topUp
          : undefined;
      if (topUp) {
        setReasonFor(null);
        await checkout(topUp.authorizationUrl, topUp.reference);
        refresh();
        return;
      }
      void haptics.success();
      refresh();
      setReasonFor(null);
      toast.show(
        {
          submit: 'Invoice submitted.',
          approve: 'Invoice approved.',
          reject: 'Invoice rejected.',
          void: 'Invoice voided.',
          pay: 'Payment sent to the vendor.',
        }[v.kind],
        'success'
      );
    },
    onError: (e, v) => {
      void haptics.error();
      // That company cannot take the top-up right now: the choice moves to the other one.
      const unavailable = v.kind === 'pay' ? providers.recover(e, v.provider) : null;
      if (unavailable) {
        setProviderError(unavailable);
        return;
      }
      if (v.kind === 'pay') closeSheet();
      const message = errorMessage(e, 'That didn’t go through.');
      if (v.kind === 'pay' && /payout account/i.test(message)) {
        const inv = invoices.data?.items.find((i) => i.id === v.id);
        if (inv) setPayoutFor(inv.vendorId);
        return;
      }
      toast.show(message, 'error');
    },
  });
  const withReason = (kind: 'reject' | 'void', id: string) => setReasonFor({ kind, id });

  const canInvoice = w.status === 'RESOLVED' && !!w.assignedVendor;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="heading" headingLevel={2} style={{ flex: 1 }}>
          Invoices
        </Text>
        {canInvoice ? (
          <IconButton
            accessibilityLabel="Add an invoice"
            icon={<Plus size={20} color={colors.primary} />}
            onPress={() => setAdding(true)}
          />
        ) : null}
      </View>
      {invoices.isPending ? (
        <Skeleton height={64} radius={radius.lg} />
      ) : !invoices.data?.items.length ? (
        <Text variant="callout" color="mutedForeground">
          {canInvoice
            ? 'Record the vendor’s bill to approve and pay it.'
            : 'Invoice the vendor once the job is resolved.'}
        </Text>
      ) : (
        invoices.data.items.map((inv) => {
          const s = INVOICE_TONE[inv.status];
          const busy = act.isPending && act.variables?.id === inv.id;
          return (
            <Card key={inv.id} elevated style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{inv.vendor?.name ?? 'Vendor'}</Text>
                  <Text variant="caption" color="mutedForeground">
                    {inv.invoiceNumber ? `#${inv.invoiceNumber} · ` : ''}
                    {formatDate(inv.createdAt, 'medium')}
                  </Text>
                </View>
                <Price amount={inv.totalAmount} variant="bodyStrong" />
              </View>
              {inv.lineItems.map((l, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
                    {l.quantity} × {l.description}
                  </Text>
                  <Text variant="caption">{naira(l.totalAmount ?? l.quantity * l.unitAmount)}</Text>
                </View>
              ))}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: spacing.sm,
                }}
              >
                <StatusPill label={s.label} tone={s.tone} />
                {inv.status === 'APPROVED' ? (
                  <StatusPill
                    label={PAYOUT_LABEL[inv.payoutStatus]}
                    tone={
                      inv.payoutStatus === 'PAID'
                        ? 'success'
                        : inv.payoutStatus === 'FAILED'
                          ? 'danger'
                          : 'info'
                    }
                  />
                ) : null}
              </View>
              {inv.rejectionReason || inv.voidReason ? (
                <Text variant="caption" color="mutedForeground">
                  “{inv.rejectionReason ?? inv.voidReason}”
                </Text>
              ) : null}
              {inv.status === 'DRAFT' ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <Button
                    label="Void"
                    variant="ghost"
                    style={{ flex: 1 }}
                    disabled={busy}
                    onPress={() => withReason('void', inv.id)}
                  />
                  <Button
                    label="Submit"
                    style={{ flex: 1 }}
                    loading={busy}
                    onPress={() => act.mutate({ kind: 'submit', id: inv.id })}
                  />
                </View>
              ) : inv.status === 'SUBMITTED' ? (
                <View style={{ gap: spacing.sm }}>
                  <InvoiceCheckCard invoiceId={inv.id} />
                  <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Button
                      label="Reject"
                      variant="ghost"
                      style={{ flex: 1 }}
                      disabled={busy}
                      onPress={() => withReason('reject', inv.id)}
                    />
                    <Button
                      label="Approve"
                      style={{ flex: 1 }}
                      loading={busy}
                      onPress={() => act.mutate({ kind: 'approve', id: inv.id })}
                    />
                  </View>
                </View>
              ) : inv.status === 'APPROVED' &&
                (inv.payoutStatus === 'PENDING' || inv.payoutStatus === 'FAILED') ? (
                <View style={{ gap: spacing.sm }}>
                  <Button
                    label={`${inv.payoutStatus === 'FAILED' ? 'Retry payment' : 'Pay'} ${naira(inv.totalAmount)}`}
                    loading={busy}
                    onPress={() => {
                      setPayInv(inv);
                      setProviderError(null);
                      setSheetOpen(true);
                    }}
                  />
                </View>
              ) : null}
            </Card>
          );
        })
      )}
      <ReasonSheet
        open={!!reasonFor}
        title={reasonFor?.kind === 'reject' ? 'Reject this invoice?' : 'Void this invoice?'}
        hint={
          reasonFor?.kind === 'reject'
            ? 'Say what’s wrong so it can be corrected and resubmitted.'
            : 'Voiding removes it for good. Say why, for the record.'
        }
        action={reasonFor?.kind === 'reject' ? 'Reject invoice' : 'Void invoice'}
        busy={act.isPending}
        onClose={() => setReasonFor(null)}
        onConfirm={(reason) => act.mutate({ kind: reasonFor!.kind, id: reasonFor!.id, reason })}
      />
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add an invoice">
        {adding ? (
          <InvoiceForm
            w={w}
            onDone={() => {
              setAdding(false);
              refresh();
            }}
          />
        ) : null}
      </Sheet>
      <PaySheet
        open={sheetOpen && !!payInv}
        onClose={closeSheet}
        title="Pay vendor"
        context={
          payInv
            ? `${payInv.vendor?.name ?? 'Vendor'}${payInv.invoiceNumber ? ` · #${payInv.invoiceNumber}` : ''}`
            : null
        }
        owed={payInv?.totalAmount ?? 0}
        owedLabel="invoice"
        amount={payInv?.totalAmount ?? 0}
        itemLabel="Invoice"
        itemParts={payCopy?.parts}
        breakdown={false}
        ready={!payCopy?.notReady}
        notReadyLabel={payCopy?.notReady}
        payLabel={payCopy?.buttonLabel}
        note={
          payCopy ? (
            <View style={{ gap: spacing.sm }}>
              {payCopy.error ? <FormAlert tone="error" message={payCopy.error} /> : null}
              <Text variant="callout" color="mutedForeground">
                {payCopy.note}
              </Text>
            </View>
          ) : null
        }
        secureLine={payCopy?.secureLine}
        protection={payCopy?.protection}
        providers={providers}
        providerError={providerError}
        busy={act.isPending && act.variables?.kind === 'pay'}
        onPay={() =>
          payInv && act.mutate({ kind: 'pay', id: payInv.id, provider: providers.provider })
        }
      />
      <Sheet open={!!payoutFor} onClose={() => setPayoutFor(null)} title="Vendor’s bank account">
        {payoutFor ? (
          <VendorPayoutForm vendorId={payoutFor} onDone={() => setPayoutFor(null)} />
        ) : null}
      </Sheet>
    </View>
  );
}

function InvoiceForm({ w, onDone }: { w: WorkOrder; onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const [number, setNumber] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: '', quantity: 1, unitAmount: 0 },
  ]);
  const total = sumLines(lines);
  const budget = w.approvedCost ?? undefined;
  const setLine = (i: number, p: Partial<InvoiceLine>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const valid = lines.every((l) => l.description.trim() && l.quantity >= 1 && l.unitAmount >= 1);
  const add = useMutation({
    mutationFn: () =>
      homeCareApi.addInvoice(w.id, {
        vendorId: w.assignedVendor!.id,
        invoiceNumber: number.trim() || undefined,
        completionNote: note.trim() || undefined,
        lineItems: lines.map((l) => ({
          description: l.description.trim(),
          quantity: l.quantity,
          unitAmount: l.unitAmount,
        })),
      }),
    onSuccess: () => {
      void haptics.success();
      toast.show('Invoice saved as a draft. Submit it when it’s right.', 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          From {w.assignedVendor?.name}. {budget != null ? `Budget ${naira(budget)}.` : ''}
        </Text>
        <TextField
          label="Vendor’s invoice number"
          optional
          value={number}
          onChangeText={setNumber}
          maxLength={120}
        />
        {lines.map((l, i) => (
          <Card key={i} style={{ gap: spacing.sm, backgroundColor: colors.secondary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <TextField
                  label={`Item ${i + 1}`}
                  required
                  value={l.description}
                  onChangeText={(description) => setLine(i, { description })}
                />
              </View>
              {lines.length > 1 ? (
                <IconButton
                  accessibilityLabel={`Remove item ${i + 1}`}
                  icon={<Trash2 size={17} color={colors.mutedForeground} />}
                  onPress={() => setLines((ls) => ls.filter((_, j) => j !== i))}
                />
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ width: 90 }}>
                <NumberField
                  label="Qty"
                  required
                  value={String(l.quantity || '')}
                  onValueChange={(v) => setLine(i, { quantity: Number(v) || 0 })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <NumberField
                  label="Unit price"
                  required
                  currency
                  value={l.unitAmount ? String(l.unitAmount) : ''}
                  onValueChange={(v) => setLine(i, { unitAmount: Number(v) || 0 })}
                />
              </View>
            </View>
          </Card>
        ))}
        <LinkButton
          label="Add item"
          icon={<Plus size={16} color={colors.primary} />}
          onPress={() => setLines((ls) => [...ls, { description: '', quantity: 1, unitAmount: 0 }])}
          style={{ alignSelf: 'flex-start' }}
        />
        <Divider />
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text variant="bodyStrong" style={{ flex: 1 }}>
            Total
          </Text>
          <Price amount={total} variant="heading" />
        </View>
        {budget != null && total > budget ? (
          <FormAlert
            tone="warning"
            message={`That’s ${naira(total - budget)} over the approved budget; it won’t be approvable.`}
          />
        ) : null}
        <TextField label="Completion note" optional value={note} onChangeText={setNote} multiline />
        {add.error ? (
          <FormAlert message={errorMessage(add.error, 'Could not save the invoice.')} />
        ) : null}
        <Button
          label="Save draft"
          disabled={!valid || !total}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function VendorPayoutForm({ vendorId, onDone }: { vendorId: string; onDone: () => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [lookup, setLookup] = useState<AccountLookup>(INCOMPLETE_ACCOUNT_LOOKUP);
  // Behind "confirm it's you": apiFetch prompts for it automatically.
  const save = useMutation({
    mutationFn: () =>
      withStepUpSummary(
        payoutAccountStepUpSummary({
          bankName: lookup.bankName,
          accountNumber,
          accountName: lookup.accountName,
          owner: 'this vendor’s',
        }),
        () =>
          apiFetch<{ accountName: string }>(`/home-management/vendors/${vendorId}/payout-account`, {
            method: 'POST',
            body: { bankCode, accountNumber },
          })
      ),
    onSuccess: (a) => {
      void haptics.success();
      toast.show(`Saved: ${a.accountName}. Try the payment again.`, 'success');
      onDone();
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          This vendor has no bank account on file yet. Add it to pay them.
        </Text>
        <BankAccountFields
          bankCode={bankCode}
          onBankCode={setBankCode}
          accountNumber={accountNumber}
          onAccountNumber={setAccountNumber}
          onLookup={setLookup}
        />
        {save.error ? (
          <FormAlert message={errorMessage(save.error, 'We couldn’t check that account.')} />
        ) : null}
        <Button
          label={saveAccountLabel(lookup, 'Save account')}
          disabled={!lookupAllowsSave(lookup)}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
