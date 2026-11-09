'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, User, Mail, Phone, Building2 } from '@sureground/icons';
import { Field, IconButton, Input, SaveButton } from '@sureground/ui';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { nameOnly } from '@/lib/validations/input';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';
import { ChangePhoneButton } from '@/components/shared/security/ChangePhoneButton';

interface ProfileSettingsProps {
  user: { fullName: string; email: string; role?: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const { data: profile } = useQuery({
    queryKey: ownerKeys.profile,
    queryFn: () => unwrap(ownerService.getProfile()),
  });

  const initial = {
    fullName: profile?.legalName ?? user?.fullName ?? '',
    email: profile?.email ?? user?.email ?? '',
    phone: profile?.phone ?? '',
    companyName: profile?.companyName ?? '',
  };

  return <ProfileSettingsForm key={profile ? 'loaded' : 'initial'} initial={initial} user={user} />;
};

const ProfileSettingsForm = ({
  initial,
  user,
}: {
  initial: { fullName: string; email: string; phone: string; companyName: string };
  user: { fullName: string; email: string; role?: string } | null;
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initial);

  const updateMutation = useMutation({
    mutationFn: () =>
      unwrap(
        ownerService.updateProfile({
          legalName: formData.fullName,
          phone: formData.phone,
          companyName: formData.companyName,
        })
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ownerKeys.profile });
    },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Update your personal information and profile photo
      </p>

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <IconButton
              type="button"
              label="Change profile photo"
              icon={<Camera />}
              size="sm"
              variant="secondary"
              className="absolute -bottom-1 -right-1 rounded-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Profile photo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>

        <Field label="Full name">
          <Input
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: nameOnly(e.target.value) })}
            leadingIcon={<User className="w-4 h-4" />}
          />
        </Field>

        <div>
          {/* The API doesn't change email here; sending it made every save fail validation. */}
          <Field
            label="Email address"
            hint="Your sign-in email. Changing it sends a code to the new address."
          >
            <Input
              type="email"
              value={formData.email}
              readOnly
              leadingIcon={<Mail className="w-4 h-4" />}
              className="cursor-not-allowed bg-secondary text-muted-foreground"
            />
          </Field>
          <ChangeEmailButton onChanged={(email) => setFormData((f) => ({ ...f, email }))} />
        </div>

        <div>
          <Field
            label="Phone number"
            hint={!!initial.phone ? 'Changing it sends a code to the new number.' : undefined}
          >
            <Input
              type="tel"
              value={formData.phone}
              readOnly={!!initial.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              leadingIcon={<Phone className="w-4 h-4" />}
            />
          </Field>
          {!!initial.phone ? (
            <ChangePhoneButton onChanged={(phone) => setFormData((f) => ({ ...f, phone }))} />
          ) : null}
        </div>

        <Field label="Company / agency name">
          <Input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            leadingIcon={<Building2 className="w-4 h-4" />}
          />
        </Field>

        {/* Enter in a field clicks this submit button, so the save runs from onClick alone. */}
        <SaveButton type="submit" onClick={() => updateMutation.mutateAsync()} />
      </form>
    </div>
  );
};
