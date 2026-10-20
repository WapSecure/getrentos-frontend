'use client';

import { useMemo, useState } from 'react';
import { ClipboardPaste, Plus, Trash2 } from 'lucide-react';
import { Alert, Button, Field, IconButton, NumberInput, Select, Textarea } from '@getrentos/ui';
import {
  SUPPORTED_CRS,
  crsLabel,
  diagnoseCoordinates,
  toWgs84,
  type BoundaryCorner,
  type CrsCode,
} from '@getrentos/shared';
import { ParcelBoundaryMap } from '@/components/maps/ParcelBoundaryMap';

export interface SurveyRow {
  easting: string;
  northing: string;
}

/** The grids a Nigerian survey plan can be in; WGS 84 is offered for GPS readings. */
const SYSTEM_OPTIONS = [
  ...SUPPORTED_CRS.filter((c) => c.code !== 'EPSG:4326'),
  ...SUPPORTED_CRS.filter((c) => c.code === 'EPSG:4326'),
].map((c) => ({ value: c.code, label: c.label }));

/** Matches the API: an outline this far from the confirmed pin is refused. */
const MAX_PIN_DISTANCE_M = 3000;

const distanceM = (a: BoundaryCorner, b: { latitude: number; longitude: number }) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
};

/** Reads "552568.12, 712566.37" style lines (comma, tab or space separated) into rows. */
export function parseCoordinateLines(text: string): SurveyRow[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/[\s,;]+/).filter((part) => /^-?\d+(\.\d+)?$/.test(part)))
    .filter((parts) => parts.length >= 2)
    .map((parts) => ({ easting: parts[parts.length - 2], northing: parts[parts.length - 1] }));
}

