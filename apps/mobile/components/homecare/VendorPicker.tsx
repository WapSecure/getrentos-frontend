import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react-native';
import {
  Button,
  Chip,
  FormAlert,
  Skeleton,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { qk } from '@/lib/query/keys';
import { homeCareApi } from '@/lib/api/homeCare';
import { ApiError } from '@/lib/api/client';
import { Sheet } from '@/components/Sheet';

/** Choose one of your vendors, or add one without leaving the form. */
export function VendorPicker({
  value,
  onChange,
  optional,
  label = 'Vendor',
}: {
  value?: string;
  onChange: (id: string | undefined) => void;
  optional?: boolean;
  label?: string;
}) {
  const { colors, spacing, radius } = useTheme();
  const [adding, setAdding] = useState(false);
  const vendors = useQuery({ queryKey: qk.homeCare.vendors, queryFn: homeCareApi.vendors });
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="callout" color="mutedForeground">
        {label}
        {optional ? ' (optional)' : ''}
      </Text>
      {vendors.isPending ? (
        <Skeleton height={36} radius={radius.md} />
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(vendors.data?.items ?? []).map((v) => (
            <Chip
              key={v.id}
              label={`${v.name} · ${v.serviceType}`}
              size="sm"
              selected={value === v.id}
              onPress={() => onChange(value === v.id && optional ? undefined : v.id)}
            />
          ))}
          <Chip
            label="Add vendor"
            size="sm"
            leadingIcon={<Plus size={14} color={colors.primary} />}
            onPress={() => setAdding(true)}
          />
        </View>
      )}
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add a vendor">
        {adding ? (
          <AddVendor
            onAdded={(id) => {
              onChange(id);
              setAdding(false);
            }}
          />
        ) : null}
      </Sheet>
    </View>
  );
}

function AddVendor({ onAdded }: { onAdded: (id: string) => void }) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [phone, setPhone] = useState('');
  const add = useMutation({
    mutationFn: () =>
      homeCareApi.addVendor({
        name: name.trim(),
        serviceType: serviceType.trim(),
        phone: phone.trim(),
      }),
    onSuccess: (v) => {
      qc.invalidateQueries({ queryKey: qk.homeCare.vendors });
      toast.show(`${v.name} added.`, 'success');
      onAdded(v.id);
    },
  });
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ gap: spacing.md }}>
        <TextField label="Name or business" value={name} onChangeText={setName} />
        <TextField
          label="What they do"
          value={serviceType}
          onChangeText={setServiceType}
          hint="e.g. Plumber, Electrician, AC repair"
        />
        <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        {add.error ? (
          <FormAlert
            message={
              add.error instanceof ApiError ? add.error.message : 'Could not add the vendor.'
            }
          />
        ) : null}
        <Button
          label="Add vendor"
          disabled={!name.trim() || !serviceType.trim() || !phone.trim()}
          loading={add.isPending}
          onPress={() => add.mutate()}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
