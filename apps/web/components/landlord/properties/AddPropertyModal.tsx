'use client';

import { LegacyInput, NumberInput } from '@getrentos/ui';

import { Textarea } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Upload, FileText, Image as ImageIcon, Video, ShieldCheck } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { LocationFields } from '@/components/shared/location/LocationFields';
import type { Property, PropertyType } from '@/types/landlord';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (
    property: Omit<Property, 'id' | 'occupiedUnits' | 'monthlyRevenue' | 'createdAt'>
  ) => void;
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
  coverImageName: string;
  galleryCount: number;
  hasVideoTour: boolean;
  titleDeedName: string;
  certificateOfOccupancyName: string;
  managementAuthorizationName: string;
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
  coverImageName: '',
  galleryCount: 0,
  hasVideoTour: false,
  titleDeedName: '',
  certificateOfOccupancyName: '',
  managementAuthorizationName: '',
};

export const AddPropertyModal = ({ isOpen, onClose, onPublish }: AddPropertyModalProps) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialFormState);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setStep(0);
    setForm(initialFormState);
    onClose();
  };

  const canProceedFromStep1 =
    form.name.trim() && form.address.trim() && form.city.trim() && form.state.trim();
  const canProceedFromStep2 = form.coverImageName.trim().length > 0;

  const handlePublish = (verificationStatus: Property['verificationStatus']) => {
    onPublish({
      name: form.name,
      type: form.type,
      address: form.address,
      city: form.city,
      state: form.state,
      country: form.country,
      description: form.description || undefined,
      coverImage: form.coverImageName ? `/uploads/${form.coverImageName}` : '',
      verificationStatus,
      totalUnits: Number(form.totalUnits) || 1,
    });
    handleClose();
  };

  const hasAnyVerificationDoc =
    form.titleDeedName || form.certificateOfOccupancyName || form.managementAuthorizationName;

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
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
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
                    fileName={form.coverImageName}
                    onSelect={(name) => update('coverImageName', name)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Gallery Images <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => update('galleryCount', form.galleryCount + 1)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-6 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {form.galleryCount > 0
                        ? `${form.galleryCount} image(s) added — add more`
                        : 'Add gallery images'}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <LegacyInput
                      type="checkbox"
                      checked={form.hasVideoTour}
                      onChange={(e) => update('hasVideoTour', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                    />
                    <Video className="w-4 h-4" />
                    Include video tour
                  </label>
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
                    fileName={form.titleDeedName}
                    onSelect={(name) => update('titleDeedName', name)}
                  />
                  <UploadField
                    label="Certificate of Occupancy"
                    icon={FileText}
                    fileName={form.certificateOfOccupancyName}
                    onSelect={(name) => update('certificateOfOccupancyName', name)}
                  />
                  <UploadField
                    label="Management Authorization"
                    icon={FileText}
                    fileName={form.managementAuthorizationName}
                    onSelect={(name) => update('managementAuthorizationName', name)}
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
                    <SummaryRow label="Cover Image" value={form.coverImageName || 'Not uploaded'} />
                    <SummaryRow
                      label="Verification Docs"
                      value={hasAnyVerificationDoc ? 'Submitted' : 'None uploaded'}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Publishing makes this property searchable. You can also save it as a draft and
                    publish later.
                  </p>
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
                  <Button variant="outline" onClick={() => handlePublish('unverified')}>
                    Save Draft
                  </Button>
                  <Button
                    variant="primary"
                    className="gap-2"
                    onClick={() => handlePublish(hasAnyVerificationDoc ? 'pending' : 'unverified')}
                  >
                    <Check className="w-4 h-4" />
                    Publish
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
  fileName,
  onSelect,
  required,
}: {
  label: string;
  icon: React.ElementType;
  fileName: string;
  onSelect: (name: string) => void;
  required?: boolean;
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
          onChange={(e) => onSelect(e.target.files?.[0]?.name || '')}
        />
        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="text-sm text-muted-foreground truncate">
          {fileName || 'Click to upload'}
        </span>
        {fileName && <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
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
