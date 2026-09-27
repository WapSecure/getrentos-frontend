import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react-native';
import { Button, Chip, FormAlert, Text, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import { ownerApi, OWNERSHIP_DOCUMENTS, type OwnershipDocumentType } from '@/lib/api/owner';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { ApiError } from '@/lib/api/client';

interface Props {
  propertyId: string;
  open: boolean;
  onClose: () => void;
}

/** Sends (or re-sends) proof of ownership for review. */
export function OwnershipProofSheet({ propertyId, open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Ownership document">
      <ProofForm key={open ? 'open' : 'closed'} propertyId={propertyId} onClose={onClose} />
    </Sheet>
  );
}

function ProofForm({ propertyId, onClose }: Omit<Props, 'open'>) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<OwnershipDocumentType>('C_OF_O');
  const [file, setFile] = useState<PickedFile | null>(null);

  const send = useMutation({
    mutationFn: () => ownerApi.submitOwnershipProof(propertyId, type, file!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.owner.property(propertyId) });
      qc.invalidateQueries({ queryKey: qk.owner.properties });
      qc.invalidateQueries({ queryKey: qk.owner.land });
      toast.show('Sent for review. We’ll let you know when it’s checked.', 'success');
      onClose();
    },
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {OWNERSHIP_DOCUMENTS.map((d) => (
          <Chip
            key={d.value}
            label={d.label}
            size="sm"
            selected={type === d.value}
            onPress={() => setType(d.value)}
          />
        ))}
      </View>
      <Pressable
        onPress={async () => {
          const picked = await pickDocument();
          if (picked) setFile(picked);
        }}
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
          {file ? file.name : 'Choose a PDF or photo of the document'}
        </Text>
      </Pressable>
      {send.error ? (
        <FormAlert
          message={
            send.error instanceof ApiError ? send.error.message : 'Could not send the document.'
          }
        />
      ) : null}
      <Button
        label="Send for review"
        disabled={!file}
        loading={send.isPending}
        onPress={() => send.mutate()}
      />
    </View>
  );
}
