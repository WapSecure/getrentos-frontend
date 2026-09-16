import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import { Button, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { documentsApi, type PickedFile, type RenterDocument } from '@/lib/api/documents';
import { pickDocument } from '@/lib/filePicker';
import { ApiError } from '@/lib/api/client';

const TYPES: { value: RenterDocument['type']; label: string }[] = [
  { value: 'lease', label: 'Lease' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'other', label: 'Other' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function UploadDocumentSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Upload a document">
      {/* Remount on each open so the form always starts blank. */}
      <UploadDocumentForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function UploadDocumentForm({ onClose }: Omit<Props, 'open'>) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<RenterDocument['type']>('other');
  const [category, setCategory] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      documentsApi.upload(file!, name.trim(), type, category.trim() || 'Uncategorized'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.documents });
      qc.invalidateQueries({ queryKey: qk.renter.documentSummary });
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

      <TextField
        label="Name"
        placeholder="e.g. Tenancy agreement"
        value={name}
        onChangeText={setName}
      />

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={type === t.value}
              onPress={() => setType(t.value)}
            />
          ))}
        </View>
      </View>

      <TextField
        label="Category"
        placeholder="e.g. Rental application"
        value={category}
        onChangeText={setCategory}
      />

      <Button
        label="Upload"
        loading={mutation.isPending}
        disabled={!canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
