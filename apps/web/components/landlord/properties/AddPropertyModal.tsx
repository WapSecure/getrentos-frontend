'use client';

import {
  Alert,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  IconButton,
  Input,
  NumberInput,
  Select,
  Textarea,
  clearSessionDraft,
  useSessionExpiryDraft,
} from '@getrentos/ui';

import { useEffect, useState } from 'react';
import {
  Check,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
  ShieldCheck,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { AddressFields } from '@/components/shared/location/AddressFields';
import type { VerifiedAddress } from '@getrentos/shared';
import type { Property, PropertyType } from '@/types/landlord';
import type { LandOwnershipProofInput } from '@/types/land';
import { usePhotoAdvice } from '@/hooks/usePhotoAdvice';
import { LocationPicker } from '@/components/maps/LocationPicker';
import type { MapPoint } from '@/services/geocodeService';
import { videoFileProblem } from '@/lib/videoFile';
import { pluralize } from '@/lib/format';

export interface LandlordPropertySubmission {
  property: Pick<
    Property,
    | 'name'
    | 'type'
    | 'address'
    | 'city'
    | 'state'
    | 'country'
    | 'description'
    | 'totalUnits'
    | 'latitude'
    | 'longitude'
    | 'placeId'
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
  { value: 'shared_apartment', label: 'Shared apartment' },
];

const steps = ['Property info', 'Media', 'Verification', 'Review'];

/** sessionStorage key for a property being added when the session ran out. */
export const ADD_PROPERTY_DRAFT_KEY = 'landlord-add-property';

/** What survives a session ending: the typed details. Files cannot be kept. */
type PropertyDraft = Pick<
  FormState,
  | 'name'
  | 'type'
  | 'address'
  | 'city'
  | 'state'
  | 'country'
  | 'placeId'
  | 'checked'
  | 'description'
  | 'totalUnits'
  | 'pin'
>;

interface FormState {
  name: string;
  type: PropertyType;
  address: string;
  city: string;
  state: string;
  country: string;
  /** Set when the address was picked from Google. */
  placeId?: string;
  checked?: VerifiedAddress;
  description: string;
  totalUnits: string;
  coverImage: File | null;
  galleryImages: File[];
  videoTour: File | null;
  titleDeed: File | null;
  certificateOfOccupancy: File | null;
  managementAuthorization: File | null;
  pin: MapPoint | null;
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
  pin: null,
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

  // If the session ends while the landlord is filling this in, keep the typed
  // details so they are waiting after sign-in (photos and documents are added again).
  const draftRestored = useSessionExpiryDraft<PropertyDraft>(
    ADD_PROPERTY_DRAFT_KEY,
    () =>
      form.name || form.address || form.city || form.description
        ? {
            name: form.name,
            type: form.type,
            address: form.address,
            city: form.city,
            state: form.state,
            country: form.country,
            placeId: form.placeId,
            checked: form.checked,
            description: form.description,
            totalUnits: form.totalUnits,
            pin: form.pin,
          }
        : null,
    (draft) => {
      setForm({ ...initialFormState, ...draft });
      setStep(0);
    },
    isOpen
  );

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Closing (the X, Escape, a click outside) keeps what was typed, so reopening
  // resumes where they left off; only a saved property clears the form.
  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError(null);
    onClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setForm(initialFormState);
    handleClose();
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
          placeId: form.placeId,
          description: form.description || undefined,
          totalUnits: Number(form.totalUnits) || 1,
          ...(form.pin ? { latitude: form.pin.latitude, longitude: form.pin.longitude } : {}),
        },
        coverImage: form.coverImage,
        galleryImages: form.galleryImages,
        videoTour: form.videoTour,
        ownershipProofs,
        publishRequested,
      });
      clearSessionDraft(ADD_PROPERTY_DRAFT_KEY);
      resetAndClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to create the property.');
    }
  };

  const hasAnyVerificationDoc =
    form.titleDeed || form.certificateOfOccupancy || form.managementAuthorization;

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && !isSubmitting && handleClose()}>
      <DialogContent padded={false} className="flex flex-col sm:max-w-lg">
        <div className="p-4 pr-12 border-b border-border flex justify-between items-center gap-3 shrink-0">
          <div className="min-w-0">
            <DialogTitle className="font-semibold text-foreground">Add property</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Step {step + 1} of {steps.length}: {steps[step]}
            </DialogDescription>
          </div>
        </div>

        <div className="px-4 pt-3 shrink-0">
          <div className="flex gap-1.5">
            {steps.map((label, index) => (
              <div
                key={label}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {draftRestored && step === 0 && (
            <p role="status" className="text-xs text-muted-foreground">
              We kept the details you were typing when your session ended. Check them, then add the
              photos and documents again.
            </p>
          )}
          {step === 0 && (
            <>
              <Field label="Property name" required>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. Sunrise Apartments"
                />
              </Field>

              <Field label="Property type">
                <Select
                  value={form.type}
                  onValueChange={(value) => update('type', value as PropertyType)}
                  options={propertyTypes.map((t) => ({ value: t.value, label: t.label }))}
                />
              </Field>

              <AddressFields
                required
                value={form}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                onPin={(pin) => update('pin', pin)}
              />

              <LocationPicker
                address={form.address}
                city={form.city}
                state={form.state}
                country={form.country}
                value={form.pin}
                onChange={(pin) => update('pin', pin)}
              />

              <Field label="Number of units">
                <NumberInput
                  min={1}
                  value={form.totalUnits}
                  onValueChange={(v) => update('totalUnits', v)}
                />
              </Field>

              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={2}
                  placeholder="Optional description"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <UploadField
                label="Cover image"
                required
                icon={ImageIcon}
                file={form.coverImage}
                accept="image/jpeg,image/png,image/webp"
                onSelect={(file) => update('coverImage', file)}
              />
              <div>
                <p className="block text-sm font-medium text-foreground mb-1">
                  Gallery images{' '}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </p>
                <label className="w-full flex cursor-pointer items-center justify-center gap-2 px-3 py-6 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary focus-within:ring-2 focus-within:ring-ring transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
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
                    ? `${pluralize(form.galleryImages.length, 'image')} selected: add more`
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
                label="Video tour"
                icon={Video}
                file={form.videoTour}
                accept="video/mp4,video/webm,video/quicktime"
                onSelect={async (file) => {
                  const problem = file ? await videoFileProblem(file) : null;
                  setSubmitError(problem);
                  update('videoTour', problem ? null : file);
                }}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Alert variant="info" icon={ShieldCheck}>
                Optional for a draft. To submit the property for publishing, add at least one
                document; without one it shows as unverified to renters and buyers.
              </Alert>
              <UploadField
                checkPhotoQuality
                label="Title deed"
                icon={FileText}
                file={form.titleDeed}
                accept=".pdf,image/jpeg,image/png,image/webp"
                onSelect={(file) => update('titleDeed', file)}
              />
              <UploadField
                checkPhotoQuality
                label="Certificate of Occupancy"
                icon={FileText}
                file={form.certificateOfOccupancy}
                accept=".pdf,image/jpeg,image/png,image/webp"
                onSelect={(file) => update('certificateOfOccupancy', file)}
              />
              <UploadField
                checkPhotoQuality
                label="Management authorisation"
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
                  value={
                    form.checked
                      ? form.checked.formatted
                      : `${form.address}, ${form.city}, ${form.state}`
                  }
                />
                <SummaryRow label="Units" value={form.totalUnits} />
                <SummaryRow label="Cover image" value={form.coverImage?.name || 'Not selected'} />
                <SummaryRow
                  label="Gallery"
                  value={
                    form.galleryImages.length
                      ? pluralize(form.galleryImages.length, 'image')
                      : 'None'
                  }
                />
                <SummaryRow label="Video tour" value={form.videoTour?.name || 'None'} />
                <SummaryRow
                  label="Verification docs"
                  value={hasAnyVerificationDoc ? 'Submitted' : 'None uploaded'}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This creates the property in your portfolio. Public listing remains locked until
                identity and ownership verification are approved.
              </p>
              {submitError && <Alert variant="danger">{submitError}</Alert>}
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
              {!hasAnyVerificationDoc && (
                <p className="w-full text-xs text-muted-foreground" role="status">
                  To submit for publishing, add a title deed, C of O or management authorisation in
                  step 3. You can save a draft now and add it later.
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => handlePublish(false)}
                disabled={isSubmitting}
              >
                Save draft
              </Button>
              <Button
                variant="primary"
                className="gap-2"
                onClick={() => handlePublish(true)}
                disabled={!hasAnyVerificationDoc}
                isLoading={isSubmitting}
                loadingText="Uploading…"
              >
                <Check className="w-4 h-4" />
                Submit for publishing
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UploadField = ({
  checkPhotoQuality: checkQuality = false,
  label,
  icon: Icon,
  file,
  onSelect,
  required,
  accept,
}: {
  /** A photo of a document: advise a retake if it is blurry, dark, glared or too small. */
  checkPhotoQuality?: boolean;
  label: string;
  icon: React.ElementType;
  file: File | null;
  onSelect: (file: File | null) => void;
  required?: boolean;
  accept: string;
}) => {
  const advice = usePhotoAdvice(checkQuality ? file : null);
  return (
    <div>
      <p className="block text-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-destructive">*</span>}
      </p>
      <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary focus-within:ring-2 focus-within:ring-ring transition-colors cursor-pointer">
        <input
          type="file"
          aria-label={label}
          className="sr-only"
          accept={accept}
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
        <Icon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
        <span className="text-sm text-muted-foreground truncate">
          {file?.name || 'Click to select'}
        </span>
        {file && <Check className="w-4 h-4 text-success shrink-0 ml-auto" />}
      </label>
      {advice.map((text) => (
        <p key={text} className="mt-1 flex items-start gap-1.5 text-xs text-warning">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {text}
        </p>
      ))}
      {file && (file.type.startsWith('image/') || file.type.startsWith('video/')) && (
        <MediaPreview key={`${file.name}-${file.lastModified}`} file={file} />
      )}
    </div>
  );
};

const MediaPreview = ({ file }: { file: File }) => {
  // Created inside the effect, not a useState initialiser: under React
  // StrictMode the effect runs, is cleaned up (revoking the URL), then runs
  // again: an initialiser-created URL stays revoked and the preview renders
  // as a broken image in dev.
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // The recommended useMemo form is wrong here: StrictMode's
    // effect -> cleanup -> effect cycle revokes the memoised URL and never
    // recreates it, so the preview renders as a broken image. Creating the URL
    // in the effect and storing the result means the second pass mints a live
    // one, which is why this state write is deliberate.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return null;

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
        <IconButton
          label={`Remove ${file.name}`}
          variant="danger"
          size="sm"
          icon={<Trash2 />}
          onClick={() => onRemove(index)}
        />
      </li>
    ))}
  </ul>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right truncate max-w-[60%]">{value}</span>
  </div>
);
