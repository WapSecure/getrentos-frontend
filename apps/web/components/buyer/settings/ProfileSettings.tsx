'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, User, Mail, Phone } from 'lucide-react';
import { Field, IconButton, Input, SaveButton } from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { nameOnly } from '@/lib/validations/input';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';

interface ProfileSettingsProps {
  user: { fullName: string; email: string; role?: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const { data: profile } = useQuery({
    queryKey: buyerKeys.profile,
    queryFn: () => unwrap(buyerService.getProfile()),
  });

  const initial = {
    fullName: profile?.legalName ?? user?.fullName ?? '',
    email: profile?.email ?? user?.email ?? '',
    phone: profile?.phone ?? '',
  };

  return <ProfileSettingsForm key={profile ? 'loaded' : 'initial'} initial={initial} user={user} />;
};

const ProfileSettingsForm = ({
  initial,
  user,
}: {
  initial: { fullName: string; email: string; phone: string };
  user: { fullName: string; email: string; role?: string } | null;
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initial);

  const updateMutation = useMutation({
    mutationFn: () =>
      unwrap(
        buyerService.updateProfile({
          legalName: formData.fullName,
          phone: formData.phone,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: buyerKeys.profile }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Update your personal information and profile photo
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-semibold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <IconButton
              label="Change profile photo"
              icon={<Camera />}
              size="sm"
              className="absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>

        <Field label="Full Name">
          <Input
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: nameOnly(e.target.value) })}
            leadingIcon={<User className="h-4 w-4" />}
          />
        </Field>

        <Field label="Email Address">
          <Input
            type="email"
            value={formData.email}
            readOnly
            leadingIcon={<Mail className="h-4 w-4" />}
          />
        </Field>
        <ChangeEmailButton onChanged={(email) => setFormData((f) => ({ ...f, email }))} />

        <Field label="Phone Number">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            leadingIcon={<Phone className="h-4 w-4" />}
          />
        </Field>

        <SaveButton type="submit" label="Save Changes" />
      </form>
    </div>
  );
};
