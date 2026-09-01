'use client';

import { useMemo, useState } from 'react';
import {
  Button,
  DocumentUploadDialog,
  Field,
  Input,
  NumberInput,
  Select,
  Switch,
  Textarea,
} from '@getrentos/ui';
import { FileUp, Save, ShieldCheck } from 'lucide-react';
import { LandDiligenceBadge } from './LandDiligenceBadge';
import {
  LAND_AREA_UNIT_LABELS,
  LAND_TITLE_TYPE_LABELS,
  type LandOwnershipProofInput,
  type LandParcelInput,
  type OwnerLandRecord,
} from '@/types/land';

interface LandParcelEditorProps {
  record: OwnerLandRecord;
  isSaving?: boolean;
  onSave: (parcel: LandParcelInput) => Promise<void>;
  onUploadProof: (proof: LandOwnershipProofInput) => Promise<void>;
}

const emptyParcel: LandParcelInput = {
  areaValue: 0,
  areaUnit: 'SQUARE_METERS',
  roadAccess: false,
  utilities: [],
  encumbranceStatus: 'UNKNOWN',
  subdivisionAllowed: false,
  fractionalOwnershipAllowed: false,
};

const textValue = (value: string | number | undefined | null) =>
  value === undefined || value === null ? '' : String(value);

