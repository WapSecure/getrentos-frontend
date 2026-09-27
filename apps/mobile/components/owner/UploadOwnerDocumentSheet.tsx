import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import { Button, Chip, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { ownerApi, OWNER_DOCUMENT_TYPES, type OwnerDocumentType } from '@/lib/api/owner';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Files transfer paperwork. It starts private; the owner shares it from the list. */
export function UploadOwnerDocumentSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Upload a document">
      {/* Remount on each open so the form always starts blank. */}
      <UploadForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function UploadForm({ onClose }: Omit<Props, 'open'>) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<OwnerDocumentType>('TRANSFER_AGREEMENT');
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const properties = useQuery({
    queryKey: qk.owner.properties,
    queryFn: () => ownerApi.properties(),
  });

  const mutation = useMutation({
    mutationFn: () => ownerApi.uploadDocument(file!, { name: name.trim(), type, propertyId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.owner.documents });
      toast.show('Document uploaded. It stays private until you share it.', 'success');
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

  return (
    <View style={{ gap: spacing.lg }}>
      <Pressable
        onPress={pick}
        accessibilityRole="button"
        accessibilityLabel={file ? `Chosen file ${file.name}. Choose another` : 'Choose a file'}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.lg,
          minHeight: 44,
          borderRadius: radius.md,
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
          {file ? file.name : 'Choose a PDF or photo (up to 10 MB)'}
        </Text>
      </Pressable>

      <TextField label="Name" value={name} onChangeText={setName} />

      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {OWNER_DOCUMENT_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              size="sm"
              selected={type === t.value}
              onPress={() => setType(t.value)}
            />
          ))}
        </View>
      </View>

      {properties.data?.items.length ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">Property (optional)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {properties.data.items.map((p) => (
              <Chip
                key={p.id}
                label={p.name}
                size="sm"
                selected={propertyId === p.id}
                onPress={() => setPropertyId((cur) => (cur === p.id ? undefined : p.id))}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Button
        label="Upload"
        loading={mutation.isPending}
        disabled={!file || !name.trim()}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
