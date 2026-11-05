import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, LandPlot, Plus, ReceiptText, Video } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  FormAlert,
  IconButton,
  QueryState,
  Skeleton,
  Text,
  useTheme,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DILIGENCE,
  LAND_AREA_UNITS,
  ownerLandApi,
  type OwnerLandRecord,
} from '@/lib/api/ownerLand';
import { Sheet } from '@/components/Sheet';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { ParcelForm } from '@/components/land/ParcelForm';
import { goBack } from '@/lib/goBack';

/**
 * Land stays private until ownership and diligence are verified. This is
 * where an owner keeps each parcel's record complete so review can finish.
 */
export default function OwnerLand() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ parcel?: string }>();
  // Arriving from "register land" (?parcel=<id>) opens the new parcel's record
  // as soon as it's in the list.
  const [editingId, setEditingId] = useState<string | null>(params.parcel ?? null);
  const query = useQuery({ queryKey: qk.owner.land, queryFn: () => ownerLandApi.list() });
  const records = query.data?.items ?? [];
  const editing = records.find((r) => r.propertyId === editingId) ?? null;
  const setEditing = (r: OwnerLandRecord | null) => setEditingId(r?.propertyId ?? null);

  const verified = records.filter((r) => r.parcel?.diligence?.status === 'VERIFIED').length;
  const needsYou = records.filter(
    (r) => !r.parcel || r.parcel.diligence?.status === 'ACTION_REQUIRED'
  ).length;

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
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Portfolio"
          title="Land"
          subtitle="Private until ownership and diligence are verified"
          onBack={() => goBack()}
          accessory={
            <IconButton
              accessibilityLabel="Register land"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => router.push('/(app)/owner-add-property?type=LAND')}
            />
          }
        />

        <QueryState
          query={query}
          skeleton={<Skeleton height={140} radius={radius.lg} />}
          isEmpty={!records.length}
          empty={{
            icon: <LandPlot size={34} color={colors.mutedForeground} />,
            title: 'No land yet',
            description:
              'Register a parcel with its title document. Compliance verifies it before buyers can see it.',
            action: (
              <Button
                label="Register land"
                onPress={() => router.push('/(app)/owner-add-property?type=LAND')}
              />
            ),
          }}
        >
          <Button
            label="Plot sales"
            size="sm"
            variant="secondary"
            icon={<ReceiptText size={14} color={colors.foreground} />}
            onPress={() => router.push('/(app)/owner-land-sales')}
            style={{ alignSelf: 'flex-start' }}
          />
          <Button
            label="Video tours buyers asked for"
            size="sm"
            variant="secondary"
            icon={<Video size={14} color={colors.foreground} />}
            onPress={() => router.push('/(app)/owner-land-tours')}
            style={{ alignSelf: 'flex-start' }}
          />
          <Text variant="callout" color="mutedForeground">
            {records.length} parcel{records.length === 1 ? '' : 's'} · {verified} verified
            {needsYou ? ` · ${needsYou} need${needsYou === 1 ? 's' : ''} you` : ''}
          </Text>
          {records.map((r) => (
            <LandCard
              key={r.propertyId}
              r={r}
              onPress={() => router.push(`/(app)/owner-land-parcel/${r.propertyId}`)}
            />
          ))}
        </QueryState>
      </ScrollView>

      <Sheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? editing.title : 'Parcel'}
      >
        {editing ? (
          <ParcelForm key={editing.propertyId} r={editing} onDone={() => setEditing(null)} />
        ) : null}
      </Sheet>
    </View>
  );
}

function LandCard({ r, onPress }: { r: OwnerLandRecord; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const status = r.parcel?.diligence?.status ?? 'NOT_STARTED';
  const d = DILIGENCE[status];
  const area = r.parcel
    ? `${r.parcel.areaValue} ${LAND_AREA_UNITS.find((u) => u.value === r.parcel!.areaUnit)?.label ?? ''}`
    : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${r.title}, ${r.city}. Diligence ${d.label}. ${r.parcel ? '' : 'Parcel details missing.'} Open record`}
    >
      <Card elevated style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong">{r.title}</Text>
            <Text variant="caption" color="mutedForeground">
              {r.address}, {r.city}
              {area ? ` · ${area}` : ''}
            </Text>
          </View>
          <Badge label={d.label} tone={d.tone} />
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>
        {!r.parcel ? (
          <FormAlert
            tone="warning"
            message="Add the parcel’s area and title so review can start."
          />
        ) : r.parcel.diligence?.findings ? (
          <Text variant="caption">{r.parcel.diligence.findings}</Text>
        ) : null}
        {!r.ownershipProofCount ? (
          <Text variant="caption" color="mutedForeground">
            No title evidence yet: upload it from the property page.
          </Text>
        ) : null}
      </Card>
    </Pressable>
  );
}
