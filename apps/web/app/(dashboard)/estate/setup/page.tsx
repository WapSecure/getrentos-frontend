'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { Alert, Button, Card, Field, Input, NumberInput } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '../layout';
import { usePlanGateModal } from '@/hooks/usePlanGateModal';
import { UpgradeToProModal } from '@/components/shared/subscription/UpgradeToProModal';
import { AddressFields, type AddressFieldsValue } from '@/components/shared/location/AddressFields';

export default function EstateSetupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectEstate } = useSelectedEstate();
  const [name, setName] = useState('');
  const [location, setLocation] = useState<AddressFieldsValue>({
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
  });
  const { address, city, state } = location;
  const [gateCount, setGateCount] = useState('1');
  const [createError, setCreateError] = useState<string | null>(null);
  const planGate = usePlanGateModal();

  const createEstate = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.createEstate({
          name,
          address,
          city,
          state,
          placeId: location.placeId,
          gateCount: gateCount ? Number(gateCount) : undefined,
        })
      ),
    onSuccess: (newEstate) => {
      queryClient.invalidateQueries({ queryKey: estateKeys.myEstate });
      queryClient.invalidateQueries({ queryKey: estateKeys.myEstates });
      selectEstate(newEstate.id);
      router.push(ROUTES.ESTATE_DASHBOARD);
    },
    onError: (error: Error) => {
      if (planGate.handleError(error)) return;
      setCreateError(error.message || 'Unable to create your estate. Please try again.');
    },
  });

  const canSubmit = name.trim() && address.trim() && city.trim() && state.trim();

  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-primary mb-4">
          <Building2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set up your estate</h1>
        <p className="text-muted-foreground mt-1">
          Tell us about the community you manage. You can add households next.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <Field label="Estate name" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise Gardens Estate"
          />
        </Field>

        <AddressFields
          required
          value={location}
          onChange={(patch) => setLocation((prev) => ({ ...prev, ...patch }))}
        />

        <Field label="Number of gates" optionalLabel="(optional)">
          <NumberInput value={gateCount} onValueChange={setGateCount} min={1} max={50} />
        </Field>

        {createError && <Alert variant="danger">{createError}</Alert>}

        <Button
          variant="primary"
          fullWidth
          disabled={!canSubmit}
          isLoading={createEstate.isPending}
          loadingText="Creating…"
          onClick={() => {
            setCreateError(null);
            createEstate.mutate();
          }}
        >
          Create estate
        </Button>
      </Card>

      <UpgradeToProModal
        isOpen={planGate.isOpen}
        onClose={planGate.close}
        reason={planGate.reason}
      />
    </div>
  );
}
