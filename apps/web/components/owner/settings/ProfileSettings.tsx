'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, User, Mail, Phone, Building2 } from 'lucide-react';
import { Button, Field, IconButton, Input, useToast } from '@getrentos/ui';
import { ownerService } from '@/services/ownerService';
import { unwrap } from '@/lib/apiHelpers';
import { ownerKeys } from '@/lib/queryKeys';
import { nameOnly } from '@/lib/validations/input';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';

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
  const toast = useToast();
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
      toast.success('Saved');
    },
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
              type="button"
              label="Change profile photo"
              icon={<Camera />}
              size="sm"
              variant="secondary"
              className="absolute -bottom-1 -right-1 rounded-full"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>

        <Field label="Full Name">
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
            label="Email Address"
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

        <Field label="Phone Number">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            leadingIcon={<Phone className="w-4 h-4" />}
          />
        </Field>

        <Field label="Company / Agency Name">
          <Input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            leadingIcon={<Building2 className="w-4 h-4" />}
          />
        </Field>

        <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>
          Save Changes
        </Button>
      </form>
    </div>
  );
};
