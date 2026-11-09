'use client';

import {
  Button,
  CardSkeleton,
  Field,
  Input,
  PageErrorState,
  SaveButton,
  useToast,
} from '@sureground/ui';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInitials } from '@sureground/shared';
import { adminService } from '@/services/adminService';
import { ChangeEmailButton } from '@/components/security/ChangeEmailButton';
import { ChangePhoneButton } from '@/components/security/ChangePhoneButton';
import { unwrap } from '@sureground/shared';
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

  if (isLoading) return <CardSkeleton lines={5} />;
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
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email and an existing phone change only through their verified flows.
  const hasPhone = !!baseline.phone;
  const isDirty = fullName.trim() !== baseline.fullName || (!hasPhone && phone.trim() !== '');
  const isValid = fullName.trim().length >= 2;

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

  const saveMutation = useMutation({
    mutationFn: () =>
      unwrap(
        adminService.updateProfile({
          fullName: fullName.trim(),
          ...(hasPhone ? {} : { phone: phone.trim() }),
        })
      ),
    onSuccess: (savedProfile) => {
      setBaseline(savedProfile);
      queryClient.setQueryData(adminKeys.profile, savedProfile);
    },
    onError: (error: Error) => toast.error(error.message || 'Profile changes could not be saved.'),
  });

  const handleSave = () => saveMutation.mutateAsync();

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => unwrap(adminService.uploadAvatar(file)),
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      toast.success('Profile photo updated.');
    },
    onError: (error: Error) =>
      toast.error(error.message || 'The profile photo could not be uploaded.'),
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      toast.error('Choose an image smaller than 5 MB.');
      e.target.value = '';
      return;
    }
    uploadAvatarMutation.mutate(file);
  };

  return (
    <div>
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
            // A short-lived signed URL: the optimiser can't cache it and its host isn't on the allowlist.
            unoptimized
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            {getInitials(fullName || 'Admin')}
          </div>
        )}
        <input
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
        <Field
          label="Full Name"
          error={fullName.trim().length < 2 ? 'Enter at least 2 characters.' : undefined}
        >
          <Input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <div>
          <Field
            label="Email Address"
            hint="Your sign-in email. Changing it sends a code to the new address."
          >
            <Input type="email" value={email} readOnly />
          </Field>
          <ChangeEmailButton
            onChanged={(next) => {
              setEmail(next);
              setBaseline((b) => ({ ...b, email: next }));
            }}
          />
        </div>
        <div>
          <Field
            label="Phone Number"
            hint={hasPhone ? 'Changing it sends a code to the new number.' : undefined}
          >
            <Input
              type="tel"
              value={phone}
              readOnly={hasPhone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          {hasPhone ? (
            <ChangePhoneButton
              onChanged={(next) => {
                setPhone(next);
                setBaseline((b) => ({ ...b, phone: next }));
              }}
            />
          ) : null}
        </div>
      </div>

      <SaveButton className="mt-6" onClick={handleSave} disabled={!isDirty || !isValid} />
    </div>
  );
};
