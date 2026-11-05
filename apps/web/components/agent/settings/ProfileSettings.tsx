'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInitials } from '@/lib/format';
import { Button, Field, Input, useToast } from '@getrentos/ui';
import { nameOnly } from '@/lib/validations/input';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';

interface ProfileSettingsProps {
  user: { fullName: string; email: string } | null;
}

/** The agent's own name and phone, saved to their account (email changes are verified separately). */
export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const { data: profile } = useQuery({
    queryKey: agentKeys.profile,
    queryFn: () => unwrap(agentService.getProfile()),
  });

  return (
    <ProfileForm
      key={profile ? 'loaded' : 'initial'}
      initial={{
        fullName: profile?.legalName ?? user?.fullName ?? '',
        email: profile?.email ?? user?.email ?? '',
        phone: profile?.phone ?? '',
      }}
    />
  );
};

const ProfileForm = ({
  initial,
}: {
  initial: { fullName: string; email: string; phone: string };
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [fullName, setFullName] = useState(initial.fullName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);

  const save = useMutation({
    mutationFn: () =>
      unwrap(agentService.updateProfile({ fullName: fullName.trim(), phone: phone.trim() })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: agentKeys.profile });
      toast.success('Profile saved.');
    },
    onError: (error: Error) => toast.error(error.message || 'Could not save your profile.'),
  });

  const dirty = fullName.trim() !== initial.fullName || phone.trim() !== initial.phone;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your personal information</p>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
          {getInitials(fullName || 'User')}
        </div>
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
        <Field label="Phone number" hint="A new number has to be verified again.">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>

      <Button
        className="mt-6"
        onClick={() => save.mutate()}
        disabled={!dirty || fullName.trim().length < 2}
        isLoading={save.isPending}
      >
        Save changes
      </Button>
    </div>
  );
};
