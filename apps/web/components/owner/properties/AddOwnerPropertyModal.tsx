'use client';

import { LegacyInput } from '@getrentos/ui';

import { LegacySelect } from '@getrentos/ui';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, FileText, ShieldAlert, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { DatePicker } from '@getrentos/ui';
import { CountryStateFields } from '@/components/shared/location/CountryStateFields';
import type { OwnerProperty } from '@/types/owner';

interface AddOwnerPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    property: Omit<
      OwnerProperty,
      'id' | 'hasActiveSaleListing' | 'createdAt' | 'verificationStatus'
    >
  ) => void;
}

const steps = ['Ownership Info', 'Documents', 'Declaration', 'Status'];

const propertyTypes = ['Apartment', 'Duplex', 'Bungalow', 'Terrace', 'Land', 'Commercial'];

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
  titleDeedName: string;
  certificateOfOccupancyName: string;
  deedOfAssignmentName: string;
  govtRegistryExtractName: string;
  declared: boolean;
}

const initialFormState: FormState = {
  name: '',
  propertyType: 'Apartment',
  address: '',
  city: '',
  state: '',
  country: 'Nigeria',
  ownerName: '',
  estimatedValue: '',
  purchasePrice: '',
  purchaseDate: '',
  titleDeedName: '',
  certificateOfOccupancyName: '',
  deedOfAssignmentName: '',
  govtRegistryExtractName: '',
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

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleClose = () => {
    setStep(0);
    setForm(initialFormState);
    setSubmitted(false);
    onClose();
  };

  const canProceedFromStep1 =
    form.name.trim() &&
    form.address.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.ownerName.trim();

  const hasAnyDocument =
    form.titleDeedName ||
    form.certificateOfOccupancyName ||
    form.deedOfAssignmentName ||
    form.govtRegistryExtractName;

  const handleSubmitForVerification = () => {
    onSubmit({
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
    });
    setSubmitted(true);
    setStep(3);
  };

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
                      placeholder="e.g. Lekki Waterfront Duplex"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Property Type
                    </label>
                    <LegacySelect
                      value={form.propertyType}
                      onChange={(e) => update('propertyType', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {propertyTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </LegacySelect>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Registered Owner Name <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="text"
                      value={form.ownerName}
                      onChange={(e) => update('ownerName', e.target.value)}
                      placeholder="Full legal name as on title document"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
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

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="text"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <CountryStateFields
                    country={form.country}
                    state={form.state}
                    onCountryChange={(c) => update('country', c)}
                    onStateChange={(s) => update('state', s)}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Purchase Price (₦)
                      </label>
                      <LegacyInput
                        type="number"
                        min={0}
                        value={form.purchasePrice}
                        onChange={(e) => update('purchasePrice', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Estimated Value (₦)
                      </label>
                      <LegacyInput
                        type="number"
                        min={0}
                        value={form.estimatedValue}
                        onChange={(e) => update('estimatedValue', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Purchase Date
                    </label>
                    <DatePicker
                      value={form.purchaseDate}
                      onChange={(v) => update('purchaseDate', v)}
                      max={new Date().toISOString().slice(0, 10)}
                    />
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Upload at least one proof of ownership. Our compliance team verifies documents
                      before your property can be listed for sale.
                    </p>
                  </div>
                  <UploadField
                    label="Title Deed"
                    fileName={form.titleDeedName}
                    onSelect={(name) => update('titleDeedName', name)}
                  />
                  <UploadField
                    label="Certificate of Occupancy (C of O)"
                    fileName={form.certificateOfOccupancyName}
                    onSelect={(name) => update('certificateOfOccupancyName', name)}
                  />
                  <UploadField
                    label="Deed of Assignment"
                    fileName={form.deedOfAssignmentName}
                    onSelect={(name) => update('deedOfAssignmentName', name)}
                  />
                  <UploadField
                    label="Government Registry Extract"
                    fileName={form.govtRegistryExtractName}
                    onSelect={(name) => update('govtRegistryExtractName', name)}
                  />
                  {!hasAnyDocument && (
                    <p className="text-xs text-red-500">
                      At least one document is required to proceed.
                    </p>
                  )}
                </>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
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
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer">
                    <LegacyInput
                      type="checkbox"
                      checked={form.declared}
                      onChange={(e) => update('declared', e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">
                      I declare that I am the legal and rightful owner of this property, that the
                      documents provided are authentic, and that all information submitted is
                      accurate to the best of my knowledge.
                    </span>
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground">Pending Review</h4>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    Your ownership documents for <strong>{form.name}</strong> have been submitted.
                    Our compliance team typically completes review within 24–48 hours.
                  </p>
                  <div className="mt-5 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <FileText className="w-3.5 h-3.5" />
                    You&apos;ll be notified as soon as a decision is made
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border flex gap-3 shrink-0">
              {step > 0 && !submitted && (
                <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              <div className="flex-1" />
              {step === 0 && (
                <Button
                  variant="primary"
                  onClick={() => setStep(1)}
                  disabled={!canProceedFromStep1}
                >
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
                  className="gap-2"
                  onClick={handleSubmitForVerification}
                  disabled={!form.declared}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Submit for Verification
                </Button>
              )}
              {step === 3 && (
                <Button variant="primary" className="gap-2" onClick={handleClose}>
                  <Check className="w-4 h-4" />
                  Done
                </Button>
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
  fileName,
  onSelect,
}: {
  label: string;
  fileName: string;
  onSelect: (name: string) => void;
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
      <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
        <LegacyInput
          type="file"
          className="hidden"
          onChange={(e) => onSelect(e.target.files?.[0]?.name || '')}
        />
        <FileText className="w-4 h-4 text-gray-400 shrink-0" />
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
