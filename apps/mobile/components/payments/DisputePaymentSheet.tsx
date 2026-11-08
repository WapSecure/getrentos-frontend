import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { paymentsApi, type Payment } from '@/lib/api/payments';
import { errorMessage } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  payment: Payment | null;
}

export function DisputePaymentSheet({ open, onClose, payment }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Report a problem">
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
    onSuccess: () => {
      // The history loads page by page, so refresh every payment list rather than patch one.
      qc.invalidateQueries({ queryKey: qk.renter.paymentsAll });
      toast.show('Report sent: we’ll review it within 2 business days.', 'success');
      onClose();
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not send your report.'), 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Tell us what&apos;s wrong with <Text variant="bodyStrong">{payment.description}</Text> (
        {formatNaira(payment.amount)}). We&apos;ll keep holding the money and won&apos;t pay it out
        while it&apos;s reviewed.
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
        label="Send report"
        variant="destructive"
        loading={mutation.isPending}
        disabled={mutation.isPending || !reason.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
