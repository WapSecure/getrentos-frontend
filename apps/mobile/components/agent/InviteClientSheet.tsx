import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { agentClientsApi } from '@/lib/api/agentClients';
import { errorMessage } from '@/lib/api/client';
import { isNoAccountMessage } from '@sureground/shared';
import { CONTACT_HINT, contactProblem, contactReady } from '@/lib/contact';
import { InviteToSignUp } from '@/components/contact/InviteToSignUp';

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
  const [contact, setContact] = useState('');
  const [touched, setTouched] = useState(false);
  const [noAccount, setNoAccount] = useState(false);

  const mutation = useMutation({
    mutationFn: () => agentClientsApi.invite(contact),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'clients'] });
      toast.show('Invitation sent.', 'success');
      onClose();
    },
    onError: (err) => {
      const text = errorMessage(err, 'Could not send this invite.');
      if (isNoAccountMessage(text)) setNoAccount(true);
      else toast.show(text, 'error');
    },
    onSettled: () => onSubmittingChange(false),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Invite a landlord or property owner to authorise you as their field agent.
      </Text>
      <TextField
        label="Their phone number or email"
        placeholder="0803 123 4567"
        autoCapitalize="none"
        autoCorrect={false}
        value={contact}
        onChangeText={(v) => {
          setContact(v);
          setNoAccount(false);
        }}
        onBlur={() => setTouched(true)}
        error={touched ? contactProblem(contact) : undefined}
        hint={CONTACT_HINT}
        required
        editable={!mutation.isPending}
      />
      {noAccount ? (
        <InviteToSignUp
          message="Nobody on Sureground uses that phone number or email yet. Send them the signup link; they should sign up as a landlord or owner."
          reason="look after your properties as your field agent"
          footnote="Once they have signed up, invite them here with the same phone number or email."
        />
      ) : null}
      <Button
        label="Send invite"
        loading={mutation.isPending}
        disabled={mutation.isPending || !contactReady(contact)}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
