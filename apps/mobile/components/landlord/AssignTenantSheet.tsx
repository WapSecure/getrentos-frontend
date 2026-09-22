import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi, type LandlordUnit } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  unit: LandlordUnit | null;
}

export function AssignTenantSheet({ open, onClose, unit }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Assign a tenant">
      {/* Remount per unit so the name never carries across. */}
      {unit ? <AssignForm key={unit.id} unit={unit} onClose={onClose} /> : null}
    </Sheet>
  );
}

function AssignForm({ unit, onClose }: { unit: LandlordUnit; onClose: () => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [tenantName, setTenantName] = useState('');

  const assign = useMutation({
    mutationFn: () => landlordApi.assignTenant(unit.id, tenantName.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'units'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'tenants'] });
      toast.show('Tenant assigned.', 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not assign that tenant.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Who is moving into <Text variant="bodyStrong">{unit.unitName}</Text> at {unit.propertyName}?
      </Text>

      <TextField
        label="Tenant name"
        placeholder="e.g. Amaka Obi"
        value={tenantName}
        onChangeText={setTenantName}
      />

      <Button
        label="Assign tenant"
        loading={assign.isPending}
        disabled={!tenantName.trim()}
        onPress={() => assign.mutate()}
      />
    </View>
  );
}
