import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { SignaturePad } from '@/components/SignaturePad';
import { landlordApi, type LandlordLease } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';
import { formatDate, formatNaira } from '@/lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  lease: LandlordLease | null;
}

export function SignLeaseSheet({ open, onClose, lease }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Sign this lease">
      {/* Remount per lease so a signature never carries across tenancies. */}
      {lease ? <SignForm key={lease.id} lease={lease} onClose={onClose} /> : null}
    </Sheet>
  );
}

function SignForm({ lease, onClose }: { lease: LandlordLease; onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [signature, setSignature] = useState<string | null>(null);

  const sign = useMutation({
    mutationFn: () => landlordApi.signLease(lease.id, signature ?? ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'leases'] });
      toast.show('Lease signed.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not sign that lease.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        {lease.tenantName} · {lease.propertyName}
        {'\n'}
        {formatDate(lease.leaseStart, 'short')} – {formatDate(lease.leaseEnd, 'short')} ·{' '}
        {formatNaira(lease.rentAmount)}
      </Text>

      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Sign below
        </Text>
        <SignaturePad onChange={setSignature} />
      </View>

      <Button
        label="Sign lease"
        loading={sign.isPending}
        disabled={!signature}
        onPress={() => sign.mutate()}
      />
    </View>
  );
}
