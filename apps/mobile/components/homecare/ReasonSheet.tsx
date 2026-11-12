import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { Button, Text, TextField, useTheme } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';

export function ReasonSheet({
  open,
  title,
  hint,
  action,
  min = 3,
  busy,
  tone = 'destructive',
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  hint: string;
  action: string;
  min?: number;
  busy?: boolean;
  /** `primary` when the reason lets something go ahead rather than refusing it. */
  tone?: 'destructive' | 'primary';
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {open ? (
        <Form hint={hint} action={action} min={min} busy={busy} tone={tone} onConfirm={onConfirm} />
      ) : null}
    </Sheet>
  );
}

function Form({
  hint,
  action,
  min,
  busy,
  tone,
  onConfirm,
}: {
  hint: string;
  action: string;
  min: number;
  busy?: boolean;
  tone: 'destructive' | 'primary';
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
          required
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={1000}
          autoFocus
        />
        <Button
          label={action}
          variant={tone}
          disabled={reason.trim().length < min}
          loading={busy}
          onPress={() => onConfirm(reason.trim())}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
