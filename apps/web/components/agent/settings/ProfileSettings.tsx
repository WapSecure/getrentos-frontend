'use client';

import { useRef, useState } from 'react';
import { getInitials } from '@/lib/format';
import { Button, Field, Input, SaveButton, Select } from '@getrentos/ui';
import { nameOnly } from '@/lib/validations/input';
import { ChangeEmailButton } from '@/components/shared/security/ChangeEmailButton';

interface ProfileSettingsProps {
  user: { fullName: string; email: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+234 803 000 0000');
  const [vehicleType, setVehicleType] = useState('Car');

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
      <p className="text-sm text-muted-foreground mb-6">Manage your personal information</p>

      <div className="flex items-center gap-4 mb-6">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
            {getInitials(fullName || 'User')}
          </div>
        )}
        <input
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
        <Field label="Full Name">
          <Input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(nameOnly(e.target.value))}
          />
        </Field>
        <div>
          <Field label="Email Address">
            <Input type="email" value={email} readOnly />
          </Field>
          <ChangeEmailButton onChanged={setEmail} />
        </div>
        <Field label="Phone Number">
          <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Vehicle Type">
          <Select
            value={vehicleType}
            onValueChange={setVehicleType}
            options={['Car', 'Motorcycle', 'Public Transport', 'None'].map((option) => ({
              value: option,
              label: option,
            }))}
          />
        </Field>
      </div>

      <SaveButton label="Save Changes" className="mt-6" />
    </div>
  );
};
