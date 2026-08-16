'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, User, Users, Globe, Lock, Phone } from 'lucide-react';
import { Button, Toast, ToastVariant } from '@getrentos/ui';
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';

interface PrivacyState {
  profileVisibility: 'public' | 'private' | 'contacts';
  showEmail: boolean;
  showPhone: boolean;
  showActivity: boolean;
  allowMessages: boolean;
  shareData: boolean;
}

export const PrivacySettings = () => {
  const queryClient = useQueryClient();
  const [privacy, setPrivacy] = useState<PrivacyState>({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showActivity: true,
    allowMessages: true,
    shareData: false,
  });
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const { data } = useQuery({
    queryKey: renterKeys.settingsPreferences,
    queryFn: () => unwrap(renterService.getSettingsPreferences()),
  });

  useEffect(() => {
    const saved = data?.privacy as Partial<PrivacyState> | undefined;
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrivacy((prev) => ({ ...prev, ...saved }));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => unwrap(renterService.updateSettingsPreferences({ privacy })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.settingsPreferences });
      setToast({ message: 'Privacy settings saved', variant: 'success' });
    },
    onError: (err: Error) =>
      setToast({ message: err.message || 'Failed to save privacy settings', variant: 'error' }),
  });

  const visibilityOptions = [
    { id: 'public', label: 'Public', icon: Globe },
    { id: 'private', label: 'Private', icon: Lock },
    { id: 'contacts', label: 'Contacts Only', icon: Users },
  ];

  return (
    <div>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <h2 className="text-xl font-semibold text-foreground mb-4">Privacy Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Control who can see your information and activity
      </p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Profile Visibility
          </label>
          <div className="grid grid-cols-3 gap-3">
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = privacy.profileVisibility === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() =>
                    setPrivacy({
                      ...privacy,
                      profileVisibility: option.id as PrivacyState['profileVisibility'],
                    })
                  }
                  className={`p-3 rounded-lg border-2 transition-all ${
                    isSelected ? 'border-primary bg-accent' : 'border-border hover:border-gray-300'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mx-auto mb-1 ${isSelected ? 'text-primary' : 'text-gray-500'}`}
                  />
                  <p
                    className={`text-xs text-center ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                  >
                    {option.label}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">What others can see</label>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-foreground">Show Email Address</span>
            </div>
            <button
              onClick={() => setPrivacy({ ...privacy, showEmail: !privacy.showEmail })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacy.showEmail ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-foreground">Show Phone Number</span>
            </div>
            <button
              onClick={() => setPrivacy({ ...privacy, showPhone: !privacy.showPhone })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacy.showPhone ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacy.showPhone ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-foreground">Show Activity Status</span>
            </div>
            <button
              onClick={() => setPrivacy({ ...privacy, showActivity: !privacy.showActivity })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                privacy.showActivity ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  privacy.showActivity ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
          disabled={saveMutation.isPending}
        >
          Save Privacy Settings
        </Button>
      </div>
    </div>
  );
};
