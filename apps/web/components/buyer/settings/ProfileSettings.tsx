'use client';

import { LegacyInput } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, User, Mail, Phone } from 'lucide-react';
import { SaveButton } from '@getrentos/ui';
import { buyerService } from '@/services/buyerService';
import { unwrap } from '@/lib/apiHelpers';
import { buyerKeys } from '@/lib/queryKeys';
import { nameOnly } from '@/lib/validations/input';

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
          email: formData.email,
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
            <div className="w-20 h-20 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-semibold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <LegacyInput
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: nameOnly(e.target.value) })}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <LegacyInput
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <LegacyInput
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <SaveButton type="submit" label="Save Changes" />
      </form>
    </div>
  );
};
