'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, AlertTriangle, FileText } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { LegacyInput } from '@getrentos/ui';
import { LegacySelect } from '@getrentos/ui';
import { Textarea } from '@getrentos/ui';
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
const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — matches the backend's per-file limit

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl mx-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="maintenance-report-title"
          >
            <div className="bg-card sticky top-0 z-10 flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 id="maintenance-report-title" className="font-semibold text-foreground">
                  Report Maintenance Issue
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Provide details about the issue you&apos;re experiencing
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                aria-label="Close maintenance report"
                className="rounded-lg p-1 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <section
                className={`rounded-xl border p-4 transition-colors ${
                  formData.isEmergency
                    ? 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                    : 'border-border bg-secondary/30'
                }`}
                aria-labelledby="emergency-maintenance-title"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        formData.isEmergency
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
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
                        Use this only for immediate property hazards, such as active flooding,
                        exposed wiring, or an insecure entry.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.isEmergency}
                    aria-label="Mark this as emergency maintenance"
                    onClick={handleEmergencyToggle}
                    disabled={isSubmitting}
                    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-60 ${
                      formData.isEmergency ? 'bg-red-600' : 'bg-muted-foreground/30'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        formData.isEmergency ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {formData.isEmergency && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-card/70 p-3 text-xs leading-5 text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
                    <p className="font-medium">Submitted as an urgent emergency request.</p>
                    <p className="mt-1">
                      For fire, medical emergencies, a gas smell, or any immediate threat to life,
                      move to safety and call local emergency services first.
                    </p>
                  </div>
                )}
              </section>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <LegacyInput
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Brief description of the issue"
                  className={errors.title ? 'border-red-500' : undefined}
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <LegacySelect
                    value={formData.category}
                    onChange={(event) =>
                      handleChange('category', event.target.value as MaintenanceCategory | '')
                    }
                    disabled={isSubmitting}
                    aria-label="Maintenance category"
                    className={errors.category ? 'border-red-500' : undefined}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </LegacySelect>
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-500">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <LegacySelect
                    value={formData.isEmergency ? 'urgent' : formData.priority}
                    onChange={(event) =>
                      handleChange('priority', event.target.value as MaintenancePriority | '')
                    }
                    disabled={isSubmitting || formData.isEmergency}
                    aria-label="Maintenance priority"
                    className={errors.priority ? 'border-red-500' : undefined}
                  >
                    <option value="">Select priority</option>
                    {priorities.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label} - {priority.description}
                      </option>
                    ))}
                  </LegacySelect>
                  {formData.isEmergency ? (
                    <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-300">
                      Emergency requests are submitted as urgent.
                    </p>
                  ) : (
                    errors.priority && (
                      <p className="mt-1 text-xs text-red-500">{errors.priority}</p>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Include what happened, where it is, and whether it is getting worse."
                  rows={4}
                  className={errors.description ? 'border-red-500' : undefined}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">
                  Photos (Optional)
                </label>
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
                    PNG, JPG up to 10MB — up to {MAX_PHOTOS} photos
                  </p>
                </button>
                {photoError && <p className="mt-1 text-xs text-red-500">{photoError}</p>}
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
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          disabled={isSubmitting}
                          aria-label={`Remove ${photo.name}`}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:cursor-not-allowed"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {submitError && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                  role="alert"
                >
                  {submitError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant={formData.isEmergency ? 'danger' : 'primary'}
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  <FileText className="w-4 h-4" />
                  {formData.isEmergency ? 'Submit Emergency Request' : 'Submit Request'}
                </Button>
                <Button variant="ghost" fullWidth onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
