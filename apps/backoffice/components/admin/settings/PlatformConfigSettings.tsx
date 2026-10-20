'use client';

import {
  Button,
  CardSkeleton,
  ConfirmDialog,
  Field,
  NumberInput,
  PageErrorState,
  Switch,
  useToast,
} from '@getrentos/ui';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';
import { unwrap } from '@getrentos/shared';
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

export const PlatformConfigSettings = ({
  onDirtyChange,
}: {
  onDirtyChange: (dirty: boolean) => void;
}) => {
  const {
    data: platformConfig,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: adminKeys.platformConfig,
    queryFn: () => unwrap(adminService.getPlatformConfig()),
  });

  if (isLoading) return <CardSkeleton lines={6} />;
  if (isError || !platformConfig)
    return (
      <PageErrorState
        title="Platform configuration unavailable"
        description="Configuration could not be loaded. Editing is disabled to prevent overwriting live settings with defaults."
        onRetry={() => refetch()}
        isRetrying={isFetching}
        className="min-h-80 border-0"
      />
    );
  return (
    <PlatformConfigSettingsForm
      key={JSON.stringify(platformConfig)}
      initial={platformConfig}
      onDirtyChange={onDirtyChange}
    />
  );
};

const PlatformConfigSettingsForm = ({
  initial,
  onDirtyChange,
}: {
  initial: PlatformConfig;
  onDirtyChange: (dirty: boolean) => void;
}) => {
  const [baseline, setBaseline] = useState(initial);
  const [minTrustScore, setMinTrustScore] = useState(initial.minTrustScore);
  const [escrowHoldDays, setEscrowHoldDays] = useState(initial.escrowHoldDays);
  const [autoFlagFraud, setAutoFlagFraud] = useState(initial.autoFlagFraud);
  const [roleRequirements, setRoleRequirements] = useState<RoleRequirement[]>(
    initial.roleRequirements
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const toast = useToast();
  const current = { minTrustScore, escrowHoldDays, autoFlagFraud, roleRequirements };
  const isDirty = JSON.stringify(current) !== JSON.stringify(baseline);
  const isValid =
    Number.isInteger(minTrustScore) &&
    minTrustScore >= 0 &&
    minTrustScore <= 100 &&
    Number.isInteger(escrowHoldDays) &&
    escrowHoldDays >= 0 &&
    escrowHoldDays <= 30;

  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);

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
    onSuccess: (savedConfig) => {
      setBaseline(savedConfig);
      toast.success('Platform configuration updated.');
    },
    onError: (error: Error) =>
      toast.error(error.message || 'Platform configuration could not be saved.'),
  });

  const handleSave = () => saveMutation.mutate();

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Platform Configuration</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Default thresholds and role verification rules applied platform-wide
      </p>

      <div className="space-y-4">
        <Field
          label="Minimum Trust Score for Auto-Approval"
          error={
            !Number.isInteger(minTrustScore) || minTrustScore < 0 || minTrustScore > 100
              ? 'Enter a whole number from 0 to 100.'
              : undefined
          }
        >
          <NumberInput
            min={0}
            max={100}
            value={minTrustScore}
            onValueChange={(v) => setMinTrustScore(Number(v) || 0)}
          />
        </Field>

        <Field
          label="Escrow Verification Hold Period (days)"
          error={
            !Number.isInteger(escrowHoldDays) || escrowHoldDays < 0 || escrowHoldDays > 30
              ? 'Enter a whole number from 0 to 30 days.'
              : undefined
          }
        >
          <NumberInput
            min={0}
            max={30}
            value={escrowHoldDays}
            onValueChange={(v) => setEscrowHoldDays(Number(v) || 0)}
          />
        </Field>

        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border">
          <span className="text-sm text-foreground">Auto-flag suspicious activity for review</span>
          <Switch
            size="sm"
            aria-label="Automatically flag suspicious activity for review"
            checked={autoFlagFraud}
            onCheckedChange={setAutoFlagFraud}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-foreground mb-2">
            Roles Requiring Manual Verification
          </p>
          <div className="space-y-2">
            {roleRequirements.map((r) => (
              <div
                key={r.role}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border"
              >
                <span className="text-sm text-foreground">{ROLE_LABELS[r.role]}</span>
                <Switch
                  size="sm"
                  aria-label={`Require manual verification for ${ROLE_LABELS[r.role]}`}
                  checked={r.requiresVerification}
                  onCheckedChange={() => toggleRole(r.role)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        className="mt-6"
        onClick={() => setConfirmOpen(true)}
        disabled={!isDirty || !isValid || saveMutation.isPending}
        isLoading={saveMutation.isPending}
      >
        Save Configuration
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Apply platform-wide configuration?"
        description="These thresholds and verification requirements affect platform decisions for all users. Review the values before continuing."
        confirmLabel="Apply configuration"
        onConfirm={handleSave}
      />
    </div>
  );
};
