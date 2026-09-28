import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react-native';
import {
  Button,
  Card,
  Chip,
  DateField,
  Divider,
  FormAlert,
  IconButton,
  Price,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  homeCareApi,
  sumLines,
  type Invoice,
  type InvoiceLine,
  type Quote,
  type WorkOrder,
} from '@/lib/api/homeCare';
import { COMMON_BANKS } from '@/lib/api/sellerPayout';
import { apiFetch, ApiError } from '@/lib/api/client';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { Sheet } from '@/components/Sheet';
import { StatusPill, type Tone } from '@/components/host/HostUI';
import { VendorPicker } from './VendorPicker';
import { ReasonSheet } from './ReasonSheet';

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const err = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/* --------------------------------- quotes --------------------------------- */

const QUOTE_TONE: Record<Quote['status'], { label: string; tone: Tone }> = {
  SUBMITTED: { label: 'To decide', tone: 'warning' },
  APPROVED: { label: 'Approved', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'neutral' },
};

/** Vendors' estimates for the job; approving one sets the budget. */
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
    onError: (e) => toast.show(err(e, 'Could not approve it.'), 'error'),
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      homeCareApi.rejectQuote(w.id, id, reason),
    onSuccess: () => {
      refresh();
      setRejecting(null);
      toast.show('Quote rejected.', 'success');
    },
    onError: (e) => toast.show(err(e, 'Could not reject it.'), 'error'),
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
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
        <TextField
          label="Amount (₦)"
          keyboardType="number-pad"
          value={value ? value.toLocaleString('en-NG') : ''}
          onChangeText={setAmount}
        />
        <TextField
          label="Scope of work"
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
        {add.error ? <FormAlert message={err(add.error, 'Could not record the quote.')} /> : null}
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

/* -------------------------------- invoices -------------------------------- */

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

/** The vendor's bill for the finished job: draft → submit → approve → pay. */
export function InvoicesSection({ w }: { w: WorkOrder }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [payoutFor, setPayoutFor] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<{ kind: 'reject' | 'void'; id: string } | null>(null);
  const invoices = useQuery({
    queryKey: qk.homeCare.invoices(w.id),
    queryFn: () => homeCareApi.invoices(w.id),
  });
  const refresh = () => qc.invalidateQueries({ queryKey: qk.homeCare.invoices(w.id) });
  const act = useMutation({
    mutationFn: async ({
      kind,
      id,
      reason,
    }: {
      kind: 'submit' | 'approve' | 'reject' | 'void' | 'pay';
      id: string;
      reason?: string;
    }) => {
      if (kind === 'submit') return homeCareApi.submitInvoice(id);
      if (kind === 'approve') return homeCareApi.approveInvoice(id);
      if (kind === 'reject') return homeCareApi.rejectInvoice(id, reason!);
      if (kind === 'void') return homeCareApi.voidInvoice(id, reason!);
      return homeCareApi.payInvoice(id);
    },
    onSuccess: (_r, v) => {
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
      const message = err(e, 'That didn’t go through.');
      // The API names the missing payout account; offer to add it right here.
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
        <Text variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
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
              ) : inv.status === 'APPROVED' &&
                (inv.payoutStatus === 'PENDING' || inv.payoutStatus === 'FAILED') ? (
                <Button
                  label={`${inv.payoutStatus === 'FAILED' ? 'Retry payment' : 'Pay'} ${naira(inv.totalAmount)}`}
                  loading={busy}
                  onPress={() =>
                    Alert.alert(
                      `Pay ${inv.vendor?.name ?? 'the vendor'} ${naira(inv.totalAmount)}?`,
                      'Sent to their bank account on file.',
                      [
                        { text: 'Not now', style: 'cancel' },
                        { text: 'Pay', onPress: () => act.mutate({ kind: 'pay', id: inv.id }) },
                      ]
                    )
                  }
                />
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
          label="Vendor’s invoice number (optional)"
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
                <TextField
                  label="Qty"
                  keyboardType="number-pad"
                  value={String(l.quantity || '')}
                  onChangeText={(v) => setLine(i, { quantity: Number(v.replace(/\D/g, '')) || 0 })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="Unit price (₦)"
                  keyboardType="number-pad"
                  value={l.unitAmount ? l.unitAmount.toLocaleString('en-NG') : ''}
                  onChangeText={(v) =>
                    setLine(i, { unitAmount: Number(v.replace(/\D/g, '')) || 0 })
                  }
                />
              </View>
            </View>
          </Card>
        ))}
        <Pressable
          onPress={() => setLines((ls) => [...ls, { description: '', quantity: 1, unitAmount: 0 }])}
          accessibilityRole="button"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
        >
          <Plus size={16} color={colors.primary} />
          <Text variant="callout" color="primary" style={{ fontWeight: '700' }}>
            Add item
          </Text>
        </Pressable>
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
        <TextField
          label="Completion note (optional)"
          value={note}
          onChangeText={setNote}
          multiline
        />
        {add.error ? <FormAlert message={err(add.error, 'Could not save the invoice.')} /> : null}
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
  // Behind "confirm it's you": apiFetch prompts for it automatically.
  const save = useMutation({
    mutationFn: () =>
      apiFetch<{ accountName: string }>(`/home-management/vendors/${vendorId}/payout-account`, {
        method: 'POST',
        body: { bankCode, accountNumber },
      }),
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {COMMON_BANKS.map((b) => (
            <Chip
              key={b.code}
              label={b.name}
              size="sm"
              selected={bankCode === b.code}
              onPress={() => setBankCode(b.code)}
            />
          ))}
        </View>
        <TextField
          label="Account number"
          keyboardType="number-pad"
          maxLength={10}
          value={accountNumber}
          onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
        />
        {save.error ? (
          <FormAlert message={err(save.error, 'We couldn’t check that account.')} />
        ) : null}
        <Button
          label="Save account"
          disabled={!bankCode || accountNumber.length !== 10}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
