import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Chip, Text, TextField, useTheme, useToast } from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { FilePickRow } from '@/components/forms/FilePickRow';
import { qk } from '@/lib/query/keys';
import { documentsApi, type PickedFile, type RenterDocument } from '@/lib/api/documents';
import { pickDocument } from '@/lib/filePicker';
import { errorMessage } from '@/lib/api/client';

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
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Upload a document">
      {/* Remount on each open so the form always starts blank. */}
      <UploadDocumentForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        onSubmittingChange={setSubmitting}
      />
    </Sheet>
  );
}

function UploadDocumentForm({
  onClose,
  onSubmittingChange,
}: Omit<Props, 'open'> & { onSubmittingChange: (submitting: boolean) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<RenterDocument['type']>('other');
  const [category, setCategory] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      documentsApi.upload(file!, name.trim(), type, category.trim() || 'Uncategorized'),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.renter.documents });
      qc.invalidateQueries({ queryKey: qk.renter.documentSummary });
      toast.show('Document uploaded.', 'success');
      onClose();
    },
    onError: (err) => toast.show(errorMessage(err, 'Could not upload this document.'), 'error'),
    onSettled: () => onSubmittingChange(false),
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
      <FilePickRow
        checkPhotoQuality
        label="File"
        file={file}
        emptyText="Choose a file"
        onPick={() => {
          if (!mutation.isPending) void pick();
        }}
      />

      <TextField
        label="Name"
        required
        placeholder="e.g. Tenancy agreement"
        value={name}
        onChangeText={setName}
        editable={!mutation.isPending}
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
              disabled={mutation.isPending}
            />
          ))}
        </View>
      </View>

      <TextField
        label="Category"
        placeholder="e.g. Rental application"
        value={category}
        onChangeText={setCategory}
        editable={!mutation.isPending}
      />

      <Button
        label="Upload"
        loading={mutation.isPending}
        disabled={mutation.isPending || !canSubmit}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
