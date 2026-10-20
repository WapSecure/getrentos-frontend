'use client';

import { useState } from 'react';
import { Check, FileText, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import {
  Alert,
  Button,
  Checkbox,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
} from '@getrentos/ui';
import { LocationFields } from '@/components/shared/location/LocationFields';
import type { OwnerProperty } from '@/types/owner';
import { PROPERTY_TYPE_OPTIONS } from '@/lib/propertyTypes';
import type { LandOwnershipProofInput } from '@/types/land';
import { ROUTES } from '@/lib/constants/auth';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { MapPoint } from '@/services/geocodeService';

interface AddOwnerPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    property: Omit<
      OwnerProperty,
      'id' | 'hasActiveSaleListing' | 'createdAt' | 'verificationStatus'
    >,
    ownershipProofs: LandOwnershipProofInput[]
  ) => Promise<OwnerPropertySubmissionResult>;
}

export interface OwnerPropertySubmissionResult {
  propertyId: string;
  failedProofCount: number;
}

const steps = ['Ownership Info', 'Documents', 'Declaration', 'Status'];

const propertyTypes = PROPERTY_TYPE_OPTIONS;

interface FormState {
  name: string;
  propertyType: string;
  address: string;
  city: string;
  state: string;
  country: string;
  ownerName: string;
  estimatedValue: string;
  purchasePrice: string;
  purchaseDate: string;
  titleDeed: File | null;
  certificateOfOccupancy: File | null;
  deedOfAssignment: File | null;
  govtRegistryExtract: File | null;
  declared: boolean;
  pin: MapPoint | null;
}

const initialFormState: FormState = {
  name: '',
  propertyType: 'APARTMENT',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  ownerName: '',
  estimatedValue: '',
  purchasePrice: '',
  purchaseDate: '',
  titleDeed: null,
  certificateOfOccupancy: null,
  deedOfAssignment: null,
  govtRegistryExtract: null,
  pin: null,
  declared: false,
};

