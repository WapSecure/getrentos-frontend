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

export default function EstateSetupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectEstate } = useSelectedEstate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gateCount, setGateCount] = useState('1');
  const [genericError, setGenericError] = useState(false);
  const planGate = usePlanGateModal();

  const createEstate = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.createEstate({
          name,
          address,
          city,
          state,
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
      setGenericError(true);
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
        <Field label="Estate Name" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise Gardens Estate"
          />
        </Field>

        <Field label="Address" required>
          <Input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 1 Garden Close"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="City" required>
            <Input type="text" value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="State" required>
            <Input type="text" value={state} onChange={(e) => setState(e.target.value)} />
          </Field>
        </div>

        <Field label="Number of Gates" optionalLabel="(optional)">
          <NumberInput value={gateCount} onValueChange={setGateCount} min={1} max={50} />
        </Field>

        {genericError && (
          <Alert variant="danger">Unable to create your estate. Please try again.</Alert>
        )}

        <Button
          variant="primary"
          fullWidth
          disabled={!canSubmit}
          isLoading={createEstate.isPending}
          loadingText="Creating…"
          onClick={() => createEstate.mutate()}
        >
          Create Estate
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
