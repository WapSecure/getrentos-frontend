import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import { Button, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  agentDocumentsApi,
  AGENT_DOCUMENT_CATEGORIES,
  AGENT_DOCUMENT_CATEGORY_LABEL,
  type AgentDocumentCategory,
} from '@/lib/api/agentDocuments';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UploadAgentDocumentSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Upload a document">
      {/* Remount on each open so the form always starts blank. */}
      <UploadForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function UploadForm({ onClose }: Omit<Props, 'open'>) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AgentDocumentCategory>('OTHER');

  const mutation = useMutation({
    mutationFn: () => agentDocumentsApi.upload(file!, name.trim(), category),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agent', 'documents'] });
      toast.show('Document uploaded.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(
        err instanceof ApiError ? err.message : 'Could not upload this document.',
        'error'
      ),
  });

  const pick = async () => {
    const picked = await pickDocument();
    if (picked) {
      setFile(picked);
      if (!name.trim()) setName(picked.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const canSubmit = !!file && name.trim().length > 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <Pressable
        onPress={pick}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.lg,
          borderRadius: 12,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: colors.border,
        }}
      >
        <FileText size={18} color={colors.mutedForeground} />
        <Text
          variant="callout"
          color={file ? 'foreground' : 'mutedForeground'}
          numberOfLines={1}
          style={{ flex: 1 }}
        >
          {file ? file.name : 'Choose a file'}
        </Text>
      </Pressable>

      <TextField label="Name" value={name} onChangeText={setName} />

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {AGENT_DOCUMENT_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={AGENT_DOCUMENT_CATEGORY_LABEL[c]}
              size="sm"
              selected={category === c}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>
      </View>

      <Button
        label="Upload"
        loading={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
