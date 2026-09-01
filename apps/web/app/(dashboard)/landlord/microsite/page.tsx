'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Copy, Check, Globe, ExternalLink } from 'lucide-react';
import { Button, Switch, Textarea, Toast, type ToastVariant } from '@getrentos/ui';
import { landlordService } from '@/services/landlordService';

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
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
  }, []);

  const publicUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/l/${slug}` : `/l/${slug}`;
  const slugIsValid = SLUG_PATTERN.test(slug);

  const handleSave = async () => {
    if (!slugIsValid) {
      setToast({
        message: 'Link must be lowercase letters, numbers, and hyphens only.',
        variant: 'error',
      });
      return;
    }
    setIsSaving(true);
    const response = await landlordService.updateMicrositeSettings({ slug, bio, enabled });
    setIsSaving(false);
    if (response.success && response.data) {
      setSlug(response.data.slug);
      setToast({ message: 'Microsite settings saved.', variant: 'success' });
    } else {
      setToast({ message: response.message || 'Unable to save these settings.', variant: 'error' });
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
      setToast({ message: 'Banner updated.', variant: 'success' });
    } else {
      setToast({ message: response.message || 'Unable to upload this banner.', variant: 'error' });
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Microsite</h1>
        <p className="text-muted-foreground mt-1">
          A public page showcasing your listings — share one link instead of the whole app.
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
              disabled={isUploadingBanner}
              isLoading={isUploadingBanner}
            >
              {bannerUrl ? 'Change banner' : 'Upload banner'}
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Link</label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{`${typeof window !== 'undefined' ? window.location.origin : ''}/l/`}</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="flex-1 min-w-0 p-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="your-agency-name"
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
            placeholder="Tell prospective renters about your agency..."
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
            onClick={handleSave}
            isLoading={isSaving}
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
