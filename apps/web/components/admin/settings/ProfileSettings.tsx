'use client';

import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { getInitials } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/adminService';

interface ProfileSettingsProps {
  user: { fullName: string; email: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adminService.getProfile().then((response) => {
      if (response.success && response.data) {
        setFullName(response.data.fullName);
        setEmail(response.data.email);
        setPhone(response.data.phone || '');
        setAvatarUrl(response.data.avatarUrl);
      }
    });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    const response = await adminService.updateProfile({ fullName, email, phone });
    setIsSaving(false);
    if (response.success) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    const response = await adminService.uploadAvatar(file);
    setIsUploadingAvatar(false);
    if (response.success && response.data) {
      setAvatarUrl(response.data.avatarUrl);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">Manage your personal information</p>

      <div className="flex items-center gap-4 mb-6">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={fullName || 'Admin'}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xl">
            {getInitials(fullName || 'Admin')}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingAvatar}
          isLoading={isUploadingAvatar}
        >
          Change Photo
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        onClick={handleSave}
        disabled={isSaving}
        isLoading={isSaving}
      >
        {saved && <Check className="w-4 h-4" />}
        {saved ? 'Saved' : 'Save Changes'}
      </Button>
    </div>
  );
};
