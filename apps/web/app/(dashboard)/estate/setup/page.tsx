'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { Button, LegacyInput, NumberInput } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { ROUTES } from '@/lib/constants/auth';
import { useSelectedEstate } from '../layout';

export default function EstateSetupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectEstate } = useSelectedEstate();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [gateCount, setGateCount] = useState('1');

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

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Estate Name</label>
          <LegacyInput
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise Gardens Estate"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Address</label>
          <LegacyInput
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 1 Garden Close"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">City</label>
            <LegacyInput type="text" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">State</label>
            <LegacyInput type="text" value={state} onChange={(e) => setState(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Number of Gates <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <NumberInput value={gateCount} onValueChange={setGateCount} min={1} max={50} />
        </div>

        {createEstate.isError && (
          <p className="text-sm text-red-600" role="alert">
            Unable to create your estate. Please try again.
          </p>
        )}

        <Button
          variant="primary"
          fullWidth
          disabled={!canSubmit || createEstate.isPending}
          onClick={() => createEstate.mutate()}
        >
          {createEstate.isPending ? 'Creating…' : 'Create Estate'}
        </Button>
      </div>
    </div>
  );
}
