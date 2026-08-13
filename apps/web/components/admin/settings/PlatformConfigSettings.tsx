'use client';

import { LegacyInput } from '@/components/ui/LegacyInput';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/adminService';
import { unwrap } from '@/lib/apiHelpers';
import { adminKeys } from '@/lib/queryKeys';
import type { PlatformConfig, PlatformConfigRole, RoleRequirement } from '@/types/admin';

const ROLE_LABELS: Record<PlatformConfigRole, string> = {
  landlord: 'Landlord',
  owner: 'Property Owner',
  realtor: 'Realtor',
  agent: 'Agent',
  renter: 'Renter',
  buyer: 'Buyer',
};

const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  minTrustScore: 60,
  escrowHoldDays: 3,
  autoFlagFraud: true,
  roleRequirements: [
    { role: 'landlord', requiresVerification: true },
    { role: 'owner', requiresVerification: true },
    { role: 'realtor', requiresVerification: true },
    { role: 'agent', requiresVerification: true },
    { role: 'renter', requiresVerification: false },
    { role: 'buyer', requiresVerification: false },
  ],
};

export const PlatformConfigSettings = () => {
  const { data: platformConfig } = useQuery({
    queryKey: adminKeys.platformConfig,
    queryFn: () => unwrap(adminService.getPlatformConfig()),
  });

  return (
    <PlatformConfigSettingsForm
      key={platformConfig ? 'loaded' : 'initial'}
      initial={platformConfig ?? DEFAULT_PLATFORM_CONFIG}
    />
  );
};

const PlatformConfigSettingsForm = ({ initial }: { initial: PlatformConfig }) => {
  const [minTrustScore, setMinTrustScore] = useState(initial.minTrustScore);
  const [escrowHoldDays, setEscrowHoldDays] = useState(initial.escrowHoldDays);
  const [autoFlagFraud, setAutoFlagFraud] = useState(initial.autoFlagFraud);
  const [roleRequirements, setRoleRequirements] = useState<RoleRequirement[]>(
    initial.roleRequirements
  );
  const [saved, setSaved] = useState(false);

  const toggleRole = (role: PlatformConfigRole) => {
    setRoleRequirements((prev) =>
      prev.map((r) =>
        r.role === role ? { ...r, requiresVerification: !r.requiresVerification } : r
      )
    );
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      unwrap(
        adminService.updatePlatformConfig({
          minTrustScore,
          escrowHoldDays,
          autoFlagFraud,
          roleRequirements,
        })
      ),
    onSuccess: () => {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = () => saveMutation.mutate();

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Platform Configuration</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Default thresholds and role verification rules applied platform-wide
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Minimum Trust Score for Auto-Approval
          </label>
          <LegacyInput
            type="number"
            min={0}
            max={100}
            value={minTrustScore}
            onChange={(e) => setMinTrustScore(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Escrow Verification Hold Period (days)
          </label>
          <LegacyInput
            type="number"
            min={0}
            max={30}
            value={escrowHoldDays}
            onChange={(e) => setEscrowHoldDays(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border">
          <span className="text-sm text-foreground">Auto-flag suspicious activity for review</span>
          <button
            onClick={() => setAutoFlagFraud((prev) => !prev)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              autoFlagFraud ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoFlagFraud ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Roles Requiring Manual Verification
          </p>
          <div className="space-y-2">
            {roleRequirements.map((r) => (
              <div
                key={r.role}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <span className="text-sm text-foreground">{ROLE_LABELS[r.role]}</span>
                <button
                  onClick={() => toggleRole(r.role)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    r.requiresVerification ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${r.requiresVerification ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-6 gap-1.5"
        onClick={handleSave}
        disabled={saveMutation.isPending}
        isLoading={saveMutation.isPending}
      >
        {saved && <Check className="w-4 h-4" />}
        {saved ? 'Saved' : 'Save Configuration'}
      </Button>
    </div>
  );
};
