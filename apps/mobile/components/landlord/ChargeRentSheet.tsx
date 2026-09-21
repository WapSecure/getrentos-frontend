import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  DateField,
  Text,
  TextField,
  toISODate,
  useTheme,
  useToast,
} from '@getrentos/ui-native';
import { Sheet } from '@/components/Sheet';
import { qk } from '@/lib/query/keys';
import {
  landlordApi,
  BILLING_CYCLES,
  BILLING_CYCLE_LABEL,
  CHARGE_CATEGORIES,
  CHARGE_CATEGORY_LABEL,
  type BillingCycle,
  type ChargeCategory,
} from '@/lib/api/landlord';
import { ApiError } from '@/lib/api/client';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ChargeRentSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="Raise a charge">
      {/* Remount per open so a dismissed draft never reappears. */}
      <ChargeForm key={open ? 'open' : 'closed'} onClose={onClose} />
    </Sheet>
  );
}

function ChargeForm({ onClose }: { onClose: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const qc = useQueryClient();
  const toast = useToast();

  const properties = useQuery({
    queryKey: qk.landlord.properties(),
    queryFn: () => landlordApi.properties(),
  });

  const [propertyId, setPropertyId] = useState('');
  const units = useQuery({
    queryKey: qk.landlord.units(propertyId),
    queryFn: () => landlordApi.units(propertyId),
    enabled: !!propertyId,
  });

  // A charge can target several units at once, so selection is a set.
  const [unitIds, setUnitIds] = useState<string[]>([]);
  const [category, setCategory] = useState<ChargeCategory>('RENT');
  const [cycle, setCycle] = useState<BillingCycle>('MONTHLY');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(toISODate(new Date()));

  const toggleUnit = (id: string) =>
    setUnitIds((prev) => (prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]));

  const mutation = useMutation({
    mutationFn: () => {
      const base = {
        category,
        amount: Number(amount),
        dueDate,
        billingCycle: cycle,
      };
      // One unit uses the single endpoint; several use bulk.
      return unitIds.length === 1
        ? landlordApi.charge({ ...base, unitId: unitIds[0] })
        : landlordApi.bulkCharge({ ...base, unitIds });
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['landlord', 'payments'] });
      toast.show(`Raised ${r.created} charge${r.created === 1 ? '' : 's'}.`, 'success');
      onClose();
    },
    onError: (err) =>
      toast.show(err instanceof ApiError ? err.message : 'Could not raise that charge.', 'error'),
  });

  const valid = unitIds.length > 0 && Number(amount) > 0 && dueDate;

  const Chip = ({
    label,
    selected,
    onPress,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: radius.full,
        borderWidth: 1.5,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary + '14' : 'transparent',
      }}
    >
      <Text
        variant="caption"
        numberOfLines={1}
        style={{ color: selected ? colors.primary : colors.mutedForeground }}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Property
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {(properties.data?.items ?? []).map((p) => (
            <Chip
              key={p.id}
              label={p.name}
              selected={p.id === propertyId}
              onPress={() => {
                setPropertyId(p.id);
                setUnitIds([]);
              }}
            />
          ))}
        </View>
      </View>

      {propertyId ? (
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
            Units {unitIds.length > 0 ? `(${unitIds.length} selected)` : ''}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {(units.data?.items ?? []).map((u) => (
              <Chip
                key={u.id}
                label={u.unitName}
                selected={unitIds.includes(u.id)}
                onPress={() => toggleUnit(u.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Category
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {CHARGE_CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={CHARGE_CATEGORY_LABEL[c]}
              selected={c === category}
              onPress={() => setCategory(c)}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text variant="callout" color="mutedForeground" style={{ marginLeft: 4 }}>
          Billing cycle
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {BILLING_CYCLES.map((c) => (
            <Chip
              key={c}
              label={BILLING_CYCLE_LABEL[c]}
              selected={c === cycle}
              onPress={() => setCycle(c)}
            />
          ))}
        </View>
      </View>

      <TextField
        label="Amount (₦)"
        placeholder="200000"
        keyboardType="number-pad"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/\D/g, ''))}
      />

      <DateField label="Due date" value={dueDate} onChange={setDueDate} />

      <Button
        label={unitIds.length > 1 ? `Charge ${unitIds.length} units` : 'Raise charge'}
        loading={mutation.isPending}
        disabled={!valid}
        onPress={() => mutation.mutate()}
      />
    </View>
  );
}