export const AddOwnerPropertyModal = ({
  isOpen,
  onClose,
  onSubmit,
}: AddOwnerPropertyModalProps) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setStep(0);
    setForm(initialFormState);
    setSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
    setUploadWarning(null);
    onClose();
  };

  const canProceedFromStep1 =
    form.name.trim() &&
    form.address.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.ownerName.trim();

  const hasAnyDocument =
    form.titleDeed ||
    form.certificateOfOccupancy ||
    form.deedOfAssignment ||
    form.govtRegistryExtract;

  const handleSubmitForVerification = async () => {
    const ownershipProofs: LandOwnershipProofInput[] = [
      form.titleDeed && { documentType: 'DEED', file: form.titleDeed },
      form.certificateOfOccupancy && {
        documentType: 'C_OF_O' as const,
        file: form.certificateOfOccupancy,
      },
      form.deedOfAssignment && {
        documentType: 'DEED_OF_ASSIGNMENT' as const,
        file: form.deedOfAssignment,
      },
      form.govtRegistryExtract && {
        documentType: 'GOVERNMENT_RECEIPT' as const,
        file: form.govtRegistryExtract,
      },
    ].filter((proof): proof is LandOwnershipProofInput => Boolean(proof));

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const result = await onSubmit(
        {
          name: form.name,
          propertyType: form.propertyType,
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          ownerName: form.ownerName,
          estimatedValue: Number(form.estimatedValue) || 0,
          purchasePrice: Number(form.purchasePrice) || 0,
          purchaseDate: form.purchaseDate || new Date().toISOString(),
          ...(form.pin ? { latitude: form.pin.latitude, longitude: form.pin.longitude } : {}),
        },
        ownershipProofs
      );
      if (result.failedProofCount > 0) {
        setUploadWarning(
          `${result.failedProofCount} document${result.failedProofCount === 1 ? '' : 's'} could not upload. Your property was still created. Open its verification status to retry the evidence.`
        );
      }
      setSubmitted(true);
      setStep(3);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Unable to submit property documents.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && handleClose()}>
      <DialogContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden p-0">
        <div className="shrink-0 border-b border-border p-4 pr-12">
          <DialogTitle className="font-semibold text-foreground">Add Property</DialogTitle>
          <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
            Step {step + 1} of {steps.length}: {steps[step]}
          </DialogDescription>
        </div>

        <div className="shrink-0 px-4 pt-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((label, index) => (
              <div
                key={label}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {step === 0 && (
            <>
              <Field label="Property Name" required>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Lekki Waterfront Duplex"
                />
              </Field>

              <Field label="Property Type">
                <Select
                  value={form.propertyType}
                  onValueChange={(v) => update('propertyType', v)}
                  options={propertyTypes.map((type) => ({ value: type.value, label: type.label }))}
                />
              </Field>

              <Field label="Registered Owner Name" required>
                <Input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => update('ownerName', e.target.value)}
                  placeholder="Full legal name as on title document"
                />
              </Field>

              <Field label="Address" required>
                <Input
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Street address"
                />
              </Field>

              <LocationFields
                country={form.country}
                state={form.state}
                city={form.city}
                onCountryChange={(c) => update('country', c)}
                onStateChange={(s) => update('state', s)}
                onCityChange={(c) => update('city', c)}
                required
              />

              <LocationPicker
                address={form.address}
                city={form.city}
                state={form.state}
                country={form.country}
                value={form.pin}
                onChange={(pin) => update('pin', pin)}
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Purchase Price (₦)">
                  <CurrencyInput
                    prefix="₦"
                    min={0}
                    value={form.purchasePrice}
                    onValueChange={(v) => update('purchasePrice', v === 0 ? '' : String(v))}
                  />
                </Field>
                <Field label="Estimated Value (₦)">
                  <CurrencyInput
                    prefix="₦"
                    min={0}
                    value={form.estimatedValue}
                    onValueChange={(v) => update('estimatedValue', v === 0 ? '' : String(v))}
                  />
                </Field>
              </div>

              <Field label="Purchase Date">
                <DatePicker
                  value={form.purchaseDate}
                  onChange={(v) => update('purchaseDate', v)}
                  max={new Date().toISOString().slice(0, 10)}
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Alert variant="info" icon={ShieldAlert}>
                Upload at least one proof of ownership. Our compliance team verifies documents
                before your property can be listed for sale.
              </Alert>
              <UploadField
                label="Title Deed"
                file={form.titleDeed}
                onSelect={(file) => update('titleDeed', file)}
              />
              <UploadField
                label="Certificate of Occupancy (C of O)"
                file={form.certificateOfOccupancy}
                onSelect={(file) => update('certificateOfOccupancy', file)}
              />
              <UploadField
                label="Deed of Assignment"
                file={form.deedOfAssignment}
                onSelect={(file) => update('deedOfAssignment', file)}
              />
              <UploadField
                label="Government Registry Extract"
                file={form.govtRegistryExtract}
                onSelect={(file) => update('govtRegistryExtract', file)}
              />
              {!hasAnyDocument && (
                <p className="text-xs text-destructive">
                  At least one document is required to proceed.
                </p>
              )}
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                <SummaryRow label="Property" value={form.name || '—'} />
                <SummaryRow label="Owner" value={form.ownerName || '—'} />
                <SummaryRow
                  label="Address"
                  value={`${form.address}, ${form.city}, ${form.state}`}
                />
                <SummaryRow
                  label="Documents"
                  value={hasAnyDocument ? 'Submitted' : 'None uploaded'}
                />
              </div>
              <div className="rounded-lg border border-border p-3">
                <Checkbox
                  checked={form.declared}
                  onCheckedChange={(checked) => update('declared', checked)}
                  label="I declare that I am the legal and rightful owner of this property, that the documents provided are authentic, and that all information submitted is accurate to the best of my knowledge."
                />
              </div>
            </div>
          )}

          {submitError && <Alert variant="danger">{submitError}</Alert>}

          {step === 3 && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-subtle">
                <Clock className="h-8 w-8 text-warning" />
              </div>
              <h4 className="text-lg font-semibold text-foreground">Pending Review</h4>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                Your ownership documents for <strong>{form.name}</strong> have been submitted. Our
                compliance team typically completes review within 24–48 hours.
              </p>
              {uploadWarning && (
                <Alert variant="warning" className="mt-3 text-left">
                  {uploadWarning}
                </Alert>
              )}
              {form.propertyType === 'LAND' && (
                <Button
                  href={ROUTES.OWNER_LAND}
                  variant="outline"
                  size="sm"
                  rounded="lg"
                  className="mt-4"
                >
                  Complete parcel record
                </Button>
              )}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                You&apos;ll be notified as soon as a decision is made
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border p-4">
          {step > 0 && !submitted && (
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={isSubmitting}>
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step === 0 && (
            <Button variant="primary" onClick={() => setStep(1)} disabled={!canProceedFromStep1}>
              Continue
            </Button>
          )}
          {step === 1 && (
            <Button variant="primary" onClick={() => setStep(2)} disabled={!hasAnyDocument}>
              Continue
            </Button>
          )}
          {step === 2 && (
            <Button
              variant="primary"
              onClick={handleSubmitForVerification}
              disabled={!form.declared}
              isLoading={isSubmitting}
              loadingText="Submitting…"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              Submit for Verification
            </Button>
          )}
          {step === 3 && (
            <Button variant="primary" onClick={handleClose} icon={<Check className="h-4 w-4" />}>
              Done
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UploadField = ({
  label,
  file,
  onSelect,
}: {
  label: string;
  file: File | null;
  onSelect: (file: File | null) => void;
}) => {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-border px-3 py-3 transition-colors focus-within:ring-2 focus-within:ring-ring hover:border-primary">
        <input
          type="file"
          aria-label={label}
          className="sr-only"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="text-sm text-muted-foreground truncate">
          {file?.name || 'Click to upload'}
        </span>
        {file && <Check className="ml-auto h-4 w-4 shrink-0 text-success" />}
      </label>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-3 py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right truncate max-w-[60%]">{value}</span>
  </div>
);
