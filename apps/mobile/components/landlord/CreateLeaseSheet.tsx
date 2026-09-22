import { useState } from 'react';
import { Switch, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
  Skeleton,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { ChipSelect } from '@/components/landlord/ChipSelect';
import { qk } from '@/lib/query/keys';
import { landlordApi } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CreateLeaseSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="New lease">
      {/* Remount per open so a dismissed draft never reappears. */}
      <CreateLeaseForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

const digits = (v: string) => v.replace(/\D/g, '');

/** One year on from a yyyy-MM-dd date — the usual Nigerian tenancy term. */
function yearAfter(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y + 1, m - 1, d));
}

function CreateLeaseForm({ onClose }: { onClose: () => void }) {
  const { spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const vacant = useQuery({ queryKey: qk.landlord.vacantUnits, queryFn: landlordApi.vacantUnits });
  const units = vacant.data ?? [];

  const today = toISODate(new Date());
  const [unitId, setUnitId] = useState<string | undefined>();
  const [tenantName, setTenantName] = useState('');
  const [leaseStart, setLeaseStart] = useState(today);
  const [leaseEnd, setLeaseEnd] = useState(yearAfter(today));
  const [rent, setRent] = useState('');
  const [deposit, setDeposit] = useState('');
  const [sendNow, setSendNow] = useState(true);

  const chooseUnit = (id: string) => {
    setUnitId(id);
    const u = units.find((x) => x.id === id);
    if (u && !rent && u.askingRent) setRent(String(u.askingRent));
  };

  const create = useMutation({
    mutationFn: () =>
      landlordApi.createLease({
        unitId: unitId!,
        tenantName: tenantName.trim(),
        leaseStart,
        leaseEnd,
        rentAmount: Number(rent),
        rentPeriod: 'year',
        securityDeposit: deposit ? Number(deposit) : undefined,
        sendImmediately: sendNow,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      toast.show(sendNow ? 'Lease sent to the tenant.' : 'Lease saved as a draft.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not create that lease.', 'error'),
  });

  const valid =
    unitId && tenantName.trim() && Number(rent) > 0 && leaseStart && leaseEnd > leaseStart;

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
          emptyText="No vacant units to lease right now."
        />
      )}

      <TextField
        label="Tenant name"
        placeholder="e.g. Amaka Obi"
        value={tenantName}
        onChangeText={setTenantName}
      />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <DateField
            label="Starts"
            value={leaseStart}
            onChange={(v) => {
              setLeaseStart(v);
              // Keep the term sensible when the start moves past the end.
              if (leaseEnd <= v) setLeaseEnd(yearAfter(v));
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label="Ends" value={leaseEnd} onChange={setLeaseEnd} min={leaseStart} />
        </View>
      </View>

      <TextField
        label="Rent per year (₦)"
        keyboardType="number-pad"
        value={rent}
        onChangeText={(v) => setRent(digits(v))}
      />
      <TextField
        label="Security deposit (₦, optional)"
        keyboardType="number-pad"
        value={deposit}
        onChangeText={(v) => setDeposit(digits(v))}
      />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text variant="callout">Send to the tenant now</Text>
          <Text variant="caption" color="mutedForeground">
            Off saves a draft you can send later.
          </Text>
        </View>
        <Switch value={sendNow} onValueChange={setSendNow} accessibilityLabel="Send now" />
      </View>

      <Button
        label={sendNow ? 'Create and send' : 'Save draft'}
        loading={create.isPending}
        disabled={!valid}
        onPress={() => create.mutate()}
      />
    </View>
  );
}
