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
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { securityApi } from '@/lib/api/security';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged?: (phone: string) => void;
}

/**
 * A phone number on the account changes only after the new number proves
 * itself with a code: it can receive password reset codes. The API asks the
 * account holder to confirm it's them first (the StepUpSheet at the root
 * handles that), signs out other devices and emails an alert.
 */
export function ChangePhoneSheet({ open, onClose, onChanged }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Change phone number">
      <Form key={open ? 'open' : 'closed'} onClose={onClose} onChanged={onChanged} />
    </Sheet>
  );
}

function Form({ onClose, onChanged }: Omit<Props, 'open'>) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const { refreshProfile } = useAuth();
  const [newPhone, setNewPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState<{ reference: string; sentTo: string } | null>(null);

  const start = useMutation({
    mutationFn: () => securityApi.startPhoneChange(newPhone.trim()),
    onSuccess: setSent,
  });
  const confirm = useMutation({
    mutationFn: () => securityApi.confirmPhoneChange(sent!.reference, code),
    onSuccess: async ({ phone }) => {
      onChanged?.(phone);
      await refreshProfile();
      qc.invalidateQueries();
      toast.show('Phone number changed.', 'success');
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
              We’ll text a code to the new number to make sure it’s yours.
            </Text>
            <TextField
              label="New phone number"
              placeholder="+234 801 234 5678"
              value={newPhone}
              // Digits and one leading "+" only.
              onChangeText={(v) => setNewPhone(v.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, ''))}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              autoFocus
            />
          </>
        )}
        {error ? (
          <FormAlert message={errorMessage(error, 'That didn’t go through. Try again.')} />
        ) : null}
        <Button
          label={sent ? 'Confirm' : 'Send code'}
          loading={start.isPending || confirm.isPending}
          disabled={sent ? code.length !== 6 : newPhone.replace(/\D/g, '').length < 7}
          onPress={() => (sent ? confirm.mutate() : start.mutate())}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
