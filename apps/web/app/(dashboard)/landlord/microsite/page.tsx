'use client';

import { useEffect, useRef, useState } from 'react';
import { SafeImage } from '@/components/shared/media/SafeImage';
import { Copy, Check, Globe, ExternalLink } from 'lucide-react';
import {
  Button,
  Card,
  CardSkeleton,
  Field,
  Input,
  Skeleton,
  Switch,
  Textarea,
  useToast,
} from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';
import { usePlanTier } from '@/hooks/usePlanTier';
import { ProFeatureGate } from '@/components/shared/subscription/ProFeatureGate';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function LandlordMicrositePage() {
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPro, isLoading: isPlanLoading } = usePlanTier();

  useEffect(() => {
    if (isPlanLoading || !isPro) return;
    const fetchSettings = async () => {
      const response = await landlordService.getMicrositeSettings();
      if (response.success && response.data) {
        setSlug(response.data.slug);
        setBio(response.data.bio || '');
        setEnabled(response.data.enabled);
        setBannerUrl(response.data.bannerUrl);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [isPlanLoading, isPro]);

  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/l/${slug}` : `/l/${slug}`;
  const slugIsValid = SLUG_PATTERN.test(slug);

  const handleSave = async () => {
    if (!slugIsValid) {
      toast.error('Link must be lowercase letters, numbers, and hyphens only.');
      return;
    }
    setIsSaving(true);
    const response = await landlordService.updateMicrositeSettings({ slug, bio, enabled });
    setIsSaving(false);
    if (response.success && response.data) {
      setSlug(response.data.slug);
      toast.success('Microsite settings saved.');
    } else {
      toast.error(response.message || 'Unable to save these settings.');
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    const response = await landlordService.uploadMicrositeBanner(file);
    setIsUploadingBanner(false);
    if (response.success && response.data) {
      setBannerUrl(response.data.bannerUrl);
      toast.success('Banner updated.');
    } else {
      toast.error(response.message || 'Unable to upload this banner.');
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isPlanLoading || (isPro && isLoading)) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <CardSkeleton lines={6} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Microsite</h1>
        <p className="text-muted-foreground mt-1">
          A public page showcasing your listings: share one link instead of the whole app.
        </p>
      </div>

      <ProFeatureGate
        title="Microsite is a Pro feature"
        description="Upgrade to Pro to get a public page showcasing your listings: one link to share instead of the whole app."
      >
        <Card className="rounded-2xl p-6 space-y-6">
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
                isLoading={isUploadingBanner}
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
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">{`${typeof window !== 'undefined' ? window.location.origin : ''}/l/`}</span>
              <Input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="flex-1 min-w-0"
                placeholder="your-agency-name"
              />
            </div>
          </Field>

          <Field label="About">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              showCount
              placeholder="Tell prospective renters about your agency..."
            />
          </Field>

          <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex w-full flex-wrap items-center gap-2 min-w-0">
              <div className="flex-1 min-w-0 p-2 rounded-lg bg-secondary/60 text-sm text-muted-foreground truncate">
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
                  className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!slugIsValid}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </ProFeatureGate>
    </div>
  );
}
