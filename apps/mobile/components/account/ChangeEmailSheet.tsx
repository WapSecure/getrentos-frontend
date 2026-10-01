import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  FormAlert,
  OtpInput,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { securityApi } from '@/lib/api/security';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface Props {
  open: boolean;
  onClose: () => void;
}

/**
 * The sign-in email changes only after the new address proves itself with a
 * code. The API asks the account holder to confirm it's them first: the
 * StepUpSheet at the root handles that: and emails the old address.
 */
export function ChangeEmailSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Change sign-in email">
      <Form key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function Form({ onClose }: { onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { refreshProfile } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState<{ reference: string; sentTo: string } | null>(null);

  const start = useMutation({
    mutationFn: () => securityApi.startEmailChange(newEmail.trim()),
    onSuccess: setSent,
  });
  const confirm = useMutation({
    mutationFn: () => securityApi.confirmEmailChange(sent!.reference, code),
    onSuccess: async ({ email }) => {
      await refreshProfile();
      qc.invalidateQueries();
      toast.show(`You’ll sign in with ${email} from now on.`, 'success');
      onClose();
    },
  });
  const error = start.error ?? confirm.error;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        {sent ? (
          <>
            <Text variant="callout">Enter the 6-digit code we sent to {sent.sentTo}.</Text>
            <OtpInput value={code} onChange={setCode} invalid={!!confirm.error} autoFocus />
          </>
        ) : (
          <>
            <Text variant="callout" color="mutedForeground">
              We’ll send a code to the new address to make sure it’s yours, and let your current
              address know it changed.
            </Text>
            <TextField
              label="New email"
              value={newEmail}
              onChangeText={setNewEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoFocus
            />
          </>
        )}
        {error ? (
          <FormAlert
            message={
              error instanceof ApiError ? error.message : 'That didn’t go through. Try again.'
            }
          />
        ) : null}
        <Button
          label={sent ? 'Confirm' : 'Send code'}
          loading={start.isPending || confirm.isPending}
          disabled={sent ? code.length !== 6 : !/^\S+@\S+\.\S+$/.test(newEmail.trim())}
          onPress={() => (sent ? confirm.mutate() : start.mutate())}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
