import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Chip,
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
import { localInstant } from '@/lib/api/realtor';
import { viewingsApi } from '@/lib/api/viewings';

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
  const [mode, setMode] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  // Video viewings are offered only once the call service is set up.
  const videoCalls = useQuery({
    queryKey: ['video-calls', 'availability'],
    queryFn: viewingsApi.videoCallsAvailable,
    staleTime: 5 * 60 * 1000,
  });
  const canVideo = videoCalls.data?.available === true;
  // The time the buyer means, where they are. It used to be sent as if it were
  // UTC, which put a 10:00 request at 11:00 for a seller in Lagos.
  const scheduledAt = localInstant(date, time || '10:00');

  const mutation = useMutation({
    mutationFn: () =>
      buyerViewingsApi.create(
        listing.id,
        scheduledAt!,
        notes.trim() || undefined,
        canVideo ? mode : 'IN_PERSON'
      ),
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

  const canSubmit = !!scheduledAt;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Ask to view <Text variant="bodyStrong">{listing.title}</Text>.
      </Text>
      <DateField label="Date" value={date} onChange={setDate} min={toISODate(new Date())} />
      <TimeField label="Time" value={time} onChange={setTime} />
      {canVideo ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">How would you like to view it?</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Chip
              label="Visit in person"
              selected={mode === 'IN_PERSON'}
              onPress={() => setMode('IN_PERSON')}
            />
            <Chip
              label="Live video call"
              selected={mode === 'VIDEO'}
              onPress={() => setMode('VIDEO')}
            />
          </View>
          {mode === 'VIDEO' ? (
            <Text variant="caption" color="mutedForeground">
              The owner walks you through it on a video call once they confirm. Join it from
              Viewings.
            </Text>
          ) : null}
        </View>
      ) : null}
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
