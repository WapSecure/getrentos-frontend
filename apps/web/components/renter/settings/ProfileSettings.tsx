'use client';

import { SafeImage } from '@/components/shared/media/SafeImage';

import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, User, Mail, Phone, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Badge, Button, Field, IconButton, Input, SaveButton, Textarea } from '@getrentos/ui';
import { OTPModal } from '@/components/auth/OTPModal';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import { nameOnly } from '@/lib/validations/input';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';

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
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative">
            <SafeImage
              src={avatarUrl}
              alt="Profile"
              width={80}
              height={80}
              className="w-20 h-20 rounded-full object-cover"
              loading="lazy"
              fallback={
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-semibold text-primary-foreground">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              }
            />
            <IconButton
              type="button"
              size="sm"
              label="Change profile photo"
              onClick={() => fileInputRef.current?.click()}
              isLoading={avatarMutation.isPending}
              className="absolute -bottom-1 -right-1 rounded-full bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground"
              icon={<Camera />}
            />
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
          </div>
        </div>

        <Field label="Full Name">
          <Input
            leadingIcon={<User className="w-4 h-4" />}
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: nameOnly(e.target.value) })}
          />
        </Field>

        <div>
          <Field label="Email Address">
            <Input
              leadingIcon={<Mail className="w-4 h-4" />}
              type="email"
              value={formData.email}
              readOnly
            />
          </Field>
          <ChangeEmailButton onChanged={(email) => setFormData((f) => ({ ...f, email }))} />
        </div>

        <Field
          label="Phone Number"
          error={otpError || undefined}
          labelAside={
            phoneVerified && (
              <Badge
                variant="success"
                icon={<CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />}
              >
                Verified
              </Badge>
            )
          }
        >
          <div className="flex gap-2">
            <Input
              leadingIcon={<Phone className="w-4 h-4" />}
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="min-w-0 flex-1"
            />
            {!phoneVerified && (
              <Button
                type="button"
                variant="outline"
                onClick={handleVerifyPhone}
                isLoading={isSendingOtp}
                loadingText="Sending…"
                icon={<ShieldCheck className="w-4 h-4" />}
                className="shrink-0"
              >
                Verify
              </Button>
            )}
          </div>
        </Field>

        <Field label="Location">
          <Input
            leadingIcon={<MapPin className="w-4 h-4" />}
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
        </Field>

        <Field label="Bio">
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
          />
        </Field>

        <SaveButton type="submit" label="Save Changes" />
      </form>
    </div>
  );
};
