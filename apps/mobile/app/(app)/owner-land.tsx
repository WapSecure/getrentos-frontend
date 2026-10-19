import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, LandPlot, Plus } from 'lucide-react-native';
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ErrorState,
  FormAlert,
  IconButton,
  NumberField,
  Skeleton,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import {
  DILIGENCE,
  LAND_AREA_UNITS,
  LAND_TITLE_TYPES,
  ownerLandApi,
  type LandAreaUnit,
  type LandTitleType,
  type OwnerLandRecord,
} from '@/lib/api/ownerLand';
import { ApiError } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import {
  boundaryAreaMismatch,
  boundaryAreaSqm,
  boundaryCorners,
  boundaryGeometry,
  type BoundaryCorner,
} from '@getrentos/shared';
import { DetailHeader } from '@/components/dashboard/DetailHeader';

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
          onBack={() => router.back()}
          accessory={
            <IconButton
              accessibilityLabel="Register land"
              icon={<Plus size={20} color={colors.primary} />}
              onPress={() => router.push('/(app)/owner-add-property?type=LAND')}
            />
          }
        />

        {query.isError && !query.data ? (
          <ErrorState onRetry={() => query.refetch()} />
        ) : query.isPending ? (
          <Skeleton height={140} radius={radius.lg} />
        ) : !records.length ? (
          <EmptyState
            icon={<LandPlot size={34} color={colors.mutedForeground} />}
            title="No land yet"
            description="Register a parcel with its title document. Compliance verifies it before buyers can see it."
            action={
              <Button
                label="Register land"
                onPress={() => router.push('/(app)/owner-add-property?type=LAND')}
              />
            }
          />
        ) : (
          <>
            <Text variant="callout" color="mutedForeground">
              {records.length} parcel{records.length === 1 ? '' : 's'} · {verified} verified
              {needsYou ? ` · ${needsYou} need${needsYou === 1 ? 's' : ''} you` : ''}
            </Text>
            {records.map((r) => (
              <LandCard key={r.propertyId} r={r} onPress={() => setEditing(r)} />
            ))}
          </>
        )}
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
      accessibilityLabel={`${r.title}, ${r.city}. Diligence ${d.label}. ${r.parcel ? '' : 'Parcel details missing.'} Edit record`}
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

const orUndefined = (v: string) => (v.trim() ? v.trim() : undefined);

