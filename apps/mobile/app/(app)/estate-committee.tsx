import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Landmark, Plus } from 'lucide-react-native';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  Skeleton,
  Text,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { errorText } from '@/components/estate/EstateUI';
import { HouseholdPicker } from '@/components/estate/HouseholdPicker';
import { Sheet } from '@/components/Sheet';
import { useEstate } from '@/hooks/useEstate';
import type { Household } from '@/lib/api/estateManager';
import {
  COMMITTEE_TITLES,
  committeeOrder,
  committeeTitleLabel,
  estateGovernanceApi,
  governanceKeys,
  type CommitteeMember,
  type CommitteeTitle,
} from '@/lib/api/estateGovernance';
import { formatDate } from '@/lib/format';
import { haptics } from '@/lib/haptics';

type Panel = { kind: 'appoint' } | { kind: 'edit'; member: CommitteeMember } | null;

/**
 * The board running the estate. Each household holds at most one seat, so
 * appointing someone already on it changes their title. Committee members are
 * the ones who sign governance documents.
 */
export default function EstateCommittee() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const { estate, estateId } = useEstate();
  const [panel, setPanel] = useState<Panel>(null);

  const query = useQuery({
    queryKey: governanceKeys.committee(estateId),
    queryFn: () => estateGovernanceApi.committee(estateId),
    enabled: !!estateId,
  });
  const members = committeeOrder(query.data ?? []);

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
          title="Committee"
          subtitle={
            query.data?.length
              ? `${query.data.length} ${query.data.length === 1 ? 'seat' : 'seats'} filled`
              : 'The board running the estate'
          }
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Appoint a household"
              disabled={!estateId}
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => setPanel({ kind: 'appoint' })}
            />
          }
        />

        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={72} radius={radius.lg} />)
        ) : !members.length ? (
          <EmptyState
            icon={<Landmark size={34} color={colors.mutedForeground} />}
            title="No committee yet"
            description="Give households a seat and a title. Committee members can sign the estate’s bylaws and minutes from their app."
            action={
              <Button label="Appoint a household" onPress={() => setPanel({ kind: 'appoint' })} />
            }
          />
        ) : (
          members.map((m) => (
            <MemberRow key={m.id} m={m} onPress={() => setPanel({ kind: 'edit', member: m })} />
          ))
        )}
      </ScrollView>

      <Sheet
        open={panel?.kind === 'appoint'}
        onClose={() => setPanel(null)}
        title="Appoint to the committee"
      >
        {panel?.kind === 'appoint' ? (
          <AppointForm
            estateId={estateId}
            members={query.data ?? []}
            onDone={() => setPanel(null)}
          />
        ) : null}
      </Sheet>
      <Sheet
        open={panel?.kind === 'edit'}
        onClose={() => setPanel(null)}
        title={panel?.kind === 'edit' ? panel.member.residentName : undefined}
      >
        {panel?.kind === 'edit' ? (
          <EditForm
            key={panel.member.id}
            estateId={estateId}
            member={panel.member}
            onDone={() => setPanel(null)}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function MemberRow({ m, onPress }: { m: CommitteeMember; onPress: () => void }) {
  const { spacing } = useTheme();
  const title = committeeTitleLabel(m.title);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${m.residentName}, ${m.unitLabel}, ${title}. Change title or remove`}
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
          <Avatar name={m.residentName} size={42} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {m.residentName}
            </Text>
            <Text variant="caption" color="mutedForeground" numberOfLines={1}>
              {m.unitLabel} · since {formatDate(m.appointedAt, 'medium')}
            </Text>
          </View>
          <Badge
            label={title}
            tone={m.title === 'member' ? 'neutral' : m.title === 'treasurer' ? 'warning' : 'info'}
          />
        </Card>
      )}
    </Pressable>
  );
}

function TitlePicker({
  value,
  onChange,
}: {
  value: CommitteeTitle;
  onChange: (t: CommitteeTitle) => void;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="bodyStrong">Title</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {COMMITTEE_TITLES.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            selected={value === t.value}
            onPress={() => onChange(t.value)}
          />
        ))}
      </View>
    </View>
  );
}

function AppointForm({
  estateId,
  members,
  onDone,
}: {
  estateId: string;
  members: CommitteeMember[];
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [household, setHousehold] = useState<Household | null>(null);
  const [title, setTitle] = useState<CommitteeTitle>('member');
  const sitting = household ? members.find((m) => m.householdId === household.id) : undefined;

  const appoint = useMutation({
    mutationFn: () => estateGovernanceApi.appoint(estateId, household!.id, title),
    onSuccess: (m) => {
      void haptics.success();
      qc.invalidateQueries({ queryKey: governanceKeys.committee(estateId) });
      toast.show(
        `${m.residentName} is now ${committeeTitleLabel(m.title).toLowerCase()}.`,
        'success'
      );
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <HouseholdPicker estateId={estateId} value={household} onChange={setHousehold} />
      <TitlePicker value={title} onChange={setTitle} />
      {sitting ? (
        <FormAlert
          tone="info"
          message={`${sitting.residentName} already sits as ${committeeTitleLabel(sitting.title).toLowerCase()}. Appointing them again changes their title.`}
        />
      ) : null}
      {appoint.error ? (
        <FormAlert message={errorText(appoint.error, 'Could not appoint this household.')} />
      ) : null}
      <Button
        label={sitting ? 'Change title' : 'Appoint'}
        disabled={!household || sitting?.title === title}
        loading={appoint.isPending}
        onPress={() => appoint.mutate()}
      />
    </View>
  );
}

function EditForm({
  estateId,
  member,
  onDone,
}: {
  estateId: string;
  member: CommitteeMember;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [title, setTitle] = useState<CommitteeTitle>(member.title);
  const invalidate = () => qc.invalidateQueries({ queryKey: governanceKeys.committee(estateId) });

  const retitle = useMutation({
    mutationFn: () => estateGovernanceApi.appoint(estateId, member.householdId, title),
    onSuccess: () => {
      void haptics.success();
      invalidate();
      toast.show(
        `${member.residentName} is now ${committeeTitleLabel(title).toLowerCase()}.`,
        'success'
      );
      onDone();
    },
  });
  const remove = useMutation({
    mutationFn: () => estateGovernanceApi.removeMember(estateId, member.id),
    onSuccess: () => {
      void haptics.success();
      invalidate();
      // Signature counts on governance records depend on the committee size.
      qc.invalidateQueries({ queryKey: governanceKeys.all(estateId) });
      toast.show(`${member.residentName} has left the committee.`, 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="callout" color="mutedForeground">
        {member.unitLabel} · on the committee since {formatDate(member.appointedAt, 'medium')}
      </Text>
      <TitlePicker value={title} onChange={setTitle} />
      {retitle.error || remove.error ? (
        <FormAlert
          message={errorText(retitle.error ?? remove.error, 'Could not update the committee.')}
        />
      ) : null}
      <Button
        label="Save title"
        disabled={title === member.title || remove.isPending}
        loading={retitle.isPending}
        onPress={() => retitle.mutate()}
      />
      <Button
        label="Remove from the committee"
        variant="destructive"
        loading={remove.isPending}
        disabled={retitle.isPending}
        accessibilityLabel={`Remove ${member.residentName} from the committee`}
        onPress={() =>
          Alert.alert(
            `Remove ${member.residentName}?`,
            'They lose their seat, and any signatures they gave on the estate’s documents are removed with it.',
            [
              { text: 'Keep them', style: 'cancel' },
              { text: 'Remove', style: 'destructive', onPress: () => remove.mutate() },
            ]
          )
        }
      />
    </View>
  );
}
