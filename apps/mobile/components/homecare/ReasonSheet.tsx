import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Text, TextField, useTheme } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';

/** Ask for a short written reason before a rejection, void or cancellation (both platforms). */
export function ReasonSheet({
  open,
  title,
  hint,
  action,
  min = 3,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  hint: string;
  action: string;
  min?: number;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {open ? (
        <Form hint={hint} action={action} min={min} busy={busy} onConfirm={onConfirm} />
      ) : null}
    </Sheet>
  );
}

function Form({
  hint,
  action,
  min,
  busy,
  onConfirm,
}: {
  hint: string;
  action: string;
  min: number;
  busy?: boolean;
  onConfirm: (reason: string) => void;
}) {
  const { spacing } = useTheme();
  const [reason, setReason] = useState('');
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <Text variant="callout" color="mutedForeground">
          {hint}
        </Text>
        <TextField
          label="Reason"
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={1000}
          autoFocus
        />
        <Button
          label={action}
          variant="destructive"
          disabled={reason.trim().length < min}
          loading={busy}
          onPress={() => onConfirm(reason.trim())}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
