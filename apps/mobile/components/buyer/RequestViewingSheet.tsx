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
import { buyerViewingsApi } from '@/lib/api/buyerViewings';
import type { BuyerListing } from '@/lib/api/buyer';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  listing: BuyerListing | null;
}

export function RequestViewingSheet({ open, onClose, listing }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Request a viewing">
      {/* Remount on each open so the form always starts blank. */}
      {listing ? (
        <RequestForm key={open ? 'open' : 'closed'} onClose={onClose} listing={listing} />
      ) : null}
    </Sheet>
  );
}

function RequestForm({ onClose, listing }: { onClose: () => void; listing: BuyerListing }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      // The API renders `scheduledAt` back as its raw UTC wall-clock, so send the picked
      // time as-is rather than shifting it through the device's timezone.
      const scheduledAt = `${date}T${time || '10:00'}:00.000Z`;
      return buyerViewingsApi.create(listing.id, scheduledAt, notes.trim() || undefined);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyer', 'viewings'] });
      qc.invalidateQueries({ queryKey: qk.buyer.dashboard });
      toast.show('Viewing requested.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not request this viewing.',
        'error'
      ),
  });

  const canSubmit = date.length > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Ask to view <Text variant="bodyStrong">{listing.title}</Text>.
      </Text>
      <DateField label="Date" value={date} onChange={setDate} min={toISODate(new Date())} />
      <TimeField label="Time" value={time} onChange={setTime} />
      <TextField
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />
      <Button
        label="Request viewing"
        loading={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
