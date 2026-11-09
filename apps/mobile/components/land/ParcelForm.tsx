import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Chip,
  FormAlert,
  NumberField,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import {
  LAND_AREA_UNITS,
  LAND_TITLE_TYPES,
  ownerLandApi,
  type LandAreaUnit,
  type LandTitleType,
  type OwnerLandRecord,
} from '@/lib/api/ownerLand';
import { errorMessage } from '@/lib/api/client';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import {
  boundaryAreaMismatch,
  boundaryAreaSqm,
  boundaryCorners,
  boundaryGeometry,
  boundarySignOffText,
  type BoundaryCorner,
} from '@sureground/shared';

/** The parcel's facts and outline: what diligence reviews. */
const orUndefined = (v: string) => (v.trim() ? v.trim() : undefined);

export function ParcelForm({ r, onDone }: { r: OwnerLandRecord; onDone: () => void }) {
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
  const [subdivisionAllowed, setSubdivisionAllowed] = useState(p?.subdivisionAllowed ?? false);
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
        subdivisionAllowed,
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
      <SwitchRow
        label="Can subdivide"
        description="The title permits carving plots out of it. Needed to sell it as an estate."
        value={subdivisionAllowed}
        onValueChange={setSubdivisionAllowed}
      />
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
        {r.boundary ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              flexWrap: 'wrap',
            }}
          >
            <Badge
              label={
                r.boundary.signOff.status === 'SIGNED_OFF'
                  ? 'Surveyor signed off'
                  : r.boundary.signOff.status === 'REJECTED'
                    ? 'Needs correcting'
                    : 'Not yet checked'
              }
              tone={
                r.boundary.signOff.status === 'SIGNED_OFF'
                  ? 'success'
                  : r.boundary.signOff.status === 'REJECTED'
                    ? 'danger'
                    : 'neutral'
              }
            />
            <Text variant="caption" color="mutedForeground" style={{ flex: 1 }}>
              Version {r.boundary.version}. {boundarySignOffText(r.boundary.signOff)}
              {r.boundary.signOff.status === 'REJECTED' && r.boundary.signOff.note
                ? `: “${r.boundary.signOff.note}”`
                : '.'}{' '}
              Redrawing the outline starts a new version.
            </Text>
          </View>
        ) : null}
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
        <FormAlert message={errorMessage(save.error, 'Could not save the parcel.')} />
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
