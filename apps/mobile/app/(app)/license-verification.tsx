import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Badge,
  Button,
  Card,
  QueryState,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
  type BadgeTone,
} from '@sureground/ui-native';
import { kycApi, type KycStatus } from '@/lib/api/kyc';
import type { PickedFile } from '@/lib/api/documents';
import { errorMessage } from '@/lib/api/client';
import { pickDocument } from '@/lib/filePicker';
import { formatDate } from '@/lib/format';
import { FilePickRow } from '@/components/forms/FilePickRow';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { goBack } from '@/lib/goBack';

const STATUS: Record<KycStatus, { label: string; tone: BadgeTone }> = {
  APPROVED: { label: 'Verified', tone: 'success' },
  PENDING_REVIEW: { label: 'Being reviewed', tone: 'warning' },
  NEEDS_CLARIFICATION: { label: 'Needs more detail', tone: 'warning' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
};

/** A realtor's or agent's licence, sent for human review (web: LicenseVerificationSettings). */
export default function LicenseVerification() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [document, setDocument] = useState<PickedFile | null>(null);
  const status = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const submit = useMutation({
    mutationFn: () =>
      kycApi.submitLicense({
        licenseNumber: licenseNumber.trim(),
        ...(document ? { document } : {}),
      }),
    onSuccess: () => {
      setLicenseNumber('');
      setDocument(null);
      qc.invalidateQueries({ queryKey: ['kyc-status'] });
      toast.show('Sent for review. We’ll let you know once it’s decided.', 'success');
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not send your licence.'), 'error'),
  });
  const license = status.data?.license;
  const canSubmit =
    !license || license.status === 'REJECTED' || license.status === 'NEEDS_CLARIFICATION';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <DetailScreenHeader
        eyebrow="Verification"
        title="Your licence"
        subtitle="Unlocks inviting owners and landlords as clients"
        onBack={() => goBack()}
      />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <QueryState query={status} skeleton={<Skeleton height={80} />}>
          {license ? (
            <Card style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  {license.licenseNumber}
                </Text>
                <Badge
                  label={STATUS[license.status]?.label ?? license.status}
                  tone={STATUS[license.status]?.tone ?? 'neutral'}
                />
              </View>
              <Text variant="caption" color="mutedForeground">
                Sent {formatDate(license.submittedAt, 'short')}
              </Text>
              {license.rejectionReason ? (
                <Text variant="callout" color="mutedForeground">
                  {license.rejectionReason}
                </Text>
              ) : null}
            </Card>
          ) : (
            <Text variant="callout" color="mutedForeground">
              Verify your realtor or agent licence so owners and landlords can trust your
              invitations.
            </Text>
          )}

          {canSubmit ? (
            <View style={{ gap: spacing.md }}>
              <TextField
                label="Licence number"
                placeholder="RC-2024-001234"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                autoCapitalize="characters"
              />
              <FilePickRow
                checkPhotoQuality
                label="Licence document (optional)"
                file={document}
                emptyText="PDF or photo: tap to add"
                onPick={async () => {
                  const file = await pickDocument();
                  if (file) setDocument(file);
                }}
                onClear={() => setDocument(null)}
              />
              <Button
                label={license ? 'Send again' : 'Send for verification'}
                loading={submit.isPending}
                disabled={!licenseNumber.trim() || submit.isPending}
                onPress={() => submit.mutate()}
              />
            </View>
          ) : null}
        </QueryState>
      </ScrollView>
    </View>
  );
}
