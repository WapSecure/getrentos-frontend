import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  propertyId: string;
}

export function AddUnitSheet({ open, onClose, propertyId }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Add a unit">
      {/* Remount per open so a dismissed draft never reappears. */}
      <AddUnitForm key={open ? 'open' : 'closed'} propertyId={propertyId} onClose={onClose} />
    </Sheet>
  );
}

const digits = (v: string) => v.replace(/\D/g, '');

function AddUnitForm({ propertyId, onClose }: { propertyId: string; onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [unitName, setUnitName] = useState('');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [askingRent, setAskingRent] = useState('');

  const create = useMutation({
    mutationFn: () =>
      landlordApi.createUnit({
        propertyId,
        unitName: unitName.trim(),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        askingRent: askingRent ? Number(askingRent) : undefined,
        askingRentPeriod: 'year',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'units'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      toast.show('Unit added.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not add that unit.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <TextField
        label="Unit name"
        placeholder="e.g. Flat 2B"
        value={unitName}
        onChangeText={setUnitName}
      />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Bedrooms"
            keyboardType="number-pad"
            value={bedrooms}
            onChangeText={(v) => setBedrooms(digits(v))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextField
            label="Bathrooms"
            keyboardType="number-pad"
            value={bathrooms}
            onChangeText={(v) => setBathrooms(digits(v))}
          />
        </View>
      </View>
      <TextField
        label="Asking rent per year (₦, optional)"
        keyboardType="number-pad"
        value={askingRent}
        onChangeText={(v) => setAskingRent(digits(v))}
      />
      <Button
        label="Add unit"
        loading={create.isPending}
        disabled={!unitName.trim() || bedrooms === '' || bathrooms === ''}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
