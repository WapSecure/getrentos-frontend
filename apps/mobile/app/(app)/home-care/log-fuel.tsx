import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Paperclip } from '@sureground/icons/native';
import {
  FUEL_TYPE_LABELS,
  PAID_BY_LABELS,
  PURCHASE_KIND_LABELS,
  maskMeterNumber,
  pricePerUnit,
  purchaseQuantityUnit,
  type FuelType,
  type UtilityPaidBy,
  type UtilityPurchaseKind,
} from '@sureground/shared';
import {
  Button,
  Chip,
  CurrencyField,
  DateField,
  FormAlert,
  NumberField,
  SegmentedControl,
  SwitchRow,
  Text,
  TextField,
  useTheme,
  useToast,
} from '@sureground/ui-native';
import { qk } from '@/lib/query/keys';
import { dayToInstant, homeUtilitiesApi, lagosToday } from '@/lib/api/homeUtilities';
import { homeCareApi } from '@/lib/api/homeCare';
import { errorMessage } from '@/lib/api/client';
import type { PickedFile } from '@/lib/api/documents';
import { capturePhoto, pickDocument } from '@/lib/filePicker';
import { formatNaira } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { useMyHomes } from '@/hooks/useMyHomes';
import { DetailHeader } from '@/components/dashboard/DetailHeader';
import { goBack } from '@/lib/goBack';

const KINDS: UtilityPurchaseKind[] = [
  'FUEL',
  'ELECTRICITY_TOKEN',
  'ELECTRICITY_BILL',
  'WATER_TANKER',
];
const PAID_BY: UtilityPaidBy[] = ['OWNER', 'MANAGER', 'TENANT', 'OTHER'];

const isKind = (value: unknown): value is UtilityPurchaseKind =>
  typeof value === 'string' && (KINDS as string[]).includes(value);

/**
 * Fuel, a token, a bill or a tanker, logged on site with a photo of the receipt.
 * A token is cut to its last 4 digits as it is typed, so the full token never leaves the phone.
 */
