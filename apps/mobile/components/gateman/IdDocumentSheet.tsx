import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle2, Images, RefreshCw, ShieldAlert } from '@sureground/icons/native';
import { Button, Card, Chip, Text, useTheme, useToast } from '@sureground/ui-native';
import {
  ID_CHECK_NOT_ADMISSION_NOTICE,
  VISITOR_ID_DOCUMENT_LABELS,
  VISITOR_ID_DOCUMENT_ORDER,
  type VisitorIdDocumentType,
} from '@sureground/shared';
import { Sheet } from '@/components/Sheet';
import { gatemanApi } from '@/lib/api/gateman';
import { ApiError } from '@/lib/api/client';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { qk } from '@/lib/query/keys';
import { haptics } from '@/lib/haptics';
import { Image as ExpoImage } from 'expo-image';

// Deliberately not queued offline: the photo is the evidence, and a queued write would be filed against when the network returned, not when the guard looked.
export function IdDocumentSheet({
  open,
  onClose,
  estateId,
  passId,
  visitorName,
}: {
  open: boolean;
  onClose: () => void;
  estateId: string;
  passId: string;
  visitorName?: string;
}) {
  const { colors, spacing } = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [documentType, setDocumentType] = useState<VisitorIdDocumentType>('NIN_SLIP');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const existing = useQuery({
    queryKey: qk.gateman.visitorIdCheck(estateId, passId),
    // Coalesced to null: the API answers null with 200 and no body, apiFetch returns undefined, and react-query rejects undefined, so the normal "no document" case would show as an error.
    queryFn: async () => (await gatemanApi.getVisitorIdCheck(estateId, passId)) ?? null,
    enabled: open && !!passId,
  });

  const record = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Take a photograph of the document first');
      return gatemanApi.recordVisitorIdCheck(estateId, passId, documentType, file);
    },
    onSuccess: (saved) => {
      setFailure(null);
      setFile(null);
      void haptics.success();
      void queryClient.invalidateQueries({
        queryKey: qk.gateman.visitorIdCheck(estateId, passId),
      });
      toast.show(`${saved.documentTypeLabel} recorded.`, 'success');
    },
    onError: (error) => {
      void haptics.tap();
      // Inline, not only a toast: the refusal's reason is worth reading.
      setFailure(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : 'That document could not be recorded'
      );
    },
  });

  const recorded = existing.data ?? null;
  const replacing = Boolean(recorded);

  const choose = async (pick: () => Promise<PickedFile | null>) => {
    setFailure(null);
    const picked = await pick();
    if (!picked) return;
    setFile(picked);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={visitorName ? `Identity document: ${visitorName}` : 'Identity document'}
      snapPoints={['85%']}
    >
      <View style={{ gap: spacing.lg }}>
        <Card>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <ShieldAlert size={16} color={colors.mutedForeground} />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              {ID_CHECK_NOT_ADMISSION_NOTICE}
            </Text>
          </View>
        </Card>

        {recorded ? (
          <Card>
            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <CheckCircle2 size={16} color={colors.primary} />
                <Text variant="bodyStrong">{recorded.documentTypeLabel}</Text>
              </View>
              <Text variant="caption" color="mutedForeground">
                Recorded {new Date(recorded.checkedAt).toLocaleString()}
                {recorded.checkedByName ? ` by ${recorded.checkedByName}` : ''}
              </Text>
              {recorded.documentUrl ? (
                <ExpoImage
                  source={{ uri: recorded.documentUrl }}
                  style={{ width: '100%', height: 180, borderRadius: 12 }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              ) : null}
              <Text variant="caption" color="mutedForeground">
                Taking another photograph replaces this one. Only the latest is kept, so a blurry
                first attempt is not left on file.
              </Text>
            </View>
          </Card>
        ) : existing.isSuccess ? (
          <Text variant="caption" color="mutedForeground">
            No identity document has been recorded for this visit.
          </Text>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">What was shown</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {VISITOR_ID_DOCUMENT_ORDER.map((type) => (
              <Chip
                key={type}
                label={VISITOR_ID_DOCUMENT_LABELS[type]}
                selected={documentType === type}
                onPress={() => setDocumentType(type)}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="bodyStrong">The photograph</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="outline"
                icon={<Camera size={16} />}
                label="Camera"
                onPress={() => void choose(capturePhoto)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="outline"
                icon={<Images size={16} />}
                label="Library"
                onPress={() => void choose(pickPhoto)}
              />
            </View>
          </View>
          {file ? (
            <Text variant="caption" color="mutedForeground">
              Ready to send: {file.name}
            </Text>
          ) : (
            <Text variant="caption" color="mutedForeground">
              A photograph or a PDF scan, up to 10MB.
            </Text>
          )}
        </View>

        {failure ? (
          <Card>
            <Text variant="caption" color="destructive">
              {failure}
            </Text>
          </Card>
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <Button
            label={replacing ? 'Replace the recorded document' : 'Record this document'}
            icon={replacing ? <RefreshCw size={16} /> : <CheckCircle2 size={16} />}
            loading={record.isPending}
            disabled={!file || record.isPending}
            onPress={() => record.mutate()}
          />
          <Button variant="ghost" label="Close" onPress={onClose} />
        </View>
      </View>
    </Sheet>
  );
}