export const LandParcelEditor = ({
  record,
  isSaving,
  onSave,
  onUploadProof,
}: LandParcelEditorProps) => {
  // The parent keys this editor by property id, so it remounts on record
  // change and the initializers always reflect the active parcel.
  const [parcel, setParcel] = useState<LandParcelInput>(record.parcel ?? emptyParcel);
  const [utilitiesText, setUtilitiesText] = useState((record.parcel?.utilities ?? []).join(', '));
  const [uploadOpen, setUploadOpen] = useState(false);

  const diligence = record.diligence ?? record.parcel?.diligence;
  const propertyTitle = record.property.title || record.property.name || 'Land parcel';

  const evidenceHint = useMemo(() => {
    if (diligence?.status === 'VERIFIED') {
      return 'This parcel passed the current diligence review and can be published once ownership verification is approved.';
    }
    if (diligence?.status === 'ACTION_REQUIRED' || diligence?.status === 'REJECTED') {
      return diligence.findings || 'Review the compliance note and upload the requested evidence.';
    }
    return 'Add parcel details and title evidence. Compliance will review them before a sale listing can be published.';
  }, [diligence]);

  const update = <K extends keyof LandParcelInput>(key: K, value: LandParcelInput[K]) => {
    setParcel((current) => ({ ...current, [key]: value }));
  };

  const handleSave = async () => {
    await onSave({
      ...parcel,
      areaValue: Number(parcel.areaValue) || 0,
      frontage: parcel.frontage ? Number(parcel.frontage) : undefined,
      depth: parcel.depth ? Number(parcel.depth) : undefined,
      utilities: utilitiesText
        .split(',')
        .map((utility) => utility.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Compliance readiness
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{propertyTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{evidenceHint}</p>
          </div>
          <LandDiligenceBadge status={diligence?.status} />
        </div>

        {diligence?.findings && diligence.status !== 'VERIFIED' && (
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/5 px-3.5 py-3 text-sm text-foreground">
            <p className="font-medium">Compliance note</p>
            <p className="mt-1 text-muted-foreground">{diligence.findings}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            rounded="lg"
            onClick={() => setUploadOpen(true)}
            icon={<FileUp className="h-4 w-4" />}
          >
            Upload title evidence
          </Button>
          {record.property.verificationStatus === 'APPROVED' &&
            diligence?.status === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-success">
                <ShieldCheck className="h-4 w-4" />
                Eligible for a sale listing
              </span>
            )}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="mb-5">
          <h3 className="font-semibold text-foreground">Parcel and title record</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These details help buyers and compliance identify the exact parcel—not just the address.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Plot number" hint="Use the plot number on the survey or allocation letter.">
            <Input
              value={textValue(parcel.plotNumber)}
              onChange={(event) => update('plotNumber', event.target.value || undefined)}
              placeholder="e.g. 24B"
            />
          </Field>
          <Field label="Block / phase">
            <Input
              value={textValue(parcel.block)}
              onChange={(event) => update('block', event.target.value || undefined)}
              placeholder="e.g. Phase 2, Block A"
            />
          </Field>
          <Field label="Estate or layout">
            <Input
              value={textValue(parcel.estateName)}
              onChange={(event) => update('estateName', event.target.value || undefined)}
              placeholder="e.g. Ibeju-Lekki Scheme"
            />
          </Field>
          <Field label="Survey number">
            <Input
              value={textValue(parcel.surveyNumber)}
              onChange={(event) => update('surveyNumber', event.target.value || undefined)}
              placeholder="Reference on the survey plan"
            />
          </Field>
          <Field label="Land area" required>
            <NumberInput
              integer={false}
              min="0"
              value={textValue(parcel.areaValue || '')}
              onValueChange={(value) => update('areaValue', Number(value) || 0)}
              placeholder="e.g. 600"
            />
          </Field>
          <Field label="Area unit" required>
            <Select
              value={parcel.areaUnit}
              onValueChange={(value) => update('areaUnit', value as LandParcelInput['areaUnit'])}
              options={Object.entries(LAND_AREA_UNIT_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              ariaLabel="Land area unit"
            />
          </Field>
          <Field label="Frontage (m)">
            <NumberInput
              integer={false}
              min="0"
              value={textValue(parcel.frontage)}
              onValueChange={(value) => update('frontage', value ? Number(value) : undefined)}
            />
          </Field>
          <Field label="Depth (m)">
            <NumberInput
              integer={false}
              min="0"
              value={textValue(parcel.depth)}
              onValueChange={(value) => update('depth', value ? Number(value) : undefined)}
            />
          </Field>
          <Field label="Zoning">
            <Input
              value={textValue(parcel.zoning)}
              onChange={(event) => update('zoning', event.target.value || undefined)}
              placeholder="Residential, mixed-use, agricultural…"
            />
          </Field>
          <Field label="Permitted use">
            <Input
              value={textValue(parcel.permittedUse)}
              onChange={(event) => update('permittedUse', event.target.value || undefined)}
              placeholder="e.g. Residential development"
            />
          </Field>
          <Field label="Title type">
            <Select
              value={parcel.titleType}
              onValueChange={(value) => update('titleType', value as LandParcelInput['titleType'])}
              options={Object.entries(LAND_TITLE_TYPE_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
              placeholder="Select title type"
              ariaLabel="Land title type"
            />
          </Field>
          <Field label="Title / file number">
            <Input
              value={textValue(parcel.titleNumber)}
              onChange={(event) => update('titleNumber', event.target.value || undefined)}
              placeholder="Registry reference"
            />
          </Field>
          <Field label="Registry authority">
            <Input
              value={textValue(parcel.registryAuthority)}
              onChange={(event) => update('registryAuthority', event.target.value || undefined)}
              placeholder="e.g. Lagos State Lands Bureau"
            />
          </Field>
          <Field label="Tenure">
            <Input
              value={textValue(parcel.tenure)}
              onChange={(event) => update('tenure', event.target.value || undefined)}
              placeholder="e.g. Statutory right of occupancy"
            />
          </Field>
          <Field label="Terrain">
            <Input
              value={textValue(parcel.terrain)}
              onChange={(event) => update('terrain', event.target.value || undefined)}
              placeholder="e.g. Level, dry land"
            />
          </Field>
          <Field label="Encumbrance status">
            <Select
              value={parcel.encumbranceStatus}
              onValueChange={(value) =>
                update('encumbranceStatus', value as LandParcelInput['encumbranceStatus'])
              }
              options={[
                { value: 'UNKNOWN', label: 'Not yet confirmed' },
                { value: 'CLEAR', label: 'Clear / none known' },
                { value: 'FLAGGED', label: 'Flagged for review' },
              ]}
              ariaLabel="Encumbrance status"
            />
          </Field>
          <Field label="Utilities" hint="Separate available utilities with commas.">
            <Input
              value={utilitiesText}
              onChange={(event) => setUtilitiesText(event.target.value)}
              placeholder="Road, electricity, water"
            />
          </Field>
        </div>

        <div className="mt-5 grid gap-4 rounded-xl bg-secondary/45 p-4 sm:grid-cols-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Road access</span>
            <Switch
              checked={Boolean(parcel.roadAccess)}
              onCheckedChange={(value) => update('roadAccess', value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Can subdivide</span>
            <Switch
              checked={Boolean(parcel.subdivisionAllowed)}
              onCheckedChange={(value) => update('subdivisionAllowed', value)}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Fractional ownership</span>
            <Switch
              checked={Boolean(parcel.fractionalOwnershipAllowed)}
              onCheckedChange={(value) => update('fractionalOwnershipAllowed', value)}
            />
          </div>
        </div>

        <Field
          className="mt-4"
          label="Boundary / survey notes"
          hint="Add a concise note until mapped boundary support is connected."
        >
          <Textarea
            value={textValue(parcel.boundaryNotes)}
            onChange={(event) => update('boundaryNotes', event.target.value || undefined)}
            rows={3}
            placeholder="Survey beacon references, boundary description, or adjacent landmarks"
          />
        </Field>

        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            rounded="lg"
            onClick={handleSave}
            disabled={parcel.areaValue <= 0 || isSaving}
            isLoading={isSaving}
            icon={<Save className="h-4 w-4" />}
          >
            {isSaving ? 'Saving parcel…' : 'Save parcel record'}
          </Button>
        </div>
      </section>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        categories={[
          { value: 'C_OF_O', label: 'Certificate of Occupancy (C of O)' },
          { value: 'DEED', label: 'Deed' },
          { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
          { value: 'GOVERNOR_CONSENT', label: "Governor's Consent" },
          { value: 'ALLOCATION_LETTER', label: 'Allocation Letter' },
          { value: 'EXCISION_GAZETTE', label: 'Excision Gazette' },
          { value: 'REGISTERED_CONVEYANCE', label: 'Registered Conveyance' },
          { value: 'SURVEY_PLAN', label: 'Survey plan' },
          { value: 'LAND_USE_PERMIT', label: 'Land use permit' },
          { value: 'GOVERNMENT_RECEIPT', label: 'Government receipt / registry extract' },
          { value: 'OTHER', label: 'Other supporting evidence' },
        ]}
        onUpload={({ category, file }) =>
          onUploadProof({
            documentType: category as LandOwnershipProofInput['documentType'],
            file,
          })
        }
      />
    </div>
  );
};
