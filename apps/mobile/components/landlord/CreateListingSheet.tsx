import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
  NumberField,
  Skeleton,
  SwitchRow,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { landlordApi } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { readGate } from '@/lib/verificationGate';
import { VerificationGateNotice } from '@/components/VerificationGateNotice';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateListingSheet({ open, onClose }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="List a unit">
      {/* Remount per open so a dismissed draft never reappears. */}
      <CreateListingForm
        key={open ? 'open' : 'closed'}
        onClose={onClose}
        onSubmittingChange={setSubmitting}
      />
    </Sheet>
  );
}

function CreateListingForm({
  onClose,
  onSubmittingChange,
}: {
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const { spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  // Only units with no live listing can be listed.
  const vacant = useQuery({
    queryKey: ['landlord', 'listings', 'vacant-units'],
    queryFn: landlordApi.listingVacantUnits,
  });
  const units = vacant.data ?? [];

  const [unitId, setUnitId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [rent, setRent] = useState('');
  const [period, setPeriod] = useState<'year' | 'month'>('year');
  const [availabilityDate, setAvailabilityDate] = useState(toISODate(new Date()));
  const [furnished, setFurnished] = useState(false);
  const [allowPets, setAllowPets] = useState(false);

  const chooseUnit = (id: string) => {
    setUnitId(id);
    const u = units.find((x) => x.id === id);
    // Prefill from the unit so the common case is a single tap.
    if (u) {
      if (!title) setTitle(`${u.propertyName}: ${u.unitName}`);
      if (!rent && u.askingRent) setRent(String(u.askingRent));
      if (u.askingRentPeriod) setPeriod(u.askingRentPeriod);
    }
  };

  const create = useMutation({
    mutationFn: () =>
      landlordApi.createListing({
        unitId: unitId!,
        listingTitle: title.trim(),
        askingRent: Number(rent),
        rentPeriod: period,
        availabilityDate,
        amenities: [],
        allowPets,
        furnished,
        shortLetEnabled: false,
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: (listing) => {
      qc.invalidateQueries({ queryKey: ['landlord', 'listings'] });
      // The publication gate either puts it live or holds it for an admin.
      toast.show(
        listing.status === 'pending_verification'
          ? 'Listing created and held for review: it goes live once approved.'
          : 'Listing is live.',
        'success'
      );
      onClose();
    },
    // A verification gate is shown inline with the way forward; anything else is a toast.
    onError: (e) => {
      if (readGate(e)) return;
      toast.show(e instanceof ApiError ? e.message : 'Could not create that listing.', 'error');
    },
    onSettled: () => onSubmittingChange(false),
  });

  const valid = unitId && title.trim() && Number(rent) > 0 && availabilityDate;

  return (
    <View style={{ gap: spacing.lg }}>
      {vacant.isLoading ? (
        <Skeleton height={40} radius={radius.md} />
      ) : (
        <ChipSelect
          label="Unit"
          options={units.map((u) => ({ value: u.id, label: `${u.propertyName} · ${u.unitName}` }))}
          value={unitId}
          onChange={chooseUnit}
          disabled={create.isPending}
          emptyText="Every unit already has a listing. Add a unit to a property first."
        />
      )}

      <TextField
        label="Listing title"
        value={title}
        onChangeText={setTitle}
        editable={!create.isPending}
        required
      />

      <NumberField
        currency
        label="Rent"
        placeholder="0"
        value={rent}
        onValueChange={setRent}
        editable={!create.isPending}
        required
      />

      <ChipSelect
        options={[
          { value: 'year', label: 'Per year' },
          { value: 'month', label: 'Per month' },
        ]}
        value={period}
        onChange={setPeriod}
        disabled={create.isPending}
      />

      <DateField
        label="Available from"
        value={availabilityDate}
        onChange={setAvailabilityDate}
        disabled={create.isPending}
      />

      <SwitchRow
        label="Furnished"
        value={furnished}
        onValueChange={setFurnished}
        disabled={create.isPending}
      />
      <SwitchRow
        label="Pets allowed"
        value={allowPets}
        onValueChange={setAllowPets}
        disabled={create.isPending}
      />

      <VerificationGateNotice error={create.error} onNavigate={onClose} />

      <Button
        label="Create listing"
        loading={create.isPending}
        disabled={!valid || create.isPending}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
