'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone } from 'lucide-react';
import { Button, Field, Input } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface AccountSettingsProps {
  user: { email: string; role?: string } | null;
}

export const AccountSettings = ({ user }: AccountSettingsProps) => {
  const { data: profile } = useQuery({
    queryKey: renterKeys.profile,
    queryFn: () => unwrap(renterService.getProfile()),
  });

  const initial = {
    email: profile?.email ?? user?.email ?? '',
    phone: profile?.phone ?? '',
  };

  return <AccountSettingsForm key={profile ? 'loaded' : 'initial'} initial={initial} />;
};

const AccountSettingsForm = ({ initial }: { initial: { email: string; phone: string } }) => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);

  const updateProfileMutation = useMutation({
    mutationFn: () => unwrap(renterService.updateProfile({ email, phone })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: renterKeys.profile }),
  });

  const handleEmailUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Account settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your email address and phone number. Password and sign-in are under Security.
      </p>

      <div>
        <h3 className="text-lg font-medium text-foreground mb-3">Contact information</h3>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <Field label="Email address">
            <Input
              leadingIcon={<Mail className="w-4 h-4" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone number">
            <Input
              leadingIcon={<Phone className="w-4 h-4" />}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" isLoading={updateProfileMutation.isPending}>
            Update contact info
          </Button>
        </form>
      </div>
    </div>
  );
};
