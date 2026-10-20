'use client';

import { useState, type ReactNode } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Upload, Image as ImageIcon, Video } from 'lucide-react';
import {
  Alert,
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  NumberInput,
  Textarea,
} from '@getrentos/ui';
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
    placeholderData: keepPreviousData,
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-lg">
        <div className="shrink-0 border-b border-border p-4 pr-12">
          <DialogTitle className="font-semibold text-foreground">Create Sale Listing</DialogTitle>
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
              <Field label="Property" required>
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
              </Field>

              <Field label="Listing Title" required>
                <Input
                  type="text"
                  value={form.listingTitle}
                  onChange={(e) => update('listingTitle', e.target.value)}
                  placeholder="e.g. Elegant 4-Bed Duplex in Lekki"
                />
              </Field>

              <Field label="Asking Price" required>
                <CurrencyInput
                  prefix="₦"
                  min={0}
                  value={form.askingPrice}
                  onValueChange={(v) => update('askingPrice', v === 0 ? '' : String(v))}
                />
              </Field>

              {propertyForForm && (
                <MarketPriceInsights
                  city={propertyForForm.city}
                  onUseSuggestedPrice={(price) => update('askingPrice', String(price))}
                />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Size (sqm)">
                  <NumberInput
                    min={0}
                    value={form.propertySize}
                    onValueChange={(v) => update('propertySize', v)}
                  />
                </Field>
                <Field label="Bedrooms">
                  <NumberInput
                    min={0}
                    value={form.bedrooms}
                    onValueChange={(v) => update('bedrooms', v)}
                  />
                </Field>
                <Field label="Bathrooms">
                  <NumberInput
                    min={0}
                    value={form.bathrooms}
                    onValueChange={(v) => update('bathrooms', v)}
                  />
                </Field>
              </div>

              <Field label="Description">
                <Textarea
                  value={form.description}
                  onChange={(e) => update('description', e.target.value)}
                  rows={3}
                  placeholder="Describe the property to prospective buyers"
                />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-xs text-muted-foreground">
                Photos and the video tour belong to the property, so every listing of it shows them.
                Anything you add here is saved to the property when you create the listing.
              </p>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  Cover Image{' '}
                  {!existingCover && (
                    <span className="text-destructive" aria-hidden="true">
                      *
                    </span>
                  )}
                </p>
                <MediaPicker
                  accept="image/*"
                  icon={<ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />}
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
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  Gallery Images{' '}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </p>
                <MediaPicker
                  accept="image/*"
                  multiple
                  icon={<Upload className="h-4 w-4 shrink-0 text-muted-foreground" />}
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
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">
                  Video Tour <span className="font-normal text-muted-foreground">(optional)</span>
                </p>
                <MediaPicker
                  accept="video/*"
                  icon={<Video className="h-4 w-4 shrink-0 text-muted-foreground" />}
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
              {mediaError && <Alert variant="danger">{mediaError}</Alert>}
            </>
          )}

          {step === 2 && (
            <div>
              <p className="mb-3 text-sm font-medium text-foreground">
                Select property features & amenities
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {featureOptions.map((feature) => (
                  <div
                    key={feature}
                    className={`rounded-lg border px-3 py-2 transition-colors ${
                      form.features.includes(feature) ? 'border-primary bg-accent' : 'border-border'
                    }`}
                  >
                    <Checkbox
                      checked={form.features.includes(feature)}
                      onCheckedChange={() => toggleFeature(feature)}
                      label={feature}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
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
              {createError && <Alert variant="danger">{createError}</Alert>}
              <p className="text-xs text-muted-foreground">
                Publishing makes this listing searchable to verified buyers, or puts it in review
                first when we need to check something. A draft stays off the market until you
                publish it.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border p-4">
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
                isLoading={creating}
                icon={<Check className="h-4 w-4" />}
                onClick={() => void handleCreate('published')}
              >
                Publish
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
    className={`flex items-center gap-3 rounded-lg border-2 border-dashed border-border px-3 py-3 transition-colors focus-within:ring-2 focus-within:ring-ring ${
      busy ? 'opacity-70' : 'cursor-pointer hover:border-primary'
    }`}
  >
    <input
      type="file"
      accept={accept}
      multiple={multiple}
      disabled={busy}
      className="sr-only"
      onChange={(e) => {
        const files = Array.from(e.target.files ?? []);
        // Reset so re-picking the same file still fires a change event.
        e.target.value = '';
        onFiles(files);
      }}
    />
    {busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" /> : icon}
    <span className="truncate text-sm text-muted-foreground">{busy ? 'Uploading…' : label}</span>
    {done && !busy && <Check className="ml-auto h-4 w-4 shrink-0 text-success" />}
  </label>
);

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between px-3 py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium text-right truncate max-w-[60%]">{value}</span>
  </div>
);
