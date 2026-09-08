'use client';

import { LegacyInput, NumberInput } from '@getrentos/ui';

import { Textarea } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { LocationFields } from '@/components/shared/location/LocationFields';
import type { Property, PropertyType } from '@/types/landlord';
import type { LandOwnershipProofInput } from '@/types/land';

export interface LandlordPropertySubmission {
  property: Pick<
    Property,
    'name' | 'type' | 'address' | 'city' | 'state' | 'country' | 'description' | 'totalUnits'
  >;
  coverImage: File;
  galleryImages: File[];
  videoTour: File | null;
  ownershipProofs: LandOwnershipProofInput[];
  publishRequested: boolean;
}

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (submission: LandlordPropertySubmission) => Promise<void>;
  isSubmitting?: boolean;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'condo', label: 'Condo' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'shared_apartment', label: 'Shared Apartment' },
];

const steps = ['Property Info', 'Media', 'Verification', 'Review'];

interface FormState {
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  totalUnits: string;
  coverImage: File | null;
  galleryImages: File[];
  videoTour: File | null;
  titleDeed: File | null;
  certificateOfOccupancy: File | null;
  managementAuthorization: File | null;
}

const initialFormState: FormState = {
  name: '',
  type: 'apartment',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  description: '',
  totalUnits: '1',
  coverImage: null,
  galleryImages: [],
  videoTour: null,
  titleDeed: null,
  certificateOfOccupancy: null,
  managementAuthorization: null,
};

