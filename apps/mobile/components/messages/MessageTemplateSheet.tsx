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

export function MessageTemplateSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="New template">
      {/* Remount per open so a dismissed draft never reappears. */}
      <MessageTemplateForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function MessageTemplateForm({ onClose }: { onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      messagesApi.createTemplate({
        title: title.trim(),
        content: content.trim(),
        category: category.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.messageTemplates });
      toast.show('Template saved.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not save that template.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Save a reply you send often, then drop it into any conversation.
      </Text>

      <TextField
        label="Title"
        placeholder="e.g. Ask to book a viewing"
        maxLength={100}
        value={title}
        onChangeText={setTitle}
      />

      <TextField
        label="Message"
        placeholder="Hi, I'd like to arrange a viewing this week — what times suit you?"
        multiline
        numberOfLines={4}
        maxLength={1000}
        value={content}
        onChangeText={setContent}
      />

      <TextField
        label="Category (optional)"
        placeholder="e.g. Viewings"
        maxLength={50}
        value={category}
        onChangeText={setCategory}
      />

      <Button
        label="Save template"
        loading={mutation.isPending}
        disabled={!title.trim() || !content.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
