import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
  Text,
  TextField,
  TimeField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { messagesApi } from '@/lib/api/messages';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function MessageReminderSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="New reminder">
      {/* Remount per open so a dismissed draft never reappears. */}
      <MessageReminderForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function MessageReminderForm({ onClose }: { onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const mutation = useMutation({
    mutationFn: () => messagesApi.createReminder({ message: message.trim(), date, time }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.messageReminders });
      toast.show('Reminder set.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not set that reminder.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        We&apos;ll nudge you at this time so a follow-up never slips.
      </Text>

      <TextField
        label="Remind me to"
        placeholder="e.g. Chase the landlord about the lease"
        value={message}
        onChangeText={setMessage}
      />

      <DateField label="Date" value={date} onChange={setDate} min={toISODate(new Date())} />

      <TimeField label="Time" value={time} onChange={setTime} />

      <Button
        label="Set reminder"
        loading={mutation.isPending}
        disabled={!message.trim() || !date || !time}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
