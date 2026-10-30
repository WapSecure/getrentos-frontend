'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Mail, Phone } from 'lucide-react';
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Errors sit on the field they are about, so assistive tech reads them with it.
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);

  const updatePasswordMutation = useMutation({
    mutationFn: () => renterService.updatePassword(currentPassword, newPassword),
    onSuccess: (res) => {
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setCurrentPasswordError(res.message || 'Failed to update password');
      }
    },
  });

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPasswordError(null);
    setConfirmPasswordError(null);
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('New passwords do not match');
      return;
    }
    updatePasswordMutation.mutate();
  };

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
      <h2 className="text-xl font-semibold text-foreground mb-4">Account Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your account security and contact information
      </p>

      {/* Change Password */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-foreground mb-3">Change Password</h3>
        <form method="post" onSubmit={handlePasswordUpdate} className="space-y-4">
          <Field label="Current Password" error={currentPasswordError || undefined}>
            <Input
              leadingIcon={<Lock className="w-4 h-4" />}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </Field>
          <Field label="New Password">
            <Input
              leadingIcon={<Lock className="w-4 h-4" />}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </Field>
          <Field label="Confirm New Password" error={confirmPasswordError || undefined}>
            <Input
              leadingIcon={<Lock className="w-4 h-4" />}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </Field>
          <Button type="submit" variant="primary" isLoading={updatePasswordMutation.isPending}>
            Update Password
          </Button>
        </form>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-medium text-foreground mb-3">Contact Information</h3>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <Field label="Email Address">
            <Input
              leadingIcon={<Mail className="w-4 h-4" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Phone Number">
            <Input
              leadingIcon={<Phone className="w-4 h-4" />}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" isLoading={updateProfileMutation.isPending}>
            Update Contact Info
          </Button>
        </form>
      </div>
    </div>
  );
};
