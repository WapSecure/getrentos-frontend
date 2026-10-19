import { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  DateField,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { leaseApi } from '@/lib/api/lease';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function LeaseTerminationSheet({ open, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title="Request lease termination"
    >
      {/* Remount on each open so the form always starts blank. */}
      <LeaseTerminationForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        onSubmittingChange={setSubmitting}
      />
    </Sheet>
  );
}

function LeaseTerminationForm({
  onClose,
  onSubmittingChange,
}: Omit<Props, 'open'> & { onSubmittingChange: (submitting: boolean) => void }) {
  const { spacing } = useTheme();
  const toast = useToast();
  const [noticeDate, setNoticeDate] = useState('');
  const [reason, setReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => leaseApi.requestTermination(noticeDate.trim(), reason.trim()),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      toast.show('Termination request sent to your landlord.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not send the request.', 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Ask to end your lease early. Your landlord will review the request: this doesn&apos;t cancel
        your lease on its own, and early termination may carry a penalty under your lease terms.
      </Text>
      <DateField
        label="Proposed move-out date"
        value={noticeDate}
        onChange={setNoticeDate}
        min={toISODate(new Date())}
        disabled={mutation.isPending}
      />
      <TextField
        label="Reason"
        placeholder="e.g. Relocating for work"
        multiline
        numberOfLines={3}
        value={reason}
        onChangeText={setReason}
        editable={!mutation.isPending}
        required
      />
      <Text variant="caption" color="warning">
        Check your lease agreement for notice-period and penalty terms before submitting.
      </Text>
      <Button
        label="Send request"
        variant="destructive"
        loading={mutation.isPending}
        disabled={mutation.isPending || !noticeDate.trim() || !reason.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
