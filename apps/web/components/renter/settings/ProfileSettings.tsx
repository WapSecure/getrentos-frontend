'use client';

import { useEffect, useState } from 'react';
import { Camera, User, Mail, Phone, MapPin } from 'lucide-react';
import { SaveButton } from '@/components/ui/SaveButton';
import { renterService } from '@/services/renterService';

interface ProfileSettingsProps {
  user: { fullName: string; email: string; role?: string } | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: '',
    location: 'Ikeja, Lagos',
    bio: 'Tech enthusiast and property lover',
  });
  useEffect(() => {
    const load = async () => {
      const res = await renterService.getProfile();
      if (res.success && res.data) {
        setFormData((prev) => ({
          ...prev,
          fullName: res.data!.fullName,
          email: res.data!.email,
          phone: res.data!.phone || '',
        }));
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await renterService.updateProfile({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Profile Settings</h2>
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
            <input
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
            <input
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
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
          <textarea
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
