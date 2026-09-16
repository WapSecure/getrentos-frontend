import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
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

  const mutation = useMutation({
    mutationFn: () => viewingsApi.create(propertyId, notes.trim() || undefined),
    onSuccess: () => {
      track('viewing_requested', { propertyId });
      qc.invalidateQueries({ queryKey: qk.renter.viewings });
      qc.invalidateQueries({ queryKey: qk.renter.dashboardStats });
      toast.show('Viewing requested — the landlord will confirm a time.', 'success');
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
