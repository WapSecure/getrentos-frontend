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
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { landlordApi } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';
import { readGate } from '@/lib/verificationGate';
import { VerificationGateNotice } from '@/components/VerificationGateNotice';
import { CommercialDetailsFields } from '@/components/listing/CommercialDetailsFields';
import {
  EMPTY_COMMERCIAL,
  commercialError,
  commercialToCreatePayload,
  isCommercialPropertyType,
  type CommercialValues,
} from '@sureground/shared/showroom';

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
  const [commercial, setCommercial] = useState<CommercialValues>(EMPTY_COMMERCIAL);
  const isCommercial = isCommercialPropertyType(units.find((u) => u.id === unitId)?.propertyType);
  const commercialProblem = isCommercial ? commercialError(commercial) : null;

  const chooseUnit = (id: string) => {
    setUnitId(id);
    const u = units.find((x) => x.id === id);
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
        // Sent only for a commercial unit: the API refuses the block on any other type.
        commercial: isCommercial ? commercialToCreatePayload(commercial) : undefined,
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: (listing) => {
      qc.invalidateQueries({ queryKey: ['landlord', 'listings'] });
      toast.show(
        listing.status === 'pending_verification'
          ? 'Listing created and held for review: it goes live once approved.'
          : 'Listing is live.',
        'success'
      );
      onClose();
    },
    onError: (e) => {
      if (readGate(e)) return;
      toast.show(errorMessage(e, 'Could not create that listing.'), 'error');
    },
    onSettled: () => onSubmittingChange(false),
  });

  const valid =
    unitId && title.trim() && Number(rent) > 0 && availabilityDate && !commercialProblem;

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

      {isCommercial ? (
        <CommercialDetailsFields
          value={commercial}
          onChange={setCommercial}
          error={commercialProblem}
        />
      ) : null}

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
