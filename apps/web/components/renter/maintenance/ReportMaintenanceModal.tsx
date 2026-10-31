'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Camera, AlertTriangle, FileText } from 'lucide-react';
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  IconButton,
  Input,
  Select,
  Switch,
  Textarea,
  clearSessionDraft,
  useSessionExpiryDraft,
} from '@getrentos/ui';
import type {
  CreateMaintenanceRequestInput,
  MaintenanceCategory,
  MaintenancePriority,
} from '@/types/maintenance';

type ReportFormData = Omit<CreateMaintenanceRequestInput, 'category' | 'priority'> & {
  category: MaintenanceCategory | '';
  priority: MaintenancePriority | '';
  isEmergency: boolean;
};

type ReportField = 'title' | 'category' | 'priority' | 'description';

const MAX_PHOTOS = 5;
const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB: matches the backend's per-file limit

interface ReportMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMaintenanceRequestInput, photos: File[]) => Promise<boolean>;
}

const categories: { value: MaintenanceCategory; label: string; icon: string }[] = [
  { value: 'plumbing', label: 'Plumbing', icon: '💧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'internet', label: 'Internet', icon: '🌐' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'appliances', label: 'Appliances', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const priorities: { value: MaintenancePriority; label: string; description: string }[] = [
  { value: 'low', label: 'Low', description: 'Non-urgent, cosmetic issues' },
  { value: 'medium', label: 'Medium', description: 'Affects daily comfort but not critical' },
  { value: 'high', label: 'High', description: 'Significant inconvenience' },
  { value: 'urgent', label: 'Urgent', description: 'Needs prompt attention' },
];

/** sessionStorage key for a report being written when the session ran out. */
export const REPORT_MAINTENANCE_DRAFT_KEY = 'renter-report-maintenance';

const createEmptyForm = (): ReportFormData => ({
  title: '',
  category: '',
  priority: '',
  description: '',
  isEmergency: false,
});

export const ReportMaintenanceModal = ({
  isOpen,
  onClose,
  onSubmit,
}: ReportMaintenanceModalProps) => {
  const [formData, setFormData] = useState<ReportFormData>(createEmptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<ReportField, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // If the session ends while the renter is writing, keep the report (photos
  // cannot be kept, only the text) so it is waiting after they sign back in.
  const draftRestored = useSessionExpiryDraft<ReportFormData>(
    REPORT_MAINTENANCE_DRAFT_KEY,
    () =>
      formData.title || formData.description || formData.category || formData.priority
        ? formData
        : null,
    (draft) => setFormData({ ...createEmptyForm(), ...draft }),
    isOpen
  );

  // Object URLs are created once per photo set and revoked whenever it
  // changes (or the modal unmounts) so previews don't leak memory.
  const photoPreviewUrls = useMemo(
    () => photos.map((photo) => URL.createObjectURL(photo)),
    [photos]
  );
  useEffect(() => {
    return () => photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [photoPreviewUrls]);

  const handleChange = <Field extends ReportField>(field: Field, value: ReportFormData[Field]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleEmergencyToggle = () => {
    setFormData((prev) => ({
      ...prev,
      isEmergency: !prev.isEmergency,
      priority: !prev.isEmergency ? 'urgent' : prev.priority,
    }));
    setSubmitError(null);
    setErrors((prev) => ({ ...prev, priority: '' }));
  };

  const validate = () => {
    const newErrors: Partial<Record<ReportField, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(createEmptyForm());
    setErrors({});
    setSubmitError(null);
    setPhotos([]);
    setPhotoError(null);
  };

  const handlePhotosSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setPhotoError(null);

    const incoming = Array.from(fileList);
    const oversized = incoming.find((file) => file.size > MAX_PHOTO_SIZE_BYTES);
    if (oversized) {
      setPhotoError(`${oversized.name} is over 10MB. Choose a smaller photo.`);
      return;
    }

    setPhotos((prev) => {
      const combined = [...prev, ...incoming];
      if (combined.length > MAX_PHOTOS) {
        setPhotoError(`You can attach up to ${MAX_PHOTOS} photos.`);
        return combined.slice(0, MAX_PHOTOS);
      }
      return combined;
    });
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoError(null);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting || !validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const wasSubmitted = await onSubmit(
        {
          title: formData.title.trim(),
          category: formData.category as MaintenanceCategory,
          priority: formData.isEmergency ? 'urgent' : (formData.priority as MaintenancePriority),
          description: formData.description.trim(),
          ...(formData.isEmergency ? { isEmergency: true } : {}),
        },
        photos
      );

      if (wasSubmitted) {
        clearSessionDraft(REPORT_MAINTENANCE_DRAFT_KEY);
        resetForm();
        onClose();
      } else {
        setSubmitError(
          'We could not submit this request. Please review the details and try again.'
        );
      }
    } catch {
      setSubmitError(
        'We could not submit this request. Please check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="lg">
        <DialogTitle className="pr-8 font-semibold text-foreground">
          Report Maintenance Issue
        </DialogTitle>
        <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
          Provide details about the issue you&apos;re experiencing
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <section
            className={`rounded-xl border p-4 transition-colors ${
              formData.isEmergency
                ? 'border-destructive/30 bg-destructive-subtle'
                : 'border-border bg-secondary/30'
            }`}
            aria-labelledby="emergency-maintenance-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    formData.isEmergency
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" />
                </span>
                <div>
                  <h4
                    id="emergency-maintenance-title"
                    className="text-sm font-semibold text-foreground"
                  >
                    Emergency maintenance
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Use this only for immediate property hazards, such as active flooding, exposed
                    wiring, or an insecure entry.
                  </p>
                </div>
              </div>
              <Switch
                aria-label="Mark this as emergency maintenance"
                checked={formData.isEmergency}
                onCheckedChange={handleEmergencyToggle}
                disabled={isSubmitting}
                className="mt-0.5"
              />
            </div>

            {formData.isEmergency && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-card/70 p-3 text-xs leading-5 text-destructive">
                <p className="font-medium">Submitted as an urgent emergency request.</p>
                <p className="mt-1">
                  For fire, medical emergencies, a gas smell, or any immediate threat to life, move
                  to safety and call local emergency services first.
                </p>
              </div>
            )}
          </section>

          <Field label="Issue Title" required error={errors.title}>
            <Input
              type="text"
              value={formData.title}
              onChange={(event) => handleChange('title', event.target.value)}
              disabled={isSubmitting}
              placeholder="Brief description of the issue"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category" required error={errors.category}>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  handleChange('category', value as MaintenanceCategory | '')
                }
                disabled={isSubmitting}
                placeholder="Select category"
                options={categories.map((category) => ({
                  value: category.value,
                  label: `${category.icon} ${category.label}`,
                }))}
              />
            </Field>

            <Field
              label="Priority"
              required
              hint={
                formData.isEmergency ? 'Emergency requests are submitted as urgent.' : undefined
              }
              error={formData.isEmergency ? undefined : errors.priority}
            >
              <Select
                value={formData.isEmergency ? 'urgent' : formData.priority}
                onValueChange={(value) =>
                  handleChange('priority', value as MaintenancePriority | '')
                }
                disabled={isSubmitting || formData.isEmergency}
                placeholder="Select priority"
                options={priorities.map((priority) => ({
                  value: priority.value,
                  label: `${priority.label} - ${priority.description}`,
                }))}
              />
            </Field>
          </div>

          <Field label="Description" required error={errors.description}>
            <Textarea
              value={formData.description}
              onChange={(event) => handleChange('description', event.target.value)}
              disabled={isSubmitting}
              placeholder="Include what happened, where it is, and whether it is getting worse."
              rows={4}
            />
          </Field>

          <div>
            <p className="mb-1 block text-sm font-medium text-foreground">Photos (Optional)</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={isSubmitting || photos.length >= MAX_PHOTOS}
              onChange={(event) => {
                handlePhotosSelected(event.target.files);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || photos.length >= MAX_PHOTOS}
              className="w-full cursor-pointer rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload photos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                PNG, JPG up to 10MB: up to {MAX_PHOTOS} photos
              </p>
            </button>
            {photoError && <p className="mt-1 text-xs text-destructive">{photoError}</p>}
            {photos.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((photo, index) => (
                  <li
                    key={`${photo.name}-${photo.lastModified}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, not a remote/optimizable image */}
                    <img
                      src={photoPreviewUrls[index]}
                      alt={photo.name}
                      className="h-full w-full object-cover"
                    />
                    <IconButton
                      label={`Remove ${photo.name}`}
                      icon={<X />}
                      size="sm"
                      onClick={() => removePhoto(index)}
                      disabled={isSubmitting}
                      className="absolute right-1 top-1 h-7 w-7 rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/70 hover:text-white group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {draftRestored && !submitError && (
            <p role="status" className="text-xs text-muted-foreground">
              We kept the report you were writing when your session ended. Add any photos again,
              check it and submit.
            </p>
          )}
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <div className="flex gap-3 pt-2">
            <Button
              variant={formData.isEmergency ? 'danger' : 'primary'}
              fullWidth
              onClick={handleSubmit}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              icon={<FileText className="w-4 h-4" />}
            >
              {formData.isEmergency ? 'Submit Emergency Request' : 'Submit Request'}
            </Button>
            <Button variant="ghost" fullWidth onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