/** The rows that are complete numbers, as [x, y] in the chosen system. */
export function completeRows(rows: SurveyRow[]): [number, number][] {
  return rows
    .filter((row) => row.easting !== '' && row.northing !== '')
    .map((row) => [Number(row.easting), Number(row.northing)] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
}

interface SurveyCoordinatesEntryProps {
  crs: CrsCode;
  onCrsChange: (crs: CrsCode) => void;
  rows: SurveyRow[];
  onRowsChange: (rows: SurveyRow[]) => void;
  /** The owner's confirmed map pin, to catch a plan read in the wrong grid. */
  pin: { latitude: number; longitude: number } | null;
}

/**
 * Beacon coordinates typed or pasted from a survey plan. They are shown on the
 * map as they will be saved, and checked against the two mistakes that are
 * easy to make: the wrong coordinate system, and latitude/longitude typed
 * where the plan gives eastings and northings.
 */
export function SurveyCoordinatesEntry({
  crs,
  onCrsChange,
  rows,
  onRowsChange,
  pin,
}: SurveyCoordinatesEntryProps) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const geographic = crs === 'EPSG:4326';
  const entered = useMemo(() => completeRows(rows), [rows]);

  const corners: BoundaryCorner[] = useMemo(
    () =>
      entered.map((point) => {
        const [longitude, latitude] = toWgs84(point, crs);
        return { latitude, longitude };
      }),
    [entered, crs]
  );

  const problem = useMemo(() => {
    if (entered.length === 0) return null;
    const asLngLat = corners.map((c) => [c.longitude, c.latitude] as [number, number]);
    if (diagnoseCoordinates(asLngLat).kind === 'ok') {
      if (!pin) return null;
      const centre = {
        latitude: corners.reduce((sum, c) => sum + c.latitude, 0) / corners.length,
        longitude: corners.reduce((sum, c) => sum + c.longitude, 0) / corners.length,
      };
      const metres = distanceM(centre, pin);
      if (metres <= MAX_PIN_DISTANCE_M) return null;
      return `Read as ${crsLabel(crs)}, these corners are ${Math.round(metres / 1000)} km from the property’s map pin. Check the coordinate system printed on the plan.`;
    }
    // Not in Nigeria as entered: say what the numbers look like.
    const raw = diagnoseCoordinates(entered);
    if (raw.kind === 'projected') {
      const fits = raw.candidates.filter((code) => code !== crs).map(crsLabel);
      return geographic
        ? `These look like eastings and northings, not latitude and longitude.${fits.length ? ` They fit ${fits.join(' or ')}.` : ''}`
        : `These don’t land in Nigeria as ${crsLabel(crs)}.${fits.length ? ` They fit ${fits.join(' or ')}.` : ''}`;
    }
    if (raw.kind === 'swapped') {
      return 'These look like latitude and longitude the wrong way round. Enter longitude first, then latitude.';
    }
    return `These don’t land in Nigeria as ${crsLabel(crs)}. Check the numbers and the coordinate system on the plan.`;
  }, [entered, corners, crs, geographic, pin]);

  const setRow = (index: number, key: keyof SurveyRow, value: string) =>
    onRowsChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const applyPaste = () => {
    const parsed = parseCoordinateLines(pasteText);
    if (parsed.length > 0) onRowsChange(parsed);
    setPasteOpen(false);
    setPasteText('');
  };

  const xLabel = geographic ? 'Longitude' : 'Easting (m)';
  const yLabel = geographic ? 'Latitude' : 'Northing (m)';

  return (
    <div className="space-y-4">
      <Field
        label="Coordinate system"
        hint="Printed on the survey plan, usually near the beacon table (for example “Minna / UTM Zone 31N”)."
      >
        <Select
          value={crs}
          onValueChange={(value) => onCrsChange(value as CrsCode)}
          options={SYSTEM_OPTIONS}
        />
      </Field>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">Beacons, in order around the plot</p>
          <Button
            variant="ghost"
            size="sm"
            icon={<ClipboardPaste className="h-4 w-4" />}
            onClick={() => setPasteOpen((open) => !open)}
            aria-expanded={pasteOpen}
          >
            Paste from the plan
          </Button>
        </div>

        {pasteOpen && (
          <div className="mb-3 space-y-2 rounded-lg border border-border bg-secondary/40 p-3">
            <Textarea
              aria-label="Paste beacon coordinates"
              rows={4}
              value={pasteText}
              onChange={(event) => setPasteText(event.target.value)}
              placeholder={'One beacon per line, for example\nPB 1234   552568.12   712566.37'}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPasteOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={applyPaste} disabled={!pasteText.trim()}>
                Use these
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2" role="group" aria-label="Beacon coordinates">
          <div
            aria-hidden="true"
            className="grid grid-cols-[1.75rem_1fr_1fr_2.25rem] gap-2 px-0.5 text-xs font-medium text-muted-foreground"
          >
            <span>#</span>
            <span>{xLabel}</span>
            <span>{yLabel}</span>
            <span />
          </div>
          {rows.map((row, index) => (
            <div
              key={index}
              className="grid grid-cols-[1.75rem_1fr_1fr_2.25rem] items-center gap-2"
            >
              <span className="text-sm tabular-nums text-muted-foreground">{index + 1}</span>
              <NumberInput
                aria-label={`${xLabel}, beacon ${index + 1}`}
                integer={false}
                value={row.easting}
                onValueChange={(value) => setRow(index, 'easting', value)}
                placeholder={geographic ? '3.47460' : '552568.12'}
              />
              <NumberInput
                aria-label={`${yLabel}, beacon ${index + 1}`}
                integer={false}
                value={row.northing}
                onValueChange={(value) => setRow(index, 'northing', value)}
                placeholder={geographic ? '6.44740' : '712566.37'}
              />
              <IconButton
                label={`Remove beacon ${index + 1}`}
                icon={<Trash2 />}
                variant="ghost"
                size="sm"
                disabled={rows.length <= 1}
                onClick={() => onRowsChange(rows.filter((_, i) => i !== index))}
              />
            </div>
          ))}
        </div>
        <Button
          className="mt-2"
          variant="outline"
          size="sm"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => onRowsChange([...rows, { easting: '', northing: '' }])}
        >
          Add beacon
        </Button>
      </div>

      {problem ? (
        <Alert variant="warning" title="Check these coordinates">
          {problem}
        </Alert>
      ) : (
        entered.length >= 3 && <ParcelBoundaryMap corners={corners} height={260} center={pin} />
      )}
      {entered.length > 0 && entered.length < 3 && (
        <p className="text-xs text-muted-foreground">Add at least 3 beacons to see the outline.</p>
      )}
    </div>
  );
}
