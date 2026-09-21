import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TriangleAlert } from 'lucide-react-native';
import { Button, DateField, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi, type LandlordLease, type RenewalCheck } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatNaira } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  lease: LandlordLease | null;
}

export function RenewLeaseSheet({ open, onClose, lease }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Renew this lease">
      {lease ? <RenewForm key={lease.id} lease={lease} onClose={onClose} /> : null}
    </Sheet>
  );
}

function RenewForm({ lease, onClose }: { lease: LandlordLease; onClose: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [rentAmount, setRentAmount] = useState(String(lease.rentAmount));
  const [leaseEnd, setLeaseEnd] = useState('');
  const [check, setCheck] = useState<RenewalCheck | null>(null);

  const amount = Number(rentAmount);
  const increase =
    lease.rentAmount > 0 ? Math.round(((amount - lease.rentAmount) / lease.rentAmount) * 100) : 0;

  /**
   * The API owns the rent-increase advisory, so ask it rather than deciding
   * locally what counts as too steep.
   */
  const preview = useMutation({
    mutationFn: () => landlordApi.renewalCheck(lease.id, amount),
    onSuccess: setCheck,
    onError: () => setCheck(null),
  });

  const renew = useMutation({
    mutationFn: () => landlordApi.renewLease(lease.id, amount, leaseEnd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      toast.show('Renewal offer sent.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not send that renewal.', 'error'),
  });

  const valid = amount > 0 && leaseEnd;

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        {lease.tenantName} currently pays {formatNaira(lease.rentAmount)}.
      </Text>

      <TextField
        label="New rent (₦)"
        keyboardType="number-pad"
        value={rentAmount}
        onChangeText={(v) => {
          setRentAmount(v.replace(/\D/g, ''));
          setCheck(null);
        }}
        onBlur={() => {
          if (amount > 0) preview.mutate();
        }}
        hint={
          amount > 0 && amount !== lease.rentAmount
            ? `${increase > 0 ? '+' : ''}${increase}% on the current rent`
            : undefined
        }
      />

      {check?.message ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.warning + '1f',
          }}
        >
          <TriangleAlert size={15} color={colors.warning} />
          <Text variant="caption" style={{ flex: 1, color: colors.warning }}>
            {check.message}
          </Text>
        </View>
      ) : null}

      <DateField
        label="New end date"
        value={leaseEnd}
        onChange={setLeaseEnd}
        min={lease.leaseEnd}
      />

      <Button
        label="Send renewal offer"
        loading={renew.isPending}
        disabled={!valid}
        onPress={() => renew.mutate()}
      />
    </View>
  );
}
