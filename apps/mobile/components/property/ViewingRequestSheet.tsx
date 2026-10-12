import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { viewingsApi } from '@/lib/api/viewings';
import { ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics';

interface Props {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

export function ViewingRequestSheet({ open, onClose, propertyId, propertyTitle }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Request a viewing">
      {/* Remount on each open so the note field always starts blank. */}
      <ViewingRequestForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        propertyId={propertyId}
        propertyTitle={propertyTitle}
      />
    </Sheet>
  );
}

function ViewingRequestForm({ onClose, propertyId, propertyTitle }: Omit<Props, 'open'>) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [mode, setMode] = useState<'IN_PERSON' | 'VIDEO'>('IN_PERSON');
  // Video viewings are offered only once the call service is set up.
  const videoCalls = useQuery({
    queryKey: ['video-calls', 'availability'],
    queryFn: viewingsApi.videoCallsAvailable,
    staleTime: 5 * 60 * 1000,
  });
  const canVideo = videoCalls.data?.available === true;

  const mutation = useMutation({
    mutationFn: () =>
      viewingsApi.create(propertyId, notes.trim() || undefined, canVideo ? mode : 'IN_PERSON'),
    onSuccess: () => {
      track('viewing_requested', { propertyId, mode });
      qc.invalidateQueries({ queryKey: qk.renter.viewings });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
      toast.show('Viewing requested: the landlord will confirm a time.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not request a viewing.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Ask to view <Text variant="bodyStrong">{propertyTitle}</Text>. The landlord will confirm a
        time that works.
      </Text>
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
              The landlord walks you through it on a video call at the time they confirm. Join it
              from Viewings.
            </Text>
          ) : null}
        </View>
      ) : null}
      <TextField
        label="Note for the landlord (optional)"
        placeholder="e.g. Available weekday evenings"
        multiline
        numberOfLines={3}
        value={notes}
        onChangeText={setNotes}
      />
      <Button
        label="Request viewing"
        loading={mutation.isPending}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
