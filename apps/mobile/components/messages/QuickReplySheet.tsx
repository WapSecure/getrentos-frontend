import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { messagesApi } from '@/lib/api/messages';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuickReplySheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="New shortcut">
      {/* Remount per open so a dismissed draft never reappears. */}
      <QuickReplyForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function QuickReplyForm({ onClose }: { onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [shortcut, setShortcut] = useState('');
  const [response, setResponse] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      messagesApi.createQuickReply({ shortcut: shortcut.trim(), response: response.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.messageQuickReplies });
      toast.show('Shortcut saved.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save that shortcut.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Type the trigger while composing and it expands to the full response.
      </Text>

      <TextField
        label="Trigger"
        placeholder="thanks"
        autoCapitalize="none"
        maxLength={50}
        value={shortcut}
        // The leading slash is how it is typed, not part of the stored value.
        onChangeText={(v) => setShortcut(v.replace(/^\//, ''))}
        hint="Typed as /thanks in a conversation"
      />

      <TextField
        label="Expands to"
        placeholder="Thanks — I'll get back to you shortly."
        multiline
        numberOfLines={3}
        maxLength={500}
        value={response}
        onChangeText={setResponse}
      />

      <Button
        label="Save shortcut"
        loading={mutation.isPending}
        disabled={!shortcut.trim() || !response.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
