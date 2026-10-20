'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, User, Users, Globe, Lock, Phone, History } from 'lucide-react';
import { Button, RadioGroup, Switch, useOptimisticMutation, useToast } from '@getrentos/ui';
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
  const toast = useToast();

  const { data } = useQuery({
    queryKey: renterKeys.settingsPreferences,
    queryFn: () => unwrap(renterService.getSettingsPreferences()),
  });
  const shareTenancyStanding = data?.shareTenancyStanding === true;

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
      toast.success('Privacy settings saved');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to save privacy settings'),
  });

  const updateSharing = useOptimisticMutation({
    mutationFn: (value: boolean) =>
      unwrap(renterService.updateSettingsPreferences({ shareTenancyStanding: value })),
    patches: (value) => [
      {
        queryKey: renterKeys.settingsPreferences,
        update: (old) => ({ ...(old as object), shareTenancyStanding: value }),
      },
    ],
    errorMessage: 'Your tenancy standing preference did not save. Please try again.',
  });

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: <Globe className="w-5 h-5" /> },
    { value: 'private', label: 'Private', icon: <Lock className="w-5 h-5" /> },
    { value: 'contacts', label: 'Contacts Only', icon: <Users className="w-5 h-5" /> },
  ] as const;

  const visibilityRows = [
    { key: 'showEmail', label: 'Show Email Address', icon: Eye },
    { key: 'showPhone', label: 'Show Phone Number', icon: Phone },
    { key: 'showActivity', label: 'Show Activity Status', icon: User },
  ] as const;

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Privacy Settings</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Control who can see your information and activity
      </p>

      <div className="space-y-6">
        <div>
          <p className="block text-sm font-medium text-foreground mb-2">Profile Visibility</p>
          <RadioGroup
            value={privacy.profileVisibility}
            onValueChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}
            variant="card"
            columns={3}
            options={visibilityOptions}
          />
        </div>

        <div className="space-y-3">
          <p className="block text-sm font-medium text-foreground">What others can see</p>

          {visibilityRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm text-foreground">{row.label}</span>
                </div>
                <Switch
                  checked={privacy[row.key]}
                  onCheckedChange={(checked) => setPrivacy({ ...privacy, [row.key]: checked })}
                  aria-label={row.label}
                />
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <p className="block text-sm font-medium text-foreground">Tenancy standing</p>
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
            <History className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Switch
              className="min-w-0 flex-1"
              checked={shareTenancyStanding}
              onCheckedChange={(checked) => updateSharing.mutate(checked)}
              label="Share my tenancy standing with landlords I apply to"
              description="When on, a landlord reviewing your rental application can see your platform trust score, signed-lease count, and verification status."
            />
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full"
          onClick={() => saveMutation.mutate()}
          isLoading={saveMutation.isPending}
        >
          Save Privacy Settings
        </Button>
      </div>
    </div>
  );
};
