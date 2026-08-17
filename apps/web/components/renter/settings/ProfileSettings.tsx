'use client';

import { LegacyInput } from '@getrentos/ui';

import { Textarea } from '@getrentos/ui';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, User, Mail, Phone, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SaveButton } from '@getrentos/ui';
import { OTPModal } from '@/components/auth/OTPModal';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface ProfileSettingsProps {
  user: { fullName: string; email: string; role?: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const { data: profile } = useQuery({
    queryKey: renterKeys.profile,
    queryFn: () => unwrap(renterService.getProfile()),
  });

  const initial = {
    fullName: profile?.fullName ?? user?.fullName ?? '',
    email: profile?.email ?? user?.email ?? '',
    phone: profile?.phone ?? '',
    location: profile?.location ?? '',
    bio: profile?.bio ?? '',
  };

  return (
    <ProfileSettingsForm
      key={profile ? 'loaded' : 'initial'}
      initial={initial}
      user={user}
      phoneVerified={!!profile?.phoneVerified}
    />
  );
};

const ProfileSettingsForm = ({
  initial,
  user,
  phoneVerified,
}: {
  initial: { fullName: string; email: string; phone: string; location: string; bio: string };
  user: { fullName: string; email: string; role?: string } | null;
  phoneVerified: boolean;
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState(initial);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [otpReference, setOtpReference] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const updateMutation = useMutation({
    mutationFn: () =>
      unwrap(
        renterService.updateProfile({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
        })
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: renterKeys.profile }),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => unwrap(renterService.updateAvatar(file)),
    onSuccess: (profile) => {
      setAvatarUrl(profile?.avatarUrl);
      queryClient.invalidateQueries({ queryKey: renterKeys.profile });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) avatarMutation.mutate(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const handleVerifyPhone = async () => {
    if (!formData.phone) {
      setOtpError('Add your phone number first');
      return;
    }
    setOtpError('');
    setIsSendingOtp(true);
    const response = await renterService.sendPhoneVerification();
    setIsSendingOtp(false);
    if (response.success && response.data) {
      setOtpReference(response.data.reference);
      setIsOtpOpen(true);
    } else {
      setOtpError(response.message || 'Failed to send the verification code');
    }
  };

  const handleOtpVerify = async (otp: string) => {
    if (!otpReference) return;
    const response = await renterService.confirmPhoneVerification(otpReference, otp);
    if (response.success && response.data) {
      setIsOtpOpen(false);
      setOtpReference('');
      queryClient.invalidateQueries({ queryKey: renterKeys.profile });
    } else {
      throw new Error(response.message || 'The code is invalid or has expired');
    }
  };

  const handleOtpResend = async () => {
    const response = await renterService.sendPhoneVerification();
    if (response.success && response.data) {
      setOtpReference(response.data.reference);
    } else {
      throw new Error(response.message || 'Failed to resend the code');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Update your personal information and profile photo
      </p>

      <OTPModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        identifier={formData.phone}
        method="phone"
        onVerify={handleOtpVerify}
        onResend={handleOtpResend}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white text-2xl font-semibold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Profile Photo</p>
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB.</p>
            {avatarMutation.isPending && <p className="text-xs text-primary mt-1">Uploading…</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <LegacyInput
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
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
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone Number
            {phoneVerified && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <LegacyInput
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {!phoneVerified && (
              <button
                type="button"
                onClick={handleVerifyPhone}
                disabled={isSendingOtp}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium text-primary hover:bg-secondary disabled:opacity-50 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                {isSendingOtp ? 'Sending…' : 'Verify'}
              </button>
            )}
          </div>
          {otpError && <p className="mt-1 text-xs text-red-500">{otpError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <LegacyInput
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <SaveButton type="submit" label="Save Changes" />
      </form>
    </div>
  );
};
