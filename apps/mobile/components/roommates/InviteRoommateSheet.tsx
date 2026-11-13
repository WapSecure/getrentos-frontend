import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { roommatesApi } from '@/lib/api/roommates';
import { errorMessage } from '@/lib/api/client';
import { isNoAccountMessage, readContactInput } from '@sureground/shared';
import { contactProblem, contactReady } from '@/lib/contact';
import { InviteToSignUp } from '@/components/contact/InviteToSignUp';

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
  const [contact, setContact] = useState('');
  const [touched, setTouched] = useState(false);
  const [noAccount, setNoAccount] = useState(false);
  const [message, setMessage] = useState('');
  const isPhone = readContactInput(contact).kind === 'phone';

  const mutation = useMutation({
    mutationFn: () => roommatesApi.invite(contact, message.trim() || undefined),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.roommates });
      toast.show('Invite sent.', 'success');
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
        They&apos;ll be able to split rent and shared expenses with you once they accept.
      </Text>
      <TextField
        label="Their phone number or email"
        required
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
        hint={
          isPhone
            ? 'If they are on Sureground, they get the invite in their app.'
            : 'If they are not on Sureground yet, we email them an invite to sign up.'
        }
        editable={!mutation.isPending}
      />
      {noAccount ? (
        <InviteToSignUp
          message="Nobody on Sureground uses that phone number yet, and we cannot text an invite. Send them the signup link instead."
          reason="share rent and household costs with you"
          footnote="Once they have signed up, invite them here with the same phone number."
        />
      ) : null}
      <TextField
        label="Personal message"
        optional
        placeholder="Hey, join our flat on Sureground"
        multiline
        numberOfLines={3}
        value={message}
        onChangeText={setMessage}
        editable={!mutation.isPending}
      />
      <Button
        label="Send invite"
        loading={mutation.isPending}
        disabled={mutation.isPending || !contactReady(contact)}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
