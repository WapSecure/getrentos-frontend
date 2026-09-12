import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, ChevronLeft, FileText } from 'lucide-react-native';
import {
  Badge,
  type BadgeTone,
  Button,
  Card,
  EmptyState,
  Screen,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { SignaturePad } from '@/components/SignaturePad';
import { residentApi, type GovernanceRecord, type GovernanceRecordType } from '@/lib/api/resident';
import { qk } from '@/lib/query/keys';
import { formatDate } from '@/lib/format';

const TYPE_LABEL: Record<GovernanceRecordType, string> = {
  bylaws: 'Bylaws',
  meeting_minutes: 'Meeting Minutes',
  other: 'Document',
};

function BackHeader({ title }: { title: string }) {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.xl,
        paddingTop: insets.top + spacing.sm,
        paddingBottom: spacing.md,
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
      <Text variant="title">{title}</Text>
    </View>
  );
}

export default function ResidentGovernance() {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [signTarget, setSignTarget] = useState<GovernanceRecord | null>(null);

  const query = useQuery({
    queryKey: qk.resident.governance,
    queryFn: () => residentApi.listGovernanceRecords(),
  });

  const sign = useMutation({
    mutationFn: ({ recordId, signatureData }: { recordId: string; signatureData: string }) =>
      residentApi.signGovernanceRecord(recordId, signatureData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.resident.governance });
      setSignTarget(null);
    },
    onError: () => toast.show("Couldn't record your signature. Try again.", 'error'),
  });

  const records = query.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BackHeader title="Governance" />
      <Screen refreshing={query.isRefetching} onRefresh={query.refetch}>
        {query.isLoading ? (
          <View style={{ gap: spacing.md }}>
            <Skeleton height={100} radius={16} />
            <Skeleton height={100} radius={16} />
          </View>
        ) : records.length > 0 ? (
          records.map((r) => <RecordCard key={r.id} record={r} onSign={() => setSignTarget(r)} />)
        ) : (
          <EmptyState
            icon={<BookOpen size={34} color={colors.mutedForeground} />}
            title="No governance documents"
            description="Bylaws and meeting minutes your estate manager publishes will show up here."
          />
        )}
      </Screen>

      <SignSheet
        record={signTarget}
        onClose={() => setSignTarget(null)}
        onSign={(signatureData) =>
          signTarget && sign.mutate({ recordId: signTarget.id, signatureData })
        }
        submitting={sign.isPending}
      />
    </View>
  );
}

function RecordCard({ record, onSign }: { record: GovernanceRecord; onSign: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const progress = record.signatureProgress;
  const fullySigned = progress ? progress.signed >= progress.total : false;
  const canSign = record.requiresSignatures && record.signedByMe === false;

  const progressTone: BadgeTone = fullySigned ? 'success' : 'warning';
  const progressLabel = progress
    ? fullySigned
      ? 'Fully signed'
      : `${progress.signed} of ${progress.total} signed`
    : null;

  return (
    <Card elevated>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radius.md,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileText size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{record.title}</Text>
          <Text variant="caption" color="mutedForeground">
            {TYPE_LABEL[record.type]} · v{record.version} · {record.size}
          </Text>
          {record.meetingDate ? (
            <Text variant="caption" color="mutedForeground">
              Meeting {formatDate(record.meetingDate, 'short')}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          marginTop: spacing.md,
          flexWrap: 'wrap',
        }}
      >
        {progressLabel ? <Badge label={progressLabel} tone={progressTone} /> : null}
        <Button
          label="View Document"
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={() => WebBrowser.openBrowserAsync(record.url)}
        />
        {canSign ? (
          <Button
            label="Sign"
            size="sm"
            fullWidth={false}
            icon={<Check size={14} color={colors.primaryForeground} />}
            onPress={onSign}
          />
        ) : null}
      </View>
    </Card>
  );
}

function SignSheet({
  record,
  onClose,
  onSign,
  submitting,
}: {
  record: GovernanceRecord | null;
  onClose: () => void;
  onSign: (signatureData: string) => void;
  submitting: boolean;
}) {
  return (
    <Sheet open={!!record} onClose={onClose} title={record ? `Sign ${record.title}` : ''}>
      {record ? <SignForm key={record.id} onSign={onSign} submitting={submitting} /> : null}
    </Sheet>
  );
}

function SignForm({
  onSign,
  submitting,
}: {
  onSign: (signatureData: string) => void;
  submitting: boolean;
}) {
  const { spacing } = useTheme();
  const [signature, setSignature] = useState<string | null>(null);

  return (
    <View style={{ gap: spacing.lg, alignItems: 'center' }}>
      <Text variant="callout" color="mutedForeground" center>
        Sign below to confirm you've read and agree to this document.
      </Text>
      <SignaturePad onChange={setSignature} />
      <Button
        label={submitting ? 'Signing…' : 'Confirm Signature'}
        disabled={!signature}
        loading={submitting}
        fullWidth
        onPress={() => signature && onSign(signature)}
      />
    </View>
  );
}
