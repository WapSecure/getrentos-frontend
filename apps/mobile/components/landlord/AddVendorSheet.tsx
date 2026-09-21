import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** The trades a landlord calls most, offered as one-tap fills. */
const SERVICE_TYPES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Painting',
  'Carpentry',
  'Security',
  'General',
];

export function AddVendorSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Add a vendor">
      {/* Remount per open so a dismissed draft never reappears. */}
      <AddVendorForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function AddVendorForm({ onClose }: { onClose: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [phone, setPhone] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      landlordApi.createVendor({
        name: name.trim(),
        serviceType: serviceType.trim(),
        phone: phone.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord', 'vendors'] });
      toast.show('Vendor added.', 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not add that vendor.', 'error'),
  });

  const valid = name.trim() && serviceType.trim() && phone.trim();

  return (
    <View style={{ gap: spacing.lg }}>
      <Text variant="body" color="mutedForeground">
        Vendors you add here can be assigned to maintenance requests.
      </Text>

      <TextField
        label="Name"
        placeholder="e.g. Tunde Plumbing Works"
        value={name}
        onChangeText={setName}
      />

      <View style={{ gap: spacing.sm }}>
        <TextField
          label="Service type"
          placeholder="e.g. Plumbing"
          value={serviceType}
          onChangeText={setServiceType}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {SERVICE_TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setServiceType(t)}
              accessibilityRole="button"
              accessibilityLabel={`Use ${t}`}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: 7,
                borderRadius: radius.full,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text variant="caption" color="mutedForeground">
                {t}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <TextField
        label="Phone"
        placeholder="+234 801 234 5678"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <Button
        label="Add vendor"
        loading={mutation.isPending}
        disabled={!valid}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
