import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import { Button, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import {
  buyerDocumentsApi,
  BUYER_DOCUMENT_TYPES,
  BUYER_DOCUMENT_TYPE_LABEL,
  type BuyerDocumentType,
} from '@/lib/api/buyerDocuments';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UploadBuyerDocumentSheet({ open, onClose }: Props) {
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
  const [type, setType] = useState<BuyerDocumentType>('OTHER');

  const mutation = useMutation({
    mutationFn: () => buyerDocumentsApi.upload(file!, name.trim(), type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyer', 'documents'] });
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
        <Text variant="bodyStrong">Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {BUYER_DOCUMENT_TYPES.map((t) => (
            <Chip
              key={t}
              label={BUYER_DOCUMENT_TYPE_LABEL[t]}
              size="sm"
              selected={type === t}
              onPress={() => setType(t)}
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
