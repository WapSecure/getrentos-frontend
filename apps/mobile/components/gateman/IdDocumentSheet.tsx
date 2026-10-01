import { useState } from 'react';
import { Image, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CheckCircle2, Images, RefreshCw, ShieldAlert } from 'lucide-react-native';
import { Button, Card, Chip, Text, useTheme, useToast } from '@getrentos/ui-native';
import {
  ID_CHECK_NOT_ADMISSION_NOTICE,
  VISITOR_ID_DOCUMENT_LABELS,
  VISITOR_ID_DOCUMENT_ORDER,
  type VisitorIdDocumentType,
} from '@getrentos/shared';
import { Sheet } from '@/components/Sheet';
import { gatemanApi } from '@/lib/api/gateman';
import { ApiError } from '@/lib/api/client';
import { capturePhoto, pickPhoto } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import { qk } from '@/lib/query/keys';
import { haptics } from '@/lib/haptics';

/**
 * Recording the identity document a guard was shown.
 *
 * ## The notice is the most important thing on this screen
 *
 * A guard who believes this step admits somebody will start refusing arrivals who
 * cannot produce ID — which turns the estate's policy into ours and turns a
 * record into a gate. It says what the record is FOR instead, and it is stated
 * above the capture rather than after it, because by the time the photo is taken
 * the belief has already done its damage.
 *
 * ## Why the existing document is shown first
 *
 * One check per pass, so opening this sheet on a pass that already has one shows
 * what was recorded — with the photograph, since a guard at the barrier is
 * allowed to look at it — and offers to replace it. Without that, the guard takes
 * a second photograph to see whether the first one worked.
 *
 * ## Why this is not queued offline
 *
 * Every other gate write goes into the offline queue. This one deliberately does
 * not: the photograph IS the evidence, and a write that waited in a queue would
 * be filed against the moment the network returned rather than the moment the
 * guard looked at the document. A guard with no connection keeps the pass flow
 * and loses the photo, which is the right way round — an admission that happened
 * is worth more than a record of a document nobody can now vouch for.
 */
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
  /** Shown in the header so the guard can see whose document this is. */
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
    /**
     * Coalesced to `null` in the query function, and that is not defensive
     * padding — it is the "no document recorded" case, which is an allowed and
     * ordinary outcome.
     *
     * The API answers a handler returning `null` with 200 and NO BODY, and
     * `apiFetch` returns `undefined` for an empty body while its `as T` cast
     * hides it. react-query rejects `undefined` outright ("Query data cannot be
     * undefined"), so without this the normal case would arrive as an ERROR and
     * the sheet would claim the record could not be read. E3's emergency roll
     * call hit the identical trap, and the web dialog next to this one did too.
     */
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
      // The office's view of the same pass is now out of date, and so is this
      // sheet's idea of what was already recorded.
      void queryClient.invalidateQueries({
        queryKey: qk.gateman.visitorIdCheck(estateId, passId),
      });
      toast.show(`${saved.documentTypeLabel} recorded.`, 'success');
    },
    onError: (error) => {
      void haptics.tap();
      // Shown inline rather than only as a toast: a refusal here has a reason
      // worth reading ("that file type cannot be recorded"), and a toast that
      // disappears leaves the guard guessing.
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
      title={visitorName ? `Identity document — ${visitorName}` : 'Identity document'}
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
                <Image
                  source={{ uri: recorded.documentUrl }}
                  style={{ width: '100%', height: 180, borderRadius: 12 }}
                  resizeMode="contain"
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
