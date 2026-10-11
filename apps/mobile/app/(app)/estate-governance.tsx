import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  FilePlus2,
  FileText,
  History,
  PenLine,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { StatusPill } from '@/components/host/HostUI';
import { Sheet } from '@/components/Sheet';
import { GovernanceUploadSheet } from '@/components/estate/governance/GovernanceUploadSheet';
import {
  GovernanceSignaturesSheet,
  GovernanceVersionsSheet,
} from '@/components/estate/governance/GovernanceRecordSheets';
import { useEstate } from '@/hooks/useEstate';
import { isFreeEstate } from '@/lib/api/estateManager';
import {
  GOVERNANCE_TYPES,
  estateGovernanceApi,
  governanceKeys,
  governanceTypeLabel,
  signatureState,
  type GovernanceFilter,
  type GovernanceRecord,
} from '@/lib/api/estateGovernance';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';

type Panel =
  | { kind: 'upload'; newVersionOf?: GovernanceRecord }
  | { kind: 'actions' | 'versions' | 'signatures'; record: GovernanceRecord }
  | null;

/**
 * The estate's rules and decisions: bylaws and meeting minutes kept against
 * the estate itself, so they outlast any one committee. Uploading is free;
 * asking the committee to sign is Pro.
 */
export default function EstateGovernance() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const { estate, estateId } = useEstate();
  const [filter, setFilter] = useState<GovernanceFilter>('all');
  const [panel, setPanel] = useState<Panel>(null);

  const query = useQuery({
    queryKey: governanceKeys.records(estateId, filter),
    queryFn: () => estateGovernanceApi.governance(estateId, filter),
    enabled: !!estateId,
  });
  const records = query.data ?? [];

  const remove = useMutation({
    mutationFn: (r: GovernanceRecord) => estateGovernanceApi.removeGovernance(estateId, r.id),
    onSuccess: () => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: governanceKeys.all(estateId) });
      toast.show('Record removed.', 'success');
    },
    onError: (e) => toast.show(errorText(e, 'Could not remove this record.'), 'error'),
  });

  const confirmRemove = (r: GovernanceRecord) =>
    Alert.alert(
      r.version > 1 ? `Remove version ${r.version}?` : `Remove “${r.title}”?`,
      r.version > 1
        ? `Version ${r.version} is deleted and the one before it becomes current again. Residents see the change straight away.`
        : 'The document is deleted for everyone, including any signatures on it. This can’t be undone.',
      [
        { text: 'Keep it', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => remove.mutate(r) },
      ]
    );

  // Kept after the sheet closes, so its content doesn't vanish mid-animation.
  const [selected, setSelected] = useState<GovernanceRecord | null>(null);
  // One sheet at a time: iOS won't present a modal while another is dismissing.
  const then = (next: () => void) => {
    setPanel(null);
    setTimeout(next, 250);
  };
  const filterLabel = GOVERNANCE_TYPES.find((t) => t.value === filter)?.label.toLowerCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={colors.mutedForeground}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow={estate?.name ?? 'Community'}
          title="Governance"
          subtitle="Bylaws, minutes and signed decisions"
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Upload a record"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setPanel({ kind: 'upload' })}
            />
          }
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm }}
        >
          <Chip label="All" selected={filter === 'all'} onPress={() => setFilter('all')} />
          {GOVERNANCE_TYPES.map((t) => (
            <Chip
              key={t.value}
              label={t.label}
              selected={filter === t.value}
              onPress={() => setFilter(t.value)}
            />
          ))}
        </ScrollView>

        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={96} radius={radius.lg} />)
        ) : !records.length ? (
          <EmptyState
            icon={<BookOpen size={34} color={colors.mutedForeground} />}
            title={filter === 'all' ? 'No records yet' : `No ${filterLabel} yet`}
            description="Upload bylaws or meeting minutes so they survive committee turnover. Residents read them in their app."
            action={<Button label="Upload a record" onPress={() => setPanel({ kind: 'upload' })} />}
          />
        ) : (
          records.map((r) => (
            <RecordCard
              key={r.id}
              r={r}
              onPress={() => {
                setSelected(r);
                setPanel({ kind: 'actions', record: r });
              }}
            />
          ))
        )}
      </ScrollView>

      <Sheet
        open={panel?.kind === 'actions'}
        onClose={() => setPanel(null)}
        title={selected?.title}
      >
        {selected ? (
          <View>
            <Action
              Icon={ExternalLink}
              label="Open the document"
              onPress={() => then(() => void WebBrowser.openBrowserAsync(selected.url))}
            />
            <Action
              Icon={FilePlus2}
              label="Upload a new version"
              onPress={() => then(() => setPanel({ kind: 'upload', newVersionOf: selected }))}
            />
            {selected.version > 1 ? (
              <Action
                Icon={History}
                label="Version history"
                onPress={() => then(() => setPanel({ kind: 'versions', record: selected }))}
              />
            ) : null}
            {selected.requiresSignatures ? (
              <Action
                Icon={PenLine}
                label="Who has signed"
                onPress={() => then(() => setPanel({ kind: 'signatures', record: selected }))}
              />
            ) : null}
            <Action
              Icon={Trash2}
              label={selected.version > 1 ? `Remove version ${selected.version}` : 'Remove'}
              destructive
              onPress={() => then(() => confirmRemove(selected))}
            />
          </View>
        ) : null}
      </Sheet>
      <GovernanceUploadSheet
        open={panel?.kind === 'upload'}
        onClose={() => setPanel(null)}
        estateId={estateId}
        newVersionOf={panel?.kind === 'upload' ? panel.newVersionOf : undefined}
        freeEstate={isFreeEstate(estate)}
      />
      <GovernanceVersionsSheet
        estateId={estateId}
        record={panel?.kind === 'versions' ? panel.record : null}
        onClose={() => setPanel(null)}
      />
      <GovernanceSignaturesSheet
        estateId={estateId}
        record={panel?.kind === 'signatures' ? panel.record : null}
        onClose={() => setPanel(null)}
      />
    </View>
  );
}

function RecordCard({ r, onPress }: { r: GovernanceRecord; onPress: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const sig = signatureState(r);
  const meta = [
    r.meetingDate ? `Meeting ${formatDate(r.meetingDate, 'medium')}` : null,
    r.size,
    `uploaded ${formatDate(r.createdAt, 'medium')}`,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${r.title}, ${governanceTypeLabel(r.type)}${r.version > 1 ? `, version ${r.version}` : ''}${sig ? `, ${sig.label}` : ''}. ${meta}. Options`}
    >
      {({ pressed }) => (
        <Card
          elevated
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.md,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.md,
              backgroundColor: colors.secondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={18} color={colors.mutedForeground} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="bodyStrong" numberOfLines={2}>
              {r.title}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              <Badge
                label={governanceTypeLabel(r.type)}
                tone={r.type === 'bylaws' ? 'info' : 'neutral'}
              />
              {r.version > 1 ? <Badge label={`v${r.version}`} /> : null}
              {sig ? <StatusPill label={sig.label} tone={sig.tone} /> : null}
            </View>
            <Text variant="caption" color="mutedForeground" numberOfLines={2}>
              {meta}
            </Text>
          </View>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </Card>
      )}
    </Pressable>
  );
}

function Action({
  Icon,
  label,
  onPress,
  destructive,
}: {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const { colors, spacing } = useTheme();
  const tint = destructive ? colors.destructive : colors.foreground;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        minHeight: 52,
        opacity: pressed ? 0.6 : 1,
      })}
    >
      <Icon size={18} color={tint} />
      <Text variant="callout" style={{ flex: 1, color: tint, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
