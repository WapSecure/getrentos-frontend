'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SafeImage } from '@/components/shared/media/SafeImage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Globe, ExternalLink } from 'lucide-react';
import {
  Button,
  Card,
  CardSkeleton,
  Field,
  Input,
  Switch,
  Textarea,
  useToast,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import type { EstateMicrositeSettings } from '@/types/estate';
import { useEstatePlan } from '@/hooks/useEstatePlan';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface MicrositeFormProps {
  estateId: string;
  estateName: string;
  settings: EstateMicrositeSettings;
}

// A separate component so its local draft state can be lazily initialized
// straight from `settings` at mount: this component only mounts once the
// settings query has resolved, so there is no async "sync into state" effect
// to write (which react-hooks/set-state-in-effect would flag as a real error).
function MicrositeForm({ estateId, estateName, settings }: MicrositeFormProps) {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(settings.slug);
  const [bio, setBio] = useState(settings.bio || '');
  const [enabled, setEnabled] = useState(settings.enabled);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invalidateSettings = () =>
    queryClient.invalidateQueries({ queryKey: estateKeys.microsite(estateId) });

  const saveSettings = useMutation({
    mutationFn: () =>
      unwrap(estateService.updateMicrositeSettings(estateId, { slug, bio, enabled })),
    onSuccess: (updated) => {
      setSlug(updated.slug);
      toast.success('Microsite settings saved.');
      invalidateSettings();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Unable to save these settings.');
    },
  });

  const [bannerUrl, setBannerUrl] = useState(settings.bannerUrl);
  const uploadBanner = useMutation({
    mutationFn: (file: File) => unwrap(estateService.uploadMicrositeBanner(estateId, file)),
    onSuccess: (updated) => {
      setBannerUrl(updated.bannerUrl);
      toast.success('Banner updated.');
      invalidateSettings();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Unable to upload this banner.');
    },
  });

  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : `/e/${slug}`;
  const slugIsValid = SLUG_PATTERN.test(slug);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadBanner.mutate(file);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Microsite</h1>
        <p className="text-muted-foreground mt-1">
          A public page showcasing {estateName}: share one link with prospective residents.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        <Switch
          checked={enabled}
          onCheckedChange={setEnabled}
          label="Publish microsite"
          description={
            enabled ? 'Live: visible to anyone with the link' : 'Draft: not publicly visible yet'
          }
        />

        <div>
          <p className="block text-sm font-medium text-foreground mb-1">Banner image</p>
          <div className="flex flex-wrap items-center gap-4">
            {bannerUrl ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                <SafeImage
                  src={bannerUrl}
                  alt="Microsite banner"
                  fill
                  sizes="128px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-32 h-20 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <Globe className="w-6 h-6" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              isLoading={uploadBanner.isPending}
            >
              {bannerUrl ? 'Change banner' : 'Upload banner'}
            </Button>
          </div>
        </div>

        <Field
          label="Link"
          error={
            !slugIsValid && slug.length > 0
              ? 'Lowercase letters, numbers, and hyphens only.'
              : undefined
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground break-all">{`${typeof window !== 'undefined' ? window.location.origin : ''}/e/`}</span>
            <Input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="flex-1 min-w-0"
              placeholder="your-estate-name"
            />
          </div>
        </Field>

        <Field label="About">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Tell prospective residents about the estate..."
          />
        </Field>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0 w-full">
            <div className="flex-1 min-w-0 p-2 rounded-lg bg-secondary text-sm text-muted-foreground truncate">
              {publicUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="shrink-0"
              icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            {enabled && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="w-4 h-4" />
                View
              </a>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => saveSettings.mutate()}
            isLoading={saveSettings.isPending}
            disabled={!slugIsValid}
          >
            Save Changes
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function EstateMicrositePage() {
  const router = useRouter();
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();
  const { isPro, isLoading: isPlanLoading } = useEstatePlan();

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: estateKeys.microsite(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getMicrositeSettings(estate!.id)),
    enabled: !!estate && isPro,
  });

  if (isEstateLoading || isPlanLoading) {
    return <CardSkeleton />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  if (!isPro) {
    return (
      <ProFeatureGate
        entitled={isPro}
        title="Microsite is a Pro feature"
        description="Upgrade to Pro to get a public page showcasing your estate: one link to share with residents and prospective buyers."
      >
        <div />
      </ProFeatureGate>
    );
  }

  if (isSettingsLoading || !settings) {
    return <CardSkeleton />;
  }

  return (
    <MicrositeForm
      key={estate.id}
      estateId={estate.id}
      estateName={estate.name}
      settings={settings}
    />
  );
}