export const AddPropertyModal = ({
  isOpen,
  onClose,
  onPublish,
  isSubmitting = false,
}: AddPropertyModalProps) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setStep(0);
    setForm(initialFormState);
    setSubmitError(null);
    onClose();
  };

  const canProceedFromStep1 =
    form.name.trim() && form.address.trim() && form.city.trim() && form.state.trim();
  const canProceedFromStep2 = Boolean(form.coverImage);

  const handlePublish = async (publishRequested: boolean) => {
    if (!form.coverImage) return;
    const ownershipProofs: LandOwnershipProofInput[] = [];
    if (form.titleDeed) ownershipProofs.push({ documentType: 'DEED', file: form.titleDeed });
    if (form.certificateOfOccupancy) {
      ownershipProofs.push({ documentType: 'C_OF_O', file: form.certificateOfOccupancy });
    }
    if (form.managementAuthorization) {
      ownershipProofs.push({
        documentType: 'MANAGEMENT_AUTHORIZATION',
        file: form.managementAuthorization,
      });
    }
    setSubmitError(null);
    try {
      await onPublish({
        property: {
          name: form.name,
          type: form.type,
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          description: form.description || undefined,
          totalUnits: Number(form.totalUnits) || 1,
        },
        coverImage: form.coverImage,
        galleryImages: form.galleryImages,
        videoTour: form.videoTour,
        ownershipProofs,
        publishRequested,
      });
      handleClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create the property.');
    }
  };

  const hasAnyVerificationDoc =
    form.titleDeed || form.certificateOfOccupancy || form.managementAuthorization;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">Add Property</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Step {step + 1} of {steps.length}: {steps[step]}
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Close add property"
                className="p-1 rounded-lg hover:bg-secondary disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pt-3 shrink-0">
              <div className="flex gap-1.5">
                {steps.map((label, index) => (
                  <div
                    key={label}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {step === 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Property Name <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="text"
                      value={form.name}
                      onChange={(e) => update('name', e.target.value)}
                      placeholder="e.g. Sunrise Apartments"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Property Type
                    </label>
                    <LegacySelect
                      value={form.type}
                      onChange={(e) => update('type', e.target.value as PropertyType)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {propertyTypes.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </LegacySelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="text"
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="Street address"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <LocationFields
                    country={form.country}
                    state={form.state}
                    city={form.city}
                    onCountryChange={(c) => update('country', c)}
                    onStateChange={(s) => update('state', s)}
                    onCityChange={(c) => update('city', c)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Number of Units
                    </label>
                    <NumberInput
                      min={1}
                      value={form.totalUnits}
                      onValueChange={(v) => update('totalUnits', v)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Description
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      rows={2}
                      placeholder="Optional description"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <UploadField
                    label="Cover Image"
                    required
                    icon={ImageIcon}
                    file={form.coverImage}
                    accept="image/jpeg,image/png,image/webp"
                    onSelect={(file) => update('coverImage', file)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Gallery Images <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <label className="w-full flex cursor-pointer items-center justify-center gap-2 px-3 py-6 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <LegacyInput
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) =>
                          update(
                            'galleryImages',
                            [...form.galleryImages, ...Array.from(event.target.files ?? [])].slice(
                              0,
                              12
                            )
                          )
                        }
                      />
                      <Upload className="w-4 h-4" />
                      {form.galleryImages.length > 0
                        ? `${form.galleryImages.length} image(s) selected — add more`
                        : 'Add gallery images'}
                    </label>
                    {form.galleryImages.length > 0 && (
                      <FileList
                        files={form.galleryImages}
                        onRemove={(index) =>
                          update(
                            'galleryImages',
                            form.galleryImages.filter((_, itemIndex) => itemIndex !== index)
                          )
                        }
                      />
                    )}
                  </div>
                  <UploadField
                    label="Video Tour"
                    icon={Video}
                    file={form.videoTour}
                    accept="video/mp4,video/webm,video/quicktime"
                    onSelect={(file) => update('videoTour', file)}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Verification documents are optional at this stage, but properties without at
                      least one document will show as unverified to renters and buyers until
                      submitted.
                    </p>
                  </div>
                  <UploadField
                    label="Title Deed"
                    icon={FileText}
                    file={form.titleDeed}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onSelect={(file) => update('titleDeed', file)}
                  />
                  <UploadField
                    label="Certificate of Occupancy"
                    icon={FileText}
                    file={form.certificateOfOccupancy}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onSelect={(file) => update('certificateOfOccupancy', file)}
                  />
                  <UploadField
                    label="Management Authorization"
                    icon={FileText}
                    file={form.managementAuthorization}
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onSelect={(file) => update('managementAuthorization', file)}
                  />
                </>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                    <SummaryRow label="Name" value={form.name || '—'} />
                    <SummaryRow
                      label="Type"
                      value={propertyTypes.find((t) => t.value === form.type)?.label || '—'}
                    />
                    <SummaryRow
                      label="Address"
                      value={`${form.address}, ${form.city}, ${form.state}`}
                    />
                    <SummaryRow label="Units" value={form.totalUnits} />
                    <SummaryRow
                      label="Cover Image"
                      value={form.coverImage?.name || 'Not selected'}
                    />
                    <SummaryRow label="Gallery" value={`${form.galleryImages.length} image(s)`} />
                    <SummaryRow label="Video Tour" value={form.videoTour?.name || 'Not selected'} />
                    <SummaryRow
                      label="Verification Docs"
                      value={hasAnyVerificationDoc ? 'Submitted' : 'None uploaded'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This creates the property in your portfolio. Public listing remains locked until
                    identity and ownership verification are approved.
                  </p>
                  {submitError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
                    >
                      {submitError}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {step < steps.length - 1 && (
                <Button
                  variant="primary"
                  onClick={() => setStep((s) => s + 1)}
                  disabled={
                    (step === 0 && !canProceedFromStep1) || (step === 1 && !canProceedFromStep2)
                  }
                >
                  Continue
                </Button>
              )}
              {step === steps.length - 1 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handlePublish(false)}
                    disabled={isSubmitting}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="primary"
                    className="gap-2"
                    onClick={() => handlePublish(true)}
                    disabled={isSubmitting || !hasAnyVerificationDoc}
                    isLoading={isSubmitting}
                  >
                    <Check className="w-4 h-4" />
                    {isSubmitting ? 'Uploading…' : 'Submit for publishing'}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const UploadField = ({
  label,
  icon: Icon,
  file,
  onSelect,
  required,
  accept,
}: {
  label: string;
  icon: React.ElementType;
  file: File | null;
  onSelect: (file: File | null) => void;
  required?: boolean;
  accept: string;
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
        <LegacyInput
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm text-muted-foreground truncate">
          {file?.name || 'Click to select'}
        </span>
        {file && <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
      </label>
      {file && (file.type.startsWith('image/') || file.type.startsWith('video/')) && (
        <MediaPreview key={`${file.name}-${file.lastModified}`} file={file} />
      )}
    </div>
  );
};

const MediaPreview = ({ file }: { file: File }) => {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);
  return file.type.startsWith('video/') ? (
    <video
      className="mt-2 max-h-44 w-full rounded-lg bg-black object-contain"
      controls
      preload="metadata"
      src={url}
    >
      <track kind="captions" />
    </video>
  ) : (
    // Blob previews are local and cannot use Next Image optimization.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={`Preview of ${file.name}`}
      className="mt-2 h-36 w-full rounded-lg object-cover"
    />
  );
};

const FileList = ({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) => (
  <ul className="mt-2 space-y-1" aria-label="Selected gallery images">
    {files.map((file, index) => (
      <li
        key={`${file.name}-${file.lastModified}-${index}`}
        className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs"
      >
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate">{file.name}</span>
        <button
          type="button"
          aria-label={`Remove ${file.name}`}
          onClick={() => onRemove(index)}
          className="rounded p-1 text-muted-foreground hover:bg-card hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </li>
    ))}
  </ul>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-3 py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right truncate max-w-[60%]">{value}</span>
  </div>
);
