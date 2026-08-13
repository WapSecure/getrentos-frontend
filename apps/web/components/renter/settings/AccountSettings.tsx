'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
  const [passwordError, setPasswordError] = useState<string | null>(null);
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
        setPasswordError(res.message || 'Failed to update password');
      }
    },
  });

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
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
        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter current password"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter new password"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Confirm new password"
              />
            </div>
          </div>
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          <Button type="submit" variant="primary" isLoading={updatePasswordMutation.isPending}>
            Update Password
          </Button>
        </form>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-medium text-foreground mb-3">Contact Information</h3>
        <form onSubmit={handleEmailUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" isLoading={updateProfileMutation.isPending}>
            Update Contact Info
          </Button>
        </form>
      </div>
    </div>
  );
};
