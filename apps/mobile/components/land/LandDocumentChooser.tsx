import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react-native';
import { Button, Text, useTheme, useToast } from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { documentTypeLabel, ownerLandApi } from '@/lib/api/ownerLand';
import { pickDocument } from '@/lib/filePicker';
import { ChipSelect } from '@/components/landlord/ChipSelect';

/**
 * Choose one of this land's documents, or upload a new one (stored as
 * `uploadType`) and choose it straight away.
 */
export function LandDocumentChooser({
  propertyId,
  label,
  value,
  onChange,
  uploadType,
  hint,
  disabled,
}: {
  propertyId: string;
  label: string;
  value: string;
  onChange: (documentId: string) => void;
  uploadType: string;
  hint?: string;
  disabled?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const docs = useQuery({
    queryKey: qk.owner.landDocuments(propertyId),
    queryFn: () => ownerLandApi.documents(propertyId),
  });
  const upload = useMutation({
    mutationFn: async () => {
      const file = await pickDocument();
      return file ? ownerLandApi.uploadDocument(propertyId, uploadType, file) : null;
    },
    onSuccess: (doc) => {
      if (!doc) return;
      qc.invalidateQueries({ queryKey: qk.owner.landDocuments(propertyId) });
      onChange(doc.id);
      toast.show('Uploaded and chosen.', 'success');
    },
    onError: (e) =>
      toast.show(e instanceof Error ? e.message : 'Could not upload the document.', 'error'),
  });
  return (
    <View style={{ gap: spacing.sm }}>
      <ChipSelect
        label={label}
        options={(docs.data ?? []).map((d) => ({
          value: d.id,
          label: `${documentTypeLabel(d.documentType)} · ${d.name}`,
        }))}
        value={value || undefined}
        onChange={onChange}
        disabled={disabled}
        emptyText={docs.isLoading ? 'Loading documents…' : 'No documents on this land yet.'}
      />
      {hint ? (
        <Text variant="caption" color="mutedForeground">
          {hint}
        </Text>
      ) : null}
      <Button
        label={`Upload a new ${documentTypeLabel(uploadType).toLowerCase()}`}
        size="sm"
        variant="ghost"
        icon={<Upload size={14} color={colors.primary} />}
        loading={upload.isPending}
        disabled={disabled || upload.isPending}
        onPress={() => upload.mutate()}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  );
}
