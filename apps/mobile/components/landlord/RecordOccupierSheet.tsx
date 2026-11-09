import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi, type LandlordUnit } from '@/lib/api/landlord';
import { errorMessage } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  unit: LandlordUnit | null;
}

const oneYearAfter = (iso: string) => {
  const date = new Date(iso);
  date.setFullYear(date.getFullYear() + 1);
  return toISODate(date);
};

/**
 * Records a tenancy that already exists, for someone with no Sureground account.
 * It creates a SIGNED lease, because the agreement is already in force — there
 * is nobody to send it to and nothing to draft.
 */
export function RecordOccupierSheet({ open, onClose, unit }: Props) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <Sheet open={open} onClose={submitting ? () => undefined : onClose} title="Record occupier">
      {/* Remount per unit so nothing carries across. */}
      {unit ? (
        <RecordForm
          key={unit.id}
          unit={unit}
          onClose={onClose}
          onSubmittingChange={setSubmitting}
        />
      ) : null}
    </Sheet>
  );
}

function RecordForm({
  unit,
  onClose,
  onSubmittingChange,
}: {
  unit: LandlordUnit;
  onClose: () => void;
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const start = toISODate(new Date());
  const period = unit.leaseRentPeriod ?? unit.askingRentPeriod ?? 'year';
  const suggestedRent = unit.leaseRent ?? unit.askingRent;

  const [tenantName, setTenantName] = useState('');
  const [rent, setRent] = useState(suggestedRent ? String(suggestedRent) : '');
  const [leaseStart, setLeaseStart] = useState(start);
  const [leaseEnd, setLeaseEnd] = useState(oneYearAfter(start));
  const [validationError, setValidationError] = useState<string | null>(null);

  const record = useMutation({
    mutationFn: () =>
      landlordApi.createLease({
        unitId: unit.id,
        tenantName: tenantName.trim(),
        leaseStart,
        leaseEnd,
        rentAmount: Number(rent),
        rentPeriod: period,
        securityDeposit: 0,
        // The tenancy is already running: record it in force, do not draft it.
        recordExisting: true,
        sendImmediately: false,
      }),
    onMutate: () => onSubmittingChange(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'units'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'tenants'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      toast.show('Tenancy recorded.', 'success');
      onClose();
    },
    onError: (e) => toast.show(errorMessage(e, 'Could not record that occupier.'), 'error'),
    onSettled: () => onSubmittingChange(false),
  });

  const submit = () => {
    if (!tenantName.trim()) return setValidationError('Enter the occupier’s name.');
    const rentAmount = Number(rent);
    if (!Number.isFinite(rentAmount) || rentAmount <= 0)
      return setValidationError('Enter the rent you collect for this tenancy.');
    if (!leaseEnd || leaseEnd <= leaseStart)
      return setValidationError('The tenancy has to end after it starts.');
    setValidationError(null);
    record.mutate();
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        For someone already living in <Text variant="bodyStrong">{unit.unitName}</Text> at{' '}
        {unit.propertyName} who will not use Sureground. This creates a tenancy you can invoice and
        track rent against. They will not be able to sign in, pay in-app, or carry a trust score.
      </Text>

      <TextField
        label="Occupier name"
        placeholder="e.g. Amaka Obi"
        value={tenantName}
        onChangeText={setTenantName}
        editable={!record.isPending}
        required
      />

      <TextField
        label={`Rent per ${period}`}
        placeholder="0"
        value={rent}
        onChangeText={setRent}
        keyboardType="numeric"
        editable={!record.isPending}
        required
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <DateField label="Starts" value={leaseStart} onChange={setLeaseStart} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label="Ends" value={leaseEnd} onChange={setLeaseEnd} />
        </View>
      </View>

      {validationError ? (
        <Text variant="caption" color="destructive">
          {validationError}
        </Text>
      ) : null}

      <Button
        label="Save tenancy"
        loading={record.isPending}
        disabled={record.isPending || !tenantName.trim()}
        onPress={submit}
      />
    </View>
  );
}
