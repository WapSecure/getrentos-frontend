'use client';

import { LegacyInput, NumberInput } from '@getrentos/ui';

import { Textarea } from '@getrentos/ui';

import { useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, Upload, Image as ImageIcon, Video } from 'lucide-react';
import { Button, CurrencyInput } from '@getrentos/ui';
import { MarketPriceInsights } from '@/components/owner/listings/MarketPriceInsights';
import type { OwnerProperty, SaleListing } from '@/types/owner';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { ownerService } from '@/services/ownerService';
import { videoFileProblem } from '@/lib/videoFile';

interface CreateSaleListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Creates the listing; rejects (with the server's reason) if it is refused. */
  onCreate: (
    listing: Omit<SaleListing, 'id' | 'createdAt'>,
    publishNow: boolean
  ) => Promise<unknown>;
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
  features: string[];
}

/** A file staged on the server, waiting to be attached to the property. */
interface StagedFile {
  key: string;
  name: string;
}

interface StagedMedia {
  cover: StagedFile | null;
  gallery: StagedFile[];
  video: StagedFile | null;
}

const NO_MEDIA: StagedMedia = { cover: null, gallery: [], video: null };

/** The server's ceiling for a property photo (videos: see videoFileProblem). */
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

const initialFormState: FormState = {
  propertyId: '',
  listingTitle: '',
  askingPrice: '',
  description: '',
  propertySize: '',
  bedrooms: '',
  bathrooms: '',
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
  const [media, setMedia] = useState<StagedMedia>(NO_MEDIA);
  const [uploading, setUploading] = useState<'cover' | 'gallery' | 'video' | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

  const existingCover = propertyForForm?.coverImageKey;
  // The API lists the cover first among the gallery keys; the gallery proper is the rest.
  const existingGallery = (propertyForForm?.galleryImageKeys ?? []).filter(
    (key) => key !== existingCover
  );

  const tooBig = (file: File) =>
    file.size > MAX_IMAGE_BYTES ? `${file.name} is over 15 MB.` : null;

  const stage = async (slot: 'cover' | 'video', file: File | undefined) => {
    if (!file) return;
    const kind = slot === 'video' ? 'video' : 'image';
    const problem = kind === 'video' ? await videoFileProblem(file) : tooBig(file);
    setMediaError(problem);
    if (problem) return;
    setUploading(slot);
    try {
      const { key } = await unwrap(ownerService.uploadPropertyMedia(file, kind));
      setMedia((prev) => ({ ...prev, [slot]: { key, name: file.name } }));
    } catch (reason) {
      setMediaError(reason instanceof Error ? reason.message : `Unable to upload ${file.name}.`);
    } finally {
      setUploading(null);
    }
  };

  const stageGallery = async (files: File[]) => {
    const problem = files.map((file) => tooBig(file)).find(Boolean) ?? null;
    setMediaError(problem);
    if (problem || !files.length) return;
    setUploading('gallery');
    try {
      for (const file of files) {
        const { key } = await unwrap(ownerService.uploadPropertyMedia(file, 'image'));
        setMedia((prev) => ({ ...prev, gallery: [...prev.gallery, { key, name: file.name }] }));
      }
    } catch (reason) {
      setMediaError(reason instanceof Error ? reason.message : 'Unable to upload those images.');
    } finally {
      setUploading(null);
    }
  };

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
    setMedia(NO_MEDIA);
    setMediaError(null);
    setCreateError(null);
    onClose();
  };

  const canProceedFromStep1 =
    form.propertyId && form.listingTitle.trim() && Number(form.askingPrice) > 0;
  const canProceedFromStep2 = (!!media.cover || !!existingCover) && uploading === null;

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

  const handleCreate = async (status: SaleListing['status']) => {
    const { cover, gallery, video } = media;
    setCreating(true);
    setCreateError(null);
    // The listing first: if it is refused (an unverified account, say), the
    // property's photos and video must be left as they were.
    try {
      await onCreate(buildListing(status), status === 'published');
    } catch (reason) {
      setCreateError(reason instanceof Error ? reason.message : 'Unable to create the listing.');
      setCreating(false);
      return;
    }
    if (cover || gallery.length || video) {
      try {
        await unwrap(
          ownerService.updateProperty(form.propertyId, {
            ...(cover ? { coverImageKey: cover.key } : {}),
            ...(gallery.length
              ? { galleryImageKeys: [...existingGallery, ...gallery.map((file) => file.key)] }
              : {}),
            ...(video ? { videoTourKey: video.key } : {}),
          })
        );
        void queryClient.invalidateQueries({ queryKey: ownerKeys.properties });
      } catch (reason) {
        setCreateError(
          `The listing was created, but its photos could not be saved to the property: ${
            reason instanceof Error ? reason.message : 'please add them from the property page.'
          }`
        );
        setCreating(false);
        return;
      }
    }
    setCreating(false);
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
                  <p className="text-xs text-muted-foreground">
                    Photos and the video tour belong to the property, so every listing of it shows
                    them. Anything you add here is saved to the property when you create the
                    listing.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Cover Image {!existingCover && <span className="text-red-500">*</span>}
                    </label>
                    <MediaPicker
                      accept="image/*"
                      icon={<ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />}
                      busy={uploading === 'cover'}
                      label={
                        media.cover
                          ? media.cover.name
                          : existingCover
                            ? 'Using the property’s cover: click to replace'
                            : 'Click to upload'
                      }
                      done={!!media.cover || !!existingCover}
                      onFiles={([file]) => void stage('cover', file)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Gallery Images <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <MediaPicker
                      accept="image/*"
                      multiple
                      icon={<Upload className="w-4 h-4 text-gray-400 shrink-0" />}
                      busy={uploading === 'gallery'}
                      label={
                        media.gallery.length
                          ? `${media.gallery.length} image(s) added: add more`
                          : existingGallery.length
                            ? `${existingGallery.length} on the property: add more`
                            : 'Add gallery images'
                      }
                      done={media.gallery.length > 0}
                      onFiles={(files) => void stageGallery(files)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Video Tour <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <MediaPicker
                      accept="video/*"
                      icon={<Video className="w-4 h-4 text-gray-400 shrink-0" />}
                      busy={uploading === 'video'}
                      label={
                        media.video
                          ? media.video.name
                          : propertyForForm?.videoTourKey
                            ? 'The property has a video tour: click to replace'
                            : 'Upload a walkthrough, up to 5 minutes'
                      }
                      done={!!media.video || !!propertyForForm?.videoTourKey}
                      onFiles={([file]) => void stage('video', file)}
                    />
                  </div>
                  {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}
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
                    <SummaryRow
                      label="Cover Image"
                      value={media.cover?.name ?? (existingCover ? 'The property’s cover' : '—')}
                    />
                    <SummaryRow
                      label="Video Tour"
                      value={
                        media.video?.name ??
                        (propertyForForm?.videoTourKey ? 'The property’s video' : 'None')
                      }
                    />
                    <SummaryRow
                      label="Features"
                      value={form.features.length ? `${form.features.length} selected` : 'None'}
                    />
                  </div>
                  {createError && (
                    <p role="alert" className="text-sm text-destructive">
                      {createError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Publishing makes this listing searchable to verified buyers, or puts it in
                    review first when we need to check something. A draft stays off the market until
                    you publish it.
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
                  <Button
                    variant="outline"
                    disabled={creating}
                    onClick={() => void handleCreate('draft')}
                  >
                    Save Draft
                  </Button>
                  <Button
                    variant="primary"
                    className="gap-2"
                    disabled={creating}
                    isLoading={creating}
                    onClick={() => void handleCreate('published')}
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

const MediaPicker = ({
  accept,
  multiple,
  icon,
  label,
  done,
  busy,
  onFiles,
}: {
  accept: string;
  multiple?: boolean;
  icon: ReactNode;
  label: string;
  done: boolean;
  busy: boolean;
  onFiles: (files: File[]) => void;
}) => (
  <label
    className={`flex items-center gap-3 px-3 py-3 rounded-lg border-2 border-dashed border-border transition-colors ${
      busy ? 'opacity-70' : 'hover:border-primary cursor-pointer'
    }`}
  >
    <LegacyInput
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={busy}
      className="hidden"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        // Reset so re-picking the same file still fires a change event.
        e.target.value = '';
        onFiles(files);
      }}
    />
    {busy ? <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" /> : icon}
    <span className="text-sm text-muted-foreground truncate">{busy ? 'Uploading…' : label}</span>
    {done && !busy && <Check className="w-4 h-4 text-green-500 shrink-0 ml-auto" />}
  </label>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-3 py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right truncate max-w-[60%]">{value}</span>
  </div>
);
