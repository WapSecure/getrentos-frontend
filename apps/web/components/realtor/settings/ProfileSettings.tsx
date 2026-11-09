'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInitials } from '@/lib/format';
import { Button, Field, Input, SaveButton, useToast } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';
import { nameOnly } from '@/lib/validations/input';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';
import { ChangePhoneButton } from '@/components/shared/security/ChangePhoneButton';

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
  const toast = useToast();
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
          phone,
          companyName: companyName || undefined,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.settingsProfile });
    },
    onError: (error) => toast.error(error.message || 'Unable to update your profile.'),
  });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => unwrap(realtorService.uploadAvatar(file)),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.settingsProfile });
      setPhotoUrl(result.avatarUrl || null);
      toast.success('Photo updated.');
    },
    onError: () => toast.error('Unable to upload your photo.'),
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
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            {getInitials(fullName || 'User')}
          </div>
        )}
        <input
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
          isLoading={uploadAvatar.isPending}
          loadingText="Uploading…"
        >
          Change photo
        </Button>
      </div>

      <div className="space-y-4">
        <Field label="Full name">
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(nameOnly(e.target.value))}
          />
        </Field>
        <div>
          <Field label="Email address">
            <Input type="email" value={email} readOnly />
          </Field>
          <ChangeEmailButton onChanged={setEmail} />
        </div>
        <div>
          <Field
            label="Phone number"
            hint={!!profile?.phone ? 'Changing it sends a code to the new number.' : undefined}
          >
            <Input
              type="tel"
              value={phone}
              readOnly={!!profile?.phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          {!!profile?.phone ? <ChangePhoneButton onChanged={setPhone} /> : null}
        </div>
        <Field label="Agency / business name" optionalLabel="(optional)">
          <Input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Prime Realty Partners"
          />
        </Field>
      </div>

      <SaveButton className="mt-6" onClick={() => save.mutateAsync()} />
    </div>
  );
};
