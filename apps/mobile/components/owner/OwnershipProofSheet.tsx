import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Chip, FormAlert, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { FilePickRow } from '@/components/forms/FilePickRow';
import { qk } from '@/lib/query/keys';
import { ownerApi, OWNERSHIP_DOCUMENTS, type OwnershipDocumentType } from '@/lib/api/owner';
import { pickDocument } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { errorMessage } from '@/lib/api/client';

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
  const { spacing } = useTheme();
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
      <FilePickRow
        checkPhotoQuality
        label="Document"
        file={file}
        emptyText="Choose a PDF or photo of the document"
        onPick={async () => {
          const picked = await pickDocument();
          if (picked) setFile(picked);
        }}
      />
      {send.error ? (
        <FormAlert message={errorMessage(send.error, 'Could not send the document.')} />
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
