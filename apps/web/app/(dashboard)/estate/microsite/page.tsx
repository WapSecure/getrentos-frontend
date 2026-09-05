'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { Button, Switch, Textarea, Toast, type ToastVariant } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '@/app/(dashboard)/estate/layout';
import type { EstateMicrositeSettings } from '@/types/estate';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

interface MicrositeFormProps {
  estateId: string;
  estateName: string;
  settings: EstateMicrositeSettings;
}

// A separate component so its local draft state can be lazily initialized
// straight from `settings` at mount — this component only mounts once the
// settings query has resolved, so there is no async "sync into state" effect
// to write (which react-hooks/set-state-in-effect would flag as a real error).
function MicrositeForm({ estateId, estateName, settings }: MicrositeFormProps) {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(settings.slug);
  const [bio, setBio] = useState(settings.bio || '');
  const [enabled, setEnabled] = useState(settings.enabled);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invalidateSettings = () =>
    queryClient.invalidateQueries({ queryKey: estateKeys.microsite(estateId) });

  const saveSettings = useMutation({
    mutationFn: () =>
      unwrap(estateService.updateMicrositeSettings(estateId, { slug, bio, enabled })),
    onSuccess: (updated) => {
      setSlug(updated.slug);
      setToast({ message: 'Microsite settings saved.', variant: 'success' });
      invalidateSettings();
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Unable to save these settings.', variant: 'error' });
    },
  });

  const [bannerUrl, setBannerUrl] = useState(settings.bannerUrl);
  const uploadBanner = useMutation({
    mutationFn: (file: File) => unwrap(estateService.uploadMicrositeBanner(estateId, file)),
    onSuccess: (updated) => {
      setBannerUrl(updated.bannerUrl);
      setToast({ message: 'Banner updated.', variant: 'success' });
      invalidateSettings();
    },
    onError: (err: Error) => {
      setToast({ message: err.message || 'Unable to upload this banner.', variant: 'error' });
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
          A public page showcasing {estateName} — share one link with prospective residents.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Publish microsite</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {enabled
                ? 'Live — visible to anyone with the link'
                : 'Draft — not publicly visible yet'}
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Publish microsite" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Banner image</label>
          <div className="flex items-center gap-4">
            {bannerUrl ? (
              <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                <Image
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
              disabled={uploadBanner.isPending}
              isLoading={uploadBanner.isPending}
            >
              {bannerUrl ? 'Change banner' : 'Upload banner'}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Link</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{`${typeof window !== 'undefined' ? window.location.origin : ''}/e/`}</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="flex-1 min-w-0 p-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your-estate-name"
            />
          </div>
          {!slugIsValid && slug.length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Lowercase letters, numbers, and hyphens only.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">About</label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Tell prospective residents about the estate..."
          />
        </div>

        <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0 p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-sm text-muted-foreground truncate">
              {publicUrl}
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-2 shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            {enabled && (
              <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-2 shrink-0">
                  <ExternalLink className="w-4 h-4" />
                  View
                </Button>
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
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default function EstateMicrositePage() {
  const router = useRouter();
  const { estate, isLoading: isEstateLoading } = useSelectedEstate();

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: estateKeys.microsite(estate?.id ?? ''),
    queryFn: () => unwrap(estateService.getMicrositeSettings(estate!.id)),
    enabled: !!estate,
  });

  if (isEstateLoading) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    router.replace(ROUTES.ESTATE_SETUP);
    return null;
  }

  if (isSettingsLoading || !settings) {
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
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