export default function LogPurchase() {
  const params = useLocalSearchParams<{
    kind?: string;
    propertyId?: string;
    generatorId?: string;
    meterId?: string;
  }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const toast = useToast();
  const homes = useMyHomes();
  const [propertyId, setPropertyId] = useState(params.propertyId ?? '');
  const home = propertyId || (homes.data?.length === 1 ? homes.data[0].id : '');
  const [kind, setKind] = useState<UtilityPurchaseKind>(isKind(params.kind) ? params.kind : 'FUEL');
  const [day, setDay] = useState(lagosToday());
  const [amount, setAmount] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('DIESEL');
  const [generatorId, setGeneratorId] = useState(params.generatorId ?? '');
  const [meterId, setMeterId] = useState(params.meterId ?? '');
  const [tankId, setTankId] = useState('');
  const [token, setToken] = useState('');
  const [paidBy, setPaidBy] = useState<UtilityPaidBy>('MANAGER');
  const [supplier, setSupplier] = useState('');
  const [boughtBy, setBoughtBy] = useState('');
  const [chargeable, setChargeable] = useState(true);
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<PickedFile | null>(null);

  const generators = useQuery({
    queryKey: qk.homeCare.generators(home || 'none'),
    queryFn: () => homeUtilitiesApi.generators(home),
    enabled: !!home && kind === 'FUEL',
  });
  const meters = useQuery({
    queryKey: qk.homeCare.meters(home || 'none'),
    queryFn: () => homeUtilitiesApi.meters(home),
    enabled: !!home && (kind === 'ELECTRICITY_TOKEN' || kind === 'ELECTRICITY_BILL'),
  });
  const tanks = useQuery({
    queryKey: [...qk.homeCare.assets(home || 'none'), 'water-tank'],
    queryFn: () => homeCareApi.assets(home, undefined, 'WATER_TANK'),
    enabled: !!home && kind === 'WATER_TANKER',
  });

  const unit = purchaseQuantityUnit(kind);
  const quantityValue = quantity ? Number(quantity) : undefined;
  const perUnit = amount ? pricePerUnit(amount, quantityValue) : null;
  const needsMeter = kind === 'ELECTRICITY_TOKEN' || kind === 'ELECTRICITY_BILL';
  const eligibleMeters = (meters.data ?? []).filter((meter) =>
    kind === 'ELECTRICITY_TOKEN' ? meter.meterType === 'PREPAID' : meter.meterType !== 'PREPAID'
  );
  const ready = !!home && !!amount && amount > 0 && (!needsMeter || !!meterId);

  const save = useMutation({
    mutationFn: async () => {
      const purchase = await homeUtilitiesApi.recordPurchase({
        propertyId: home,
        kind,
        occurredAt: dayToInstant(day),
        amount: amount ?? 0,
        quantity: unit && quantityValue && quantityValue > 0 ? quantityValue : undefined,
        fuelType: kind === 'FUEL' ? fuelType : undefined,
        generatorAssetId: kind === 'FUEL' ? generatorId || undefined : undefined,
        meterId: needsMeter ? meterId : undefined,
        tankAssetId: kind === 'WATER_TANKER' ? tankId || undefined : undefined,
        tokenLast4: kind === 'ELECTRICITY_TOKEN' && token.length === 4 ? token : undefined,
        paidBy,
        supplierName: supplier.trim() || undefined,
        purchasedByName: boughtBy.trim() || undefined,
        chargeable,
        note: note.trim() || undefined,
      });
      let receiptFailed = false;
      if (receipt) {
        try {
          await homeUtilitiesApi.attachReceipt(purchase.id, receipt);
        } catch {
          receiptFailed = true;
        }
      }
      return { receiptFailed };
    },
    onSuccess: ({ receiptFailed }) => {
      void haptics.success();
      void qc.invalidateQueries({ queryKey: qk.homeCare.utilities });
      toast.show(
        receiptFailed
          ? 'Saved, but the receipt did not upload. Try attaching it again from the web.'
          : `${PURCHASE_KIND_LABELS[kind]} recorded.`,
        receiptFailed ? 'error' : 'success'
      );
      goBack();
    },
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <DetailHeader
          eyebrow="Power and water"
          title="Record a purchase"
          subtitle="Take a photo of the receipt so the owner can check it"
          onBack={() => goBack()}
        />

        <SegmentedControl
          accessibilityLabel="What was bought"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'FUEL', label: 'Fuel' },
            { value: 'ELECTRICITY_TOKEN', label: 'Token' },
            { value: 'ELECTRICITY_BILL', label: 'Bill' },
            { value: 'WATER_TANKER', label: 'Tanker' },
          ]}
        />

        {(homes.data?.length ?? 0) > 1 ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="callout" color="mutedForeground">
              Home
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {(homes.data ?? []).map((h) => (
                <Chip
                  key={h.id}
                  label={h.name}
                  size="sm"
                  selected={home === h.id}
                  onPress={() => {
                    setPropertyId(h.id);
                    setGeneratorId('');
                    setMeterId('');
                    setTankId('');
                  }}
                />
              ))}
            </View>
          </View>
        ) : null}

        <CurrencyField
          label="Amount paid"
          required
          value={amount}
          onValueChange={setAmount}
          hint={
            perUnit !== null && unit
              ? `${formatNaira(perUnit)} per ${unit === 'kWh' ? 'kWh' : 'litre'}`
              : 'Whole naira'
          }
        />
        {unit ? (
          <NumberField
            label={unit === 'kWh' ? 'Units' : 'Litres'}
            unit={unit}
            decimals={2}
            value={quantity}
            onValueChange={setQuantity}
            optional
          />
        ) : null}
        <DateField label="Date" value={day} onChange={setDay} max={lagosToday()} />

        {kind === 'FUEL' ? (
          <>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((value) => (
                <Chip
                  key={value}
                  label={FUEL_TYPE_LABELS[value]}
                  selected={fuelType === value}
                  onPress={() => setFuelType(value)}
                />
              ))}
            </View>
            {generators.data?.length ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="callout" color="mutedForeground">
                  Generator
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                  {generators.data.map((generator) => (
                    <Chip
                      key={generator.id}
                      label={generator.name}
                      size="sm"
                      selected={generatorId === generator.id}
                      onPress={() =>
                        setGeneratorId(generatorId === generator.id ? '' : generator.id)
                      }
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {needsMeter ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="callout" color="mutedForeground">
              Meter
            </Text>
            {eligibleMeters.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {eligibleMeters.map((meter) => (
                  <Chip
                    key={meter.id}
                    label={[
                      meter.label || meter.unit?.name,
                      maskMeterNumber(meter.meterNumberLast4),
                    ]
                      .filter(Boolean)
                      .join(', ')}
                    size="sm"
                    selected={meterId === meter.id}
                    onPress={() => setMeterId(meter.id)}
                  />
                ))}
              </View>
            ) : (
              <Text variant="caption" color="mutedForeground">
                {meters.isPending && home
                  ? 'Loading meters'
                  : kind === 'ELECTRICITY_TOKEN'
                    ? 'No prepaid meters on this home yet. The owner or agency adds them.'
                    : 'No postpaid meters on this home yet. The owner or agency adds them.'}
              </Text>
            )}
          </View>
        ) : null}

        {kind === 'ELECTRICITY_TOKEN' ? (
          <TextField
            label="Last 4 digits of the token"
            hint="Only the last 4 digits are kept, so the token cannot be reused."
            keyboardType="number-pad"
            autoComplete="off"
            value={token}
            onChangeText={(value) => setToken(value.replace(/\D/g, '').slice(-4))}
            optional
          />
        ) : null}

        {kind === 'WATER_TANKER' && tanks.data?.items.length ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="callout" color="mutedForeground">
              Delivered to
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {tanks.data.items.map((tank) => (
                <Chip
                  key={tank.id}
                  label={tank.name}
                  size="sm"
                  selected={tankId === tank.id}
                  onPress={() => setTankId(tankId === tank.id ? '' : tank.id)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={{ gap: spacing.xs }}>
          <Text variant="callout" color="mutedForeground">
            Paid by
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {PAID_BY.map((value) => (
              <Chip
                key={value}
                label={PAID_BY_LABELS[value]}
                size="sm"
                selected={paidBy === value}
                onPress={() => setPaidBy(value)}
              />
            ))}
          </View>
        </View>
        <TextField label="Supplier" value={supplier} onChangeText={setSupplier} optional />
        <TextField
          label="Bought by"
          hint="For example the caretaker"
          value={boughtBy}
          onChangeText={setBoughtBy}
          optional
        />
        <TextField label="Note" value={note} onChangeText={setNote} multiline optional />
        <SwitchRow
          label="Counts towards service charge"
          description="Turn off for a cost the owner bears alone."
          value={chargeable}
          onValueChange={setChargeable}
        />

        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" color="mutedForeground">
            Receipt
          </Text>
          {receipt ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Paperclip size={16} color={colors.mutedForeground} />
              <Text variant="callout" style={{ flex: 1 }} numberOfLines={1}>
                {receipt.name}
              </Text>
              <Button label="Remove" variant="ghost" size="sm" onPress={() => setReceipt(null)} />
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button
                label="Take photo"
                variant="outline"
                size="sm"
                icon={<Camera size={16} color={colors.foreground} />}
                onPress={async () => setReceipt((await capturePhoto()) ?? null)}
                style={{ flex: 1 }}
              />
              <Button
                label="Choose file"
                variant="outline"
                size="sm"
                onPress={async () => setReceipt((await pickDocument()) ?? null)}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>

        {save.error ? (
          <FormAlert message={errorMessage(save.error, 'This could not be saved.')} />
        ) : null}
        <Button
          label="Save"
          disabled={!ready}
          loading={save.isPending}
          onPress={() => save.mutate()}
        />
        {!home ? (
          <Text variant="caption" color="mutedForeground">
            Choose the home first.
          </Text>
        ) : null}
        <Button
          label="Cancel"
          variant="ghost"
          onPress={() => (router.canGoBack() ? router.back() : goBack())}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
