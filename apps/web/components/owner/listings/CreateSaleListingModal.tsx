'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MarketPriceInsights } from '@/components/owner/listings/MarketPriceInsights';
import type { OwnerProperty, SaleListing } from '@/types/owner';

interface CreateSaleListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  verifiedProperties: OwnerProperty[];
  onCreate: (listing: Omit<SaleListing, 'id' | 'createdAt'>, publishNow: boolean) => void;
}

const steps = ['Listing Info', 'Media', 'Features', 'Publish'];

const featureOptions = [
  'Swimming Pool',
  'Gym',
  'Parking',
  '24/7 Security',
  'Garden',
  'Balcony',
  'Air Conditioning',
  'Furnished',
  'Waterfront View',
  'CCTV',
  'Boys Quarters',
  'Solar Power',
];

interface FormState {
  propertyId: string;
  listingTitle: string;
  askingPrice: string;
  description: string;
  propertySize: string;
  bedrooms: string;
  bathrooms: string;
  coverImageName: string;
  galleryCount: number;
  hasVideoTour: boolean;
  features: string[];
}

const initialFormState: FormState = {
  propertyId: '',
  listingTitle: '',
  askingPrice: '',
  description: '',
  propertySize: '',
  bedrooms: '',
  bathrooms: '',
  coverImageName: '',
  galleryCount: 0,
  hasVideoTour: false,
  features: [],
};

export const CreateSaleListingModal = ({
  isOpen,
  onClose,
  verifiedProperties,
  onCreate,
}: CreateSaleListingModalProps) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialFormState);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (feature: string) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const handleClose = () => {
    setStep(0);
    setForm(initialFormState);
    onClose();
  };

  const selectedProperty = verifiedProperties.find((p) => p.id === form.propertyId);
  const canProceedFromStep1 =
    form.propertyId && form.listingTitle.trim() && Number(form.askingPrice) > 0;
  const canProceedFromStep2 = form.coverImageName.trim().length > 0;

  const buildListing = (status: SaleListing['status']): Omit<SaleListing, 'id' | 'createdAt'> => ({
    propertyId: form.propertyId,
    propertyName: selectedProperty?.name || '',
    listingTitle: form.listingTitle,
    propertyType: selectedProperty?.propertyType || '',
    askingPrice: Number(form.askingPrice) || 0,
    description: form.description,
    propertySize: form.propertySize ? Number(form.propertySize) : undefined,
    bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
    bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
    features: form.features,
    status,
  });

  const handleCreate = (status: SaleListing['status']) => {
    onCreate(buildListing(status), status === 'published');
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Create Sale Listing</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Step {step + 1} of {steps.length}: {steps[step]}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-4 pt-3 flex-shrink-0">
              <div className="flex gap-1.5">
                {steps.map((label, index) => (
                  <div
                    key={label}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= step ? 'bg-[#c4a747]' : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {step === 0 && (
                <>
                  {verifiedProperties.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
                      You need at least one verified property before you can create a sale listing.
                    </p>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Property <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={form.propertyId}
                          onChange={(e) => update('propertyId', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                        >
                          <option value="">Select a verified property</option>
                          {verifiedProperties.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Listing Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.listingTitle}
                          onChange={(e) => update('listingTitle', e.target.value)}
                          placeholder="e.g. Elegant 4-Bed Duplex in Lekki"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Asking Price (₦) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={form.askingPrice}
                          onChange={(e) => update('askingPrice', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                        />
                      </div>

                      {selectedProperty && (
                        <MarketPriceInsights
                          city={selectedProperty.city}
                          onUseSuggestedPrice={(price) => update('askingPrice', String(price))}
                        />
                      )}

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Size (sqm)
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.propertySize}
                            onChange={(e) => update('propertySize', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Bedrooms
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.bedrooms}
                            onChange={(e) => update('bedrooms', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Bathrooms
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.bathrooms}
                            onChange={(e) => update('bathrooms', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) => update('description', e.target.value)}
                          rows={3}
                          placeholder="Describe the property to prospective buyers"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747]"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {step === 1 && (
                <>
                  <UploadField
                    label="Cover Image"
                    required
                    fileName={form.coverImageName}
                    onSelect={(name) => update('coverImageName', name)}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gallery Images <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => update('galleryCount', form.galleryCount + 1)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-[#c4a747] hover:text-[#c4a747] transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {form.galleryCount > 0
                        ? `${form.galleryCount} image(s) added — add more`
                        : 'Add gallery images'}
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={form.hasVideoTour}
                      onChange={(e) => update('hasVideoTour', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#c4a747] focus:ring-[#c4a747]"
                    />
                    <Video className="w-4 h-4" />
                    Include video tour
                  </label>
                </>
              )}

              {step === 2 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Select property features & amenities
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {featureOptions.map((feature) => (
                      <label
                        key={feature}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          form.features.includes(feature)
                            ? 'border-[#c4a747] bg-[#c4a747]/10 text-[#c4a747]'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={form.features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#c4a747] focus:ring-[#c4a747]"
                        />
                        {feature}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-white/5 overflow-hidden">
                    <SummaryRow label="Property" value={selectedProperty?.name || '—'} />
                    <SummaryRow label="Title" value={form.listingTitle || '—'} />
                    <SummaryRow
                      label="Asking Price"
                      value={form.askingPrice ? `₦${form.askingPrice}` : '—'}
                    />
                    <SummaryRow label="Cover Image" value={form.coverImageName || 'Not uploaded'} />
                    <SummaryRow
                      label="Features"
                      value={form.features.length ? `${form.features.length} selected` : 'None'}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Publishing makes this listing searchable to verified buyers. You can also save
                    it as a draft and publish later, or preview it first.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-3 flex-shrink-0">
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
                    verifiedProperties.length === 0 ||
                    (step === 0 && !canProceedFromStep1) ||
                    (step === 1 && !canProceedFromStep2)
                  }
                >
                  Continue
                </Button>
              )}
              {step === steps.length - 1 && (
                <>
                  <Button variant="outline" onClick={() => handleCreate('draft')}>
                    Save Draft
                  </Button>
                  <Button
                    variant="primary"
                    className="gap-2"
                    onClick={() => handleCreate('published')}
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
  fileName,
  onSelect,
  required,
}: {
  label: string;
  fileName: string;
  onSelect: (name: string) => void;
  required?: boolean;
}) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-[#c4a747] transition-colors cursor-pointer">
      <input
        type="file"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0]?.name || '')}
      />
      <ImageIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      <span className="text-sm text-gray-500 dark:text-gray-400 truncate">
        {fileName || 'Click to upload'}
      </span>
      {fileName && <Check className="w-4 h-4 text-green-500 flex-shrink-0 ml-auto" />}
    </label>
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-3 py-2 text-sm">
    <span className="text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-gray-900 dark:text-white font-medium text-right truncate max-w-[60%]">
      {value}
    </span>
  </div>
);
