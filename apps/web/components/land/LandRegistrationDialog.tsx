'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DocumentUpload,
  Field,
  Input,
  NumberInput,
  Select,
} from '@sureground/ui';
import { MapPinned } from '@sureground/icons';
import type { OwnerProperty } from '@/types/owner';
import {
  LAND_AREA_UNIT_LABELS,
  type LandOwnershipProofInput,
  type LandParcelInput,
} from '@/types/land';
import { AddressFields, type AddressFieldsValue } from '@/components/shared/location/AddressFields';
import { alphanumericOnly } from '@/lib/validations/input';

export interface LandRegistrationInput {
  property: Pick<
    OwnerProperty,
    | 'name'
    | 'address'
    | 'city'
    | 'state'
    | 'country'
    | 'placeId'
    | 'estimatedValue'
    | 'purchasePrice'
    | 'purchaseDate'
  >;
  parcel: LandParcelInput;
  ownershipProof?: LandOwnershipProofInput;
}

interface LandRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: LandRegistrationInput) => Promise<void>;
}

const ownershipProofOptions: { value: LandOwnershipProofInput['documentType']; label: string }[] = [
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
  { value: 'OTHER', label: 'Other evidence' },
];

const emptyLocation: AddressFieldsValue = { address: '', city: '', state: '', country: 'Nigeria' };

export const LandRegistrationDialog = ({
  open,
  onOpenChange,
  onCreate,
}: LandRegistrationDialogProps) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState<AddressFieldsValue>(emptyLocation);
  const { address, city, state, country } = location;
  const [estimatedValue, setEstimatedValue] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [plotNumber, setPlotNumber] = useState('');
  const [areaValue, setAreaValue] = useState('');
  const [areaUnit, setAreaUnit] = useState<LandParcelInput['areaUnit']>('SQUARE_METERS');
  const [titleType, setTitleType] = useState<LandParcelInput['titleType']>();
  const [surveyNumber, setSurveyNumber] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [proofType, setProofType] = useState<LandOwnershipProofInput['documentType']>('C_OF_O');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setLocation(emptyLocation);
    setEstimatedValue('');
    setPurchasePrice('');
    setPlotNumber('');
    setAreaValue('');
    setAreaUnit('SQUARE_METERS');
    setTitleType(undefined);
    setSurveyNumber('');
    setProof(null);
    setProofType('C_OF_O');
    setError(null);
  };

  const close = (next: boolean) => {
    if (!next && isSubmitting) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const submit = async () => {
    if (
      !name.trim() ||
      !address.trim() ||
      !city.trim() ||
      !state.trim() ||
      Number(areaValue) <= 0
    ) {
      setError('Add the location and a valid parcel area before continuing.');
      return;
    }
    if (!proof) {
      setError('Upload at least one ownership document to register land for verification.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate({
        property: {
          name: name.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          country: country.trim() || 'Nigeria',
          placeId: location.placeId,
          estimatedValue: Number(estimatedValue) || 0,
          purchasePrice: Number(purchasePrice) || undefined,
          purchaseDate: undefined,
        },
        parcel: {
          plotNumber: plotNumber.trim() || undefined,
          areaValue: Number(areaValue),
          areaUnit,
          titleType,
          surveyNumber: surveyNumber.trim() || undefined,
          roadAccess: false,
          utilities: [],
          encumbranceStatus: 'UNKNOWN',
          subdivisionAllowed: false,
          fractionalOwnershipAllowed: false,
        },
        ownershipProof: { documentType: proofType, file: proof },
      });
      reset();
      onOpenChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to register this parcel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="p-0">
        <div className="border-b border-border p-5">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <MapPinned className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">
                Register land
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Start a verifiable parcel record. It stays private until ownership and diligence are
                approved.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="max-h-[68vh] space-y-4 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Land title" required className="sm:col-span-2">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. 600 sqm plot in Ibeju-Lekki"
              />
            </Field>
            <div className="space-y-4 sm:col-span-2">
              <AddressFields
                required
                kind="any"
                label="Address / layout"
                placeholder="Street, layout, or nearest landmark"
                value={location}
                onChange={(patch) => setLocation((prev) => ({ ...prev, ...patch }))}
              />
            </div>
            <Field label="Plot number">
              <Input
                value={plotNumber}
                onChange={(event) => setPlotNumber(alphanumericOnly(event.target.value))}
                placeholder="e.g. 24B"
                maxLength={10}
              />
            </Field>
            <Field label="Parcel area" required>
              <NumberInput
                integer={false}
                min="0"
                value={areaValue}
                onValueChange={setAreaValue}
                placeholder="e.g. 600"
              />
            </Field>
            <Field label="Unit" required>
              <Select
                value={areaUnit}
                onValueChange={(value) => setAreaUnit(value as LandParcelInput['areaUnit'])}
                options={Object.entries(LAND_AREA_UNIT_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                ariaLabel="Land area unit"
              />
            </Field>
            <Field label="Title type">
              <Select
                value={titleType}
                onValueChange={(value) => setTitleType(value as LandParcelInput['titleType'])}
                options={[
                  { value: 'CERTIFICATE_OF_OCCUPANCY', label: 'Certificate of Occupancy' },
                  { value: 'DEED_OF_ASSIGNMENT', label: 'Deed of Assignment' },
                  { value: 'GOVERNOR_CONSENT', label: "Governor's Consent" },
                  { value: 'ALLOCATION_LETTER', label: 'Allocation Letter' },
                  { value: 'EXCISION_GAZETTE', label: 'Excision Gazette' },
                  { value: 'REGISTERED_CONVEYANCE', label: 'Registered Conveyance' },
                  { value: 'SURVEY_PLAN', label: 'Survey Plan' },
                  { value: 'OTHER', label: 'Other title record' },
                ]}
                placeholder="Select title type"
                ariaLabel="Land title type"
              />
            </Field>
            <Field label="Survey number">
              <Input
                value={surveyNumber}
                onChange={(event) => setSurveyNumber(event.target.value)}
                placeholder="Survey reference"
              />
            </Field>
            <Field label="Estimated value">
              <CurrencyInput
                prefix="₦"
                min="0"
                value={estimatedValue}
                onValueChange={(v) => setEstimatedValue(v === 0 ? '' : String(v))}
              />
            </Field>
            <Field label="Purchase price">
              <CurrencyInput
                prefix="₦"
                min="0"
                value={purchasePrice}
                onValueChange={(v) => setPurchasePrice(v === 0 ? '' : String(v))}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-dashed border-border bg-secondary/35 p-4">
            <p className="text-sm font-medium text-foreground">Ownership evidence</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Uploading evidence now starts ownership verification. You can add further files after
              registration.
            </p>
            <div className="mt-3 space-y-3">
              <Select
                value={proofType}
                onValueChange={(value) =>
                  setProofType(value as LandOwnershipProofInput['documentType'])
                }
                options={ownershipProofOptions}
                ariaLabel="Ownership proof type"
              />
              <DocumentUpload
                value={proof ? [{ id: 'proof', file: proof }] : []}
                onChange={(items) => setProof(items[0]?.file ?? null)}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple={false}
                label=""
                hint="Ownership evidence (PDF or image): preview before submitting"
              />
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-5">
          <Button variant="ghost" rounded="lg" onClick={() => close(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" rounded="lg" onClick={submit} isLoading={isSubmitting}>
            {isSubmitting ? 'Registering…' : 'Register land'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
