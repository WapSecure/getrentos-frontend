import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { agentClientsApi } from '@/lib/api/agentClients';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteClientSheet({ open, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Invite a client">
      {/* Remount on each open so the form always starts blank. */}
      <InviteClientForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        onSubmittingChange={setSubmitting}
      />
    </Sheet>
  );
}

function InviteClientForm({
  onClose,
  onSubmittingChange,
}: Omit<Props, 'open'> & { onSubmittingChange: (submitting: boolean) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => agentClientsApi.invite(email.trim()),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'clients'] });
      toast.show('Invitation sent.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not send this invite.', 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Invite a landlord or property owner to authorize you as their field agent.
      </Text>
      <TextField
        label="Their email address"
        placeholder="landlord@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        required
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
