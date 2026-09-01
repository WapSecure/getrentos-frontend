'use client';

import { LegacyInput, NumberInput } from '@getrentos/ui';

import { Textarea } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';
import { MarketPriceInsights } from '@/components/owner/listings/MarketPriceInsights';
import type { OwnerProperty, SaleListing } from '@/types/owner';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService } from '@/services/ownerService';

interface CreateSaleListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (listing: Omit<SaleListing, 'id' | 'createdAt'>, publishNow: boolean) => void;
}

const steps = ['Listing Info', 'Media', 'Features', 'Publish'];
const PROPERTY_PAGE_SIZE = 10;

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
  onCreate,
}: CreateSaleListingModalProps) => {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [propertySearch, setPropertySearch] = useState('');
  const [propertyPage, setPropertyPage] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<OwnerProperty | null>(null);

  const { data: propertiesPage, isLoading: isPropertiesLoading } = useQuery({
    queryKey: [
      ...ownerKeys.properties,
      {
        verificationStatus: 'verified',
        search: propertySearch.trim() || undefined,
        page: propertyPage,
        pageSize: PROPERTY_PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        ownerService.listProperties({
          verificationStatus: 'verified',
          search: propertySearch.trim() || undefined,
          page: propertyPage,
          pageSize: PROPERTY_PAGE_SIZE,
        })
      ),
    enabled: isOpen,
  });
  const verifiedProperties = propertiesPage?.items ?? [];
  const propertyTotal = propertiesPage?.total ?? 0;
  const propertyForForm =
    selectedProperty?.id === form.propertyId
      ? selectedProperty
      : (verifiedProperties.find((property) => property.id === form.propertyId) ?? null);

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
    setPropertySearch('');
    setPropertyPage(1);
    setSelectedProperty(null);
    onClose();
  };

  const canProceedFromStep1 =
    form.propertyId && form.listingTitle.trim() && Number(form.askingPrice) > 0;
  const canProceedFromStep2 = form.coverImageName.trim().length > 0;

  const buildListing = (status: SaleListing['status']): Omit<SaleListing, 'id' | 'createdAt'> => ({
    propertyId: form.propertyId,
    propertyName: propertyForForm?.name || '',
    listingTitle: form.listingTitle,
    propertyType: propertyForForm?.propertyType || '',
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
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-semibold text-foreground">Create Sale Listing</h3>
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
                      Property <span className="text-red-500">*</span>
                    </label>
                    <PaginatedSelect
                      value={form.propertyId}
                      onValueChange={(value) => {
                        setSelectedProperty(
                          verifiedProperties.find((property) => property.id === value) ?? null
                        );
                        update('propertyId', value);
                      }}
                      items={verifiedProperties}
                      selectedItem={propertyForForm}
                      getItemValue={(property) => property.id}
                      getItemLabel={(property) => property.name}
                      search={propertySearch}
                      onSearchChange={(value) => {
                        setPropertySearch(value);
                        setPropertyPage(1);
                      }}
                      searchPlaceholder="Search verified properties"
                      page={propertyPage}
                      pageSize={PROPERTY_PAGE_SIZE}
                      total={propertyTotal}
                      onPageChange={setPropertyPage}
                      placeholder="Select a verified property"
                      emptyMessage="No verified properties match this search."
                      isLoading={isPropertiesLoading}
                      ariaLabel="verified property"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Listing Title <span className="text-red-500">*</span>
                    </label>
                    <LegacyInput
                      type="text"
                      value={form.listingTitle}
                      onChange={(e) => update('listingTitle', e.target.value)}
                      placeholder="e.g. Elegant 4-Bed Duplex in Lekki"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Asking Price (₦) <span className="text-red-500">*</span>
                    </label>
                    <CurrencyInput
                      prefix="₦"
                      min={0}
                      value={form.askingPrice}
                      onValueChange={(v) => update('askingPrice', v === 0 ? '' : String(v))}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {propertyForForm && (
                    <MarketPriceInsights
                      city={propertyForForm.city}
                      onUseSuggestedPrice={(price) => update('askingPrice', String(price))}
                    />
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Size (sqm)
                      </label>
                      <NumberInput
                        min={0}
                        value={form.propertySize}
                        onValueChange={(v) => update('propertySize', v)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Bedrooms
                      </label>
                      <NumberInput
                        min={0}
                        value={form.bedrooms}
                        onValueChange={(v) => update('bedrooms', v)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Bathrooms
                      </label>
                      <NumberInput
                        min={0}
                        value={form.bathrooms}
                        onValueChange={(v) => update('bathrooms', v)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Description
                    </label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      rows={3}
                      placeholder="Describe the property to prospective buyers"
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
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <Video className="w-4 h-4" />
                    Include video tour
                  </label>
                </>
              )}

              {step === 2 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-3">
                    Select property features & amenities
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {featureOptions.map((feature) => (
                      <label
                        key={feature}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                          form.features.includes(feature)
                            ? 'border-primary bg-accent text-primary'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        <LegacyInput
                          type="checkbox"
                          checked={form.features.includes(feature)}
                          onChange={() => toggleFeature(feature)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        {feature}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
                    <SummaryRow label="Property" value={propertyForForm?.name || '—'} />
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
                  <p className="text-xs text-muted-foreground">
                    Publishing makes this listing searchable to verified buyers. You can also save
                    it as a draft and publish later, or preview it first.
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
    <label className="block text-sm font-medium text-foreground mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <label className="flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer">
      <LegacyInput
        type="file"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0]?.name || '')}
      />
      <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-sm text-muted-foreground truncate">
        {fileName || 'Click to upload'}
      </span>
      {fileName && <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
    </label>
  </div>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-3 py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right truncate max-w-[60%]">{value}</span>
  </div>
);
