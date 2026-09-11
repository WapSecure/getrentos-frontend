import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Camera,
  Check,
  ChevronLeft,
  FileText,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react-native';
import { Button, Card, Chip, Skeleton, Text, useTheme, useToast } from '@getrentos/ui-native';
import { pickDocument, captureSelfie } from '@/lib/filePicker';
import type { PickedFile } from '@/lib/api/documents';
import {
  kycApi,
  IDENTITY_DOCUMENT_TYPES,
  IDENTITY_DOCUMENT_LABEL,
  type IdentityDocumentType,
  type KycStatus,
} from '@/lib/api/kyc';
import { ApiError } from '@/lib/api/client';

type ColorKey = keyof ReturnType<typeof useTheme>['colors'];

const STATUS_META: Record<
  KycStatus,
  { label: string; icon: typeof ShieldCheck; fg: ColorKey; bg: ColorKey }
> = {
  APPROVED: { label: 'Verified', icon: ShieldCheck, fg: 'success', bg: 'successSubtle' },
  PENDING_REVIEW: {
    label: 'Pending review',
    icon: ShieldAlert,
    fg: 'warning',
    bg: 'warningSubtle',
  },
  NEEDS_CLARIFICATION: {
    label: 'Needs clarification',
    icon: HelpCircle,
    fg: 'warning',
    bg: 'warningSubtle',
  },
  REJECTED: { label: 'Rejected', icon: ShieldX, fg: 'destructive', bg: 'secondary' },
};

export default function VerifyIdentity() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const qc = useQueryClient();

  const [documentType, setDocumentType] = useState<IdentityDocumentType>('NATIONAL_ID');
  const [document, setDocument] = useState<PickedFile | null>(null);
  const [selfie, setSelfie] = useState<PickedFile | null>(null);

  const statusQuery = useQuery({ queryKey: ['kyc-status'], queryFn: kycApi.getStatus });
  const identity = statusQuery.data?.identity;
  const meta = identity ? STATUS_META[identity.status as KycStatus] : undefined;
  const canSubmit =
    !identity || identity.status === 'REJECTED' || identity.status === 'NEEDS_CLARIFICATION';

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!document) throw new Error('Choose your document first');
      return kycApi.submitIdentity({ documentType, document, selfie: selfie ?? undefined });
    },
    onSuccess: () => {
      setDocument(null);
      setSelfie(null);
      qc.invalidateQueries({ queryKey: ['kyc-status'] });
      toast.show('Submitted for review. We’ll notify you once it’s decided.', 'success');
    },
    onError: (err) => {
      toast.show(
        err instanceof ApiError ? err.message : 'Could not submit your documents.',
        'error'
      );
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          paddingTop: insets.top + 8,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.sm,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
        >
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text variant="bodyStrong">Verify your identity</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <Text variant="body" color="mutedForeground">
          Verify your identity to unlock actions like submitting rental applications and offers.
        </Text>

        {statusQuery.isLoading ? (
          <Skeleton height={56} />
        ) : meta ? (
          <Card
            elevated
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: colors[meta.bg],
            }}
          >
            <meta.icon size={20} color={colors[meta.fg]} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ color: colors[meta.fg] }}>
                {meta.label}
              </Text>
              {identity?.rejectionReason ? (
                <Text variant="caption" color="mutedForeground">
                  {identity.rejectionReason}
                </Text>
              ) : null}
            </View>
          </Card>
        ) : null}

        {canSubmit ? (
          <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.sm }}>
              <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
                Document type
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {IDENTITY_DOCUMENT_TYPES.map((t) => (
                  <Chip
                    key={t}
                    label={IDENTITY_DOCUMENT_LABEL[t]}
                    selected={documentType === t}
                    onPress={() => setDocumentType(t)}
                  />
                ))}
              </View>
            </View>

            <PickerRow
              label="Document photo"
              file={document}
              icon={FileText}
              onPick={async () => setDocument(await pickDocument())}
              onClear={() => setDocument(null)}
            />

            <PickerRow
              label="Selfie (speeds up automatic approval)"
              file={selfie}
              icon={Camera}
              onPick={async () => setSelfie(await captureSelfie())}
              onClear={() => setSelfie(null)}
            />

            <Button
              label={submitMutation.isPending ? 'Submitting…' : 'Submit for verification'}
              disabled={!document}
              loading={submitMutation.isPending}
              onPress={() => submitMutation.mutate()}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function PickerRow({
  label,
  file,
  icon: Icon,
  onPick,
  onClear,
}: {
  label: string;
  file: PickedFile | null;
  icon: typeof FileText;
  onPick: () => void;
  onClear: () => void;
}) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      <Pressable
        onPress={file ? undefined : onPick}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          borderWidth: 1,
          borderStyle: file ? 'solid' : 'dashed',
          borderColor: file ? colors.success : colors.border,
          backgroundColor: file ? colors.successSubtle : colors.card,
        }}
      >
        {file ? (
          <Check size={18} color={colors.success} />
        ) : (
          <Icon size={18} color={colors.mutedForeground} />
        )}
        <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
          {file ? file.name : `Tap to add`}
        </Text>
        {file ? (
          <Pressable onPress={onClear} hitSlop={8}>
            <Text variant="caption" color="primary" style={{ fontWeight: '600' }}>
              Remove
            </Text>
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}
