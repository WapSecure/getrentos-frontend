'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone } from 'lucide-react';
import { Button, Field, Input } from '@sureground/ui';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';
import { ChangePhoneButton } from '@/components/shared/security/ChangePhoneButton';
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
    // Email and an existing phone number change only through their verified flows.
    mutationFn: () => unwrap(renterService.updateProfile({ phone })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: renterKeys.profile }),
  });

  const handleSave = (e: React.FormEvent) => {
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
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Field
              label="Email address"
              hint="Your sign-in email. Changing it sends a code to the new address."
            >
              <Input
                leadingIcon={<Mail className="w-4 h-4" />}
                type="email"
                value={email}
                readOnly
              />
            </Field>
            <ChangeEmailButton onChanged={setEmail} />
          </div>
          <div>
            <Field
              label="Phone number"
              hint={initial.phone ? 'Changing it sends a code to the new number.' : undefined}
            >
              <Input
                leadingIcon={<Phone className="w-4 h-4" />}
                type="tel"
                value={phone}
                readOnly={!!initial.phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>
            {initial.phone ? <ChangePhoneButton onChanged={setPhone} /> : null}
          </div>
          {initial.phone ? null : (
            <Button
              type="submit"
              variant="primary"
              isLoading={updateProfileMutation.isPending}
              disabled={!phone.trim()}
            >
              Save phone number
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};
