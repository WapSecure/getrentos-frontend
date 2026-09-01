'use client';

import { LegacyInput } from '@getrentos/ui';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInitials } from '@/lib/format';
import { Button, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';
import { nameOnly } from '@/lib/validations/input';

interface ProfileSettingsProps {
  user: { fullName: string; email: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile } = useQuery({
    queryKey: realtorKeys.settingsProfile,
    queryFn: () => unwrap(realtorService.getSettingsProfile()),
  });

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFullName(profile.fullName || '');

    setEmail(profile.email || '');

    setPhone(profile.phone || '');

    setCompanyName(profile.companyName || '');

    setPhotoUrl(profile.avatarUrl || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.fullName, profile?.email, profile?.phone, profile?.companyName, profile?.avatarUrl]);

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        realtorService.updateSettingsProfile({
          fullName,
          email,
          phone,
          companyName: companyName || undefined,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.settingsProfile });
      setToast({ message: 'Profile updated.', variant: 'success' });
    },
    onError: (error) =>
      setToast({ message: error.message || 'Unable to update your profile.', variant: 'error' }),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => unwrap(realtorService.uploadAvatar(file)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.settingsProfile });
      setPhotoUrl(result.avatarUrl || null);
      setToast({ message: 'Photo updated.', variant: 'success' });
    },
    onError: () => setToast({ message: 'Unable to upload your photo.', variant: 'error' }),
  });

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
      uploadAvatar.mutate(file);
    }
    e.target.value = '';
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your personal and business information
      </p>

      <div className="flex items-center gap-4 mb-6">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xl">
            {getInitials(fullName || 'User')}
          </div>
        )}
        <LegacyInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelected}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatar.isPending}
        >
          {uploadAvatar.isPending ? 'Uploading…' : 'Change Photo'}
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <LegacyInput
            type="text"
            value={fullName}
            onChange={(e) => setFullName(nameOnly(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
          <LegacyInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
          <LegacyInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Agency / Business Name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <LegacyInput
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Prime Realty Partners"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        isLoading={save.isPending}
        disabled={save.isPending}
        onClick={() => save.mutate()}
      >
        Save Changes
      </Button>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
};