function ParcelForm({ r, onDone }: { r: OwnerLandRecord; onDone: () => void }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const p = r.parcel;
  const [plotNumber, setPlotNumber] = useState(p?.plotNumber ?? '');
  const [block, setBlock] = useState(p?.block ?? '');
  const [estateName, setEstateName] = useState(p?.estateName ?? '');
  const [area, setArea] = useState(p?.areaValue ? String(p.areaValue) : '');
  const [areaUnit, setAreaUnit] = useState<LandAreaUnit>(p?.areaUnit ?? 'SQUARE_METERS');
  const [titleType, setTitleType] = useState<LandTitleType | undefined>(p?.titleType);
  const [titleNumber, setTitleNumber] = useState(p?.titleNumber ?? '');
  const [surveyNumber, setSurveyNumber] = useState(p?.surveyNumber ?? '');
  const [zoning, setZoning] = useState(p?.zoning ?? '');
  const [roadAccess, setRoadAccess] = useState(p?.roadAccess ?? false);
  const [notes, setNotes] = useState(p?.boundaryNotes ?? '');
  const [savedCorners] = useState(() => boundaryCorners(p?.boundaryGeometry));
  const [corners, setCorners] = useState<BoundaryCorner[]>(savedCorners ?? []);
  const areaValue = Number(area.replace(/,/g, ''));
  const outlined = boundaryAreaSqm(corners);
  const mismatch = boundaryAreaMismatch(corners, areaValue, areaUnit);

  const save = useMutation({
    mutationFn: () =>
      ownerLandApi.upsertParcel(r.propertyId, {
        plotNumber: orUndefined(plotNumber),
        block: orUndefined(block),
        estateName: orUndefined(estateName),
        areaValue,
        areaUnit,
        titleType,
        titleNumber: orUndefined(titleNumber),
        surveyNumber: orUndefined(surveyNumber),
        zoning: orUndefined(zoning),
        roadAccess,
        boundaryNotes: orUndefined(notes),
        // Fewer than 3 corners is no outline: clear a saved one, otherwise send nothing.
        boundaryGeometry: boundaryGeometry(corners) ?? (savedCorners ? null : undefined),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.owner.land });
      toast.show('Parcel record saved.', 'success');
      onDone();
    },
  });

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <NumberField
          label="Area"
          value={area}
          onValueChange={setArea}
          decimals={2}
          required
          containerStyle={{ flex: 1 }}
        />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          {LAND_AREA_UNITS.map((u) => (
            <Chip
              key={u.value}
              label={u.label}
              size="sm"
              selected={areaUnit === u.value}
              onPress={() => setAreaUnit(u.value)}
            />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <TextField
          label="Plot no."
          value={plotNumber}
          onChangeText={setPlotNumber}
          containerStyle={{ flex: 1 }}
        />
        <TextField
          label="Block"
          value={block}
          onChangeText={setBlock}
          containerStyle={{ flex: 1 }}
        />
      </View>
      <TextField
        label="Estate or layout (optional)"
        value={estateName}
        onChangeText={setEstateName}
      />

      <Text variant="bodyStrong">Title</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {LAND_TITLE_TYPES.map((t) => (
          <Chip
            key={t.value}
            label={t.label}
            size="sm"
            selected={titleType === t.value}
            onPress={() => setTitleType(t.value)}
          />
        ))}
      </View>
      <TextField
        label="Title number (kept private)"
        value={titleNumber}
        onChangeText={setTitleNumber}
      />
      <TextField label="Survey plan number" value={surveyNumber} onChangeText={setSurveyNumber} />
      <TextField label="Zoning (e.g. residential)" value={zoning} onChangeText={setZoning} />
      <SwitchRow label="Has road access" value={roadAccess} onValueChange={setRoadAccess} />
      <View style={{ gap: spacing.sm }}>
        <Text variant="bodyStrong">Plot outline</Text>
        <Text variant="caption" color="mutedForeground">
          Tap each corner of the plot in turn, following your survey plan. Drag a corner to adjust
          it. Buyers see the outline once the land is verified.
        </Text>
        <PropertyMapView
          markers={[]}
          variant="boundary"
          boundary={corners}
          onBoundaryChange={setCorners}
          center={
            r.latitude != null && r.longitude != null
              ? { latitude: r.latitude, longitude: r.longitude }
              : undefined
          }
          zoom={r.latitude != null ? 17 : 12}
          height={260}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
            {corners.length >= 3
              ? `Outlined area: about ${formatSqm(outlined)}`
              : corners.length
                ? `${corners.length} of at least 3 corners`
                : 'No outline yet'}
          </Text>
          {corners.length ? (
            <>
              <Chip label="Undo" size="sm" onPress={() => setCorners((c) => c.slice(0, -1))} />
              <Chip label="Clear" size="sm" onPress={() => setCorners([])} />
            </>
          ) : null}
        </View>
        {mismatch ? (
          <Text variant="caption" style={{ color: colors.warning }}>
            The outline covers about {formatSqm(mismatch.outlinedSqm)}, but the area above is{' '}
            {formatSqm(mismatch.statedSqm)}. Buyers see both: check the corners and the area unit
            before saving.
          </Text>
        ) : null}
      </View>
      <TextField
        label="Boundary notes (optional)"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      {save.error ? (
        <FormAlert
          message={
            save.error instanceof ApiError ? save.error.message : 'Could not save the parcel.'
          }
        />
      ) : null}
      <Button
        label="Save parcel"
        disabled={!(areaValue > 0)}
        loading={save.isPending}
        onPress={() => save.mutate()}
      />
      <Button
        label="Open property"
        variant="ghost"
        onPress={() => {
          onDone();
          router.push(`/(app)/owner-property/${r.propertyId}`);
        }}
      />
    </View>
  );
}

function formatSqm(sqm: number): string {
  return sqm >= 10_000
    ? `${(sqm / 10_000).toFixed(2)} ha`
    : `${Math.round(sqm).toLocaleString('en-NG')} m²`;
}
