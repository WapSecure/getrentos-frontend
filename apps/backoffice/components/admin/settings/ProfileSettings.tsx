'use client';

import {
  Button,
  LegacyInput,
  PageErrorState,
  PageLoadingState,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInitials } from '@getrentos/shared';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
import { adminKeys } from '@/lib/queryKeys';
import type { AdminProfile } from '@/types/admin';

interface ProfileSettingsProps {
  onDirtyChange: (dirty: boolean) => void;
}

export const ProfileSettings = ({ onDirtyChange }: ProfileSettingsProps) => {
  const {
    data: profile,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: adminKeys.profile,
    queryFn: () => unwrap(adminService.getProfile()),
  });

  if (isLoading) return <PageLoadingState />;
  if (isError || !profile)
    return (
      <PageErrorState
        title="Profile unavailable"
        description="Your current profile could not be loaded. Editing is disabled to protect the saved record."
        onRetry={() => refetch()}
        isRetrying={isFetching}
        className="min-h-80 border-0"
      />
    );
  return (
    <ProfileSettingsForm
      key={JSON.stringify(profile)}
      initial={profile}
      onDirtyChange={onDirtyChange}
    />
  );
};

const ProfileSettingsForm = ({
  initial,
  onDirtyChange,
}: {
  initial: AdminProfile;
  onDirtyChange: (dirty: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(initial.avatarUrl);
  const [baseline, setBaseline] = useState(initial);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty =
    fullName.trim() !== baseline.fullName ||
    email.trim() !== baseline.email ||
    phone.trim() !== (baseline.phone || '');
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = fullName.trim().length >= 2 && emailValid;

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const saveMutation = useMutation({
    mutationFn: () =>
      unwrap(
        adminService.updateProfile({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        })
      ),
    onSuccess: (savedProfile) => {
      setBaseline(savedProfile);
      setToast({ message: 'Profile changes saved.', variant: 'success' });
      queryClient.setQueryData(adminKeys.profile, savedProfile);
    },
    onError: (error: Error) =>
      setToast({
        message: error.message || 'Profile changes could not be saved.',
        variant: 'error',
      }),
  });

  const handleSave = () => saveMutation.mutate();

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => unwrap(adminService.uploadAvatar(file)),
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      setToast({ message: 'Profile photo updated.', variant: 'success' });
    },
    onError: (error: Error) =>
      setToast({
        message: error.message || 'The profile photo could not be uploaded.',
        variant: 'error',
      }),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setToast({ message: 'Choose an image smaller than 5 MB.', variant: 'error' });
      e.target.value = '';
      return;
    }
    uploadAvatarMutation.mutate(file);
  };

  return (
    <div>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your personal information</p>

      <div className="flex items-center gap-4 mb-6">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={fullName || 'Admin'}
            width={64}
            height={64}
            className="w-16 h-16 rounded-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xl">
            {getInitials(fullName || 'Admin')}
          </div>
        )}
        <LegacyInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          aria-label="Choose a new profile photo"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadAvatarMutation.isPending}
          isLoading={uploadAvatarMutation.isPending}
        >
          Change Photo
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="admin-profile-name"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Full Name
          </label>
          <LegacyInput
            id="admin-profile-name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {fullName.trim().length < 2 && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              Enter at least 2 characters.
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="admin-profile-email"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Email Address
          </label>
          <LegacyInput
            id="admin-profile-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {!emailValid && (
            <p className="mt-1 text-xs text-destructive" role="alert">
              Enter a valid email address.
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="admin-profile-phone"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Phone Number
          </label>
          <LegacyInput
            id="admin-profile-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        onClick={handleSave}
        disabled={!isDirty || !isValid || saveMutation.isPending}
        isLoading={saveMutation.isPending}
      >
        Save Changes
      </Button>
    </div>
  );
};
