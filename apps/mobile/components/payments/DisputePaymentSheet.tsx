import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { paymentsApi, type Payment } from '@/lib/api/payments';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export function DisputePaymentSheet({ open, onClose, payment }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title="Dispute this payment"
    >
      {/* Remount on each open so the reason field always starts blank. */}
      {payment ? (
        <DisputePaymentForm
          key={open ? 'open' : 'closed'}
          onClose={onClose}
          onSubmittingChange={setSubmitting}
          payment={payment}
        />
      ) : null}
    </Sheet>
  );
}

function DisputePaymentForm({
  onClose,
  onSubmittingChange,
  payment,
}: {
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
  payment: Payment;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => paymentsApi.dispute(payment.id, reason.trim()),
    onMutate: () => onSubmittingChange(true),
    onSuccess: (updated) => {
      qc.setQueryData(
        qk.renter.payments(1, 50),
        (old: Awaited<ReturnType<typeof paymentsApi.list>> | undefined) =>
          old ? { ...old, items: old.items.map((p) => (p.id === updated.id ? updated : p)) } : old
      );
      toast.show('Dispute submitted: we’ll review it within 2 business days.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not submit the dispute.', 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Tell us what&apos;s wrong with <Text variant="bodyStrong">{payment.description}</Text> (₦
        {payment.amount.toLocaleString()}). We&apos;ll keep holding the money and won&apos;t pay it
        out while it&apos;s reviewed.
      </Text>
      <TextField
        label="Reason"
        placeholder="e.g. I was charged twice for this month"
        multiline
        numberOfLines={4}
        value={reason}
        onChangeText={setReason}
        editable={!mutation.isPending}
        required
      />
      <Button
        label="Submit dispute"
        variant="destructive"
        loading={mutation.isPending}
        disabled={mutation.isPending || !reason.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
