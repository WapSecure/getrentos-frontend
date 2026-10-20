import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { roommatesApi } from '@/lib/api/roommates';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteRoommateSheet({ open, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Invite a roommate">
      {/* Remount on each open so the form always starts blank. */}
      <InviteRoommateForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        onSubmittingChange={setSubmitting}
      />
    </Sheet>
  );
}

function InviteRoommateForm({
  onClose,
  onSubmittingChange,
}: Omit<Props, 'open'> & { onSubmittingChange: (submitting: boolean) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: () => roommatesApi.invite(email.trim(), message.trim() || undefined),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.roommates });
      toast.show('Invite sent.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not send this invite.', 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        They&apos;ll be able to split rent and shared expenses with you once they accept.
      </Text>
      <TextField
        label="Email address"
        required
        placeholder="roommate@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!mutation.isPending}
      />
      <TextField
        label="Personal message"
        optional
        placeholder="Hey, join our flat on GetRentos"
        multiline
        numberOfLines={3}
        value={message}
        onChangeText={setMessage}
        editable={!mutation.isPending}
      />
      <Button
        label="Send invite"
        loading={mutation.isPending}
        disabled={mutation.isPending || !email.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
