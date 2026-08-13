'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useRef, useState } from 'react';
import { getInitials } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { SaveButton } from '@/components/ui/SaveButton';

interface ProfileSettingsProps {
  user: { fullName: string; email: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+234 803 000 0000');
  const [companyName, setCompanyName] = useState('');

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your personal and business information
      </p>

      <div className="flex items-center gap-4 mb-6">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-xl">
            {getInitials(fullName || 'User')}
          </div>
        )}
        <LegacyInput
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoSelected}
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          Change Photo
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <LegacyInput
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
          <LegacyInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
          <LegacyInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Company / Business Name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <LegacyInput
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Okafor Properties Ltd"
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <SaveButton label="Save Changes" className="mt-6" />
    </div>
  );
};
