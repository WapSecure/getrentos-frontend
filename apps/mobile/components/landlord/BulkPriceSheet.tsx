import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react-native';
import { Button, Text, TextField, useTheme, useToast } from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { landlordApi, type LandlordUnit } from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
  units: LandlordUnit[];
}

export function BulkPriceSheet({ open, onClose, units }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Set rent for several units">
      <BulkPriceForm key={open ? 'open' : 'closed'} units={units} onClose={onClose} />
    </Sheet>
  );
}

function BulkPriceForm({ units, onClose }: { units: LandlordUnit[]; onClose: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [rent, setRent] = useState('');

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const save = useMutation({
    mutationFn: () => landlordApi.bulkUpdatePricing(selected, Number(rent), 'year'),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['landlord', 'units'] });
      qc.invalidateQueries({ queryKey: ['landlord', 'properties'] });
      toast.show(`Updated ${r.updated} unit${r.updated === 1 ? '' : 's'}.`, 'success');
      onClose();
    },
    onError: (e) =>
      toast.show(e instanceof ApiError ? e.message : 'Could not update those prices.', 'error'),
  });

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        {units.map((u) => {
          const on = selected.includes(u.id);
          return (
            <Pressable
              key={u.id}
              onPress={() => toggle(u.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1.5,
                borderColor: on ? colors.primary : colors.border,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: on ? colors.primary : 'transparent',
                  borderWidth: on ? 0 : 1.5,
                  borderColor: colors.border,
                }}
              >
                {on ? <Check size={13} color={colors.primaryForeground} /> : null}
              </View>
              <Text variant="callout" style={{ flex: 1 }}>
                {u.unitName}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        label="New rent per year (₦)"
        keyboardType="number-pad"
        value={rent}
        onChangeText={(v) => setRent(v.replace(/\D/g, ''))}
      />

      <Button
        label={selected.length > 1 ? `Update ${selected.length} units` : 'Update rent'}
        loading={save.isPending}
        disabled={selected.length === 0 || Number(rent) < 1}
        onPress={() => save.mutate()}
      />
    </View>
  );
}
