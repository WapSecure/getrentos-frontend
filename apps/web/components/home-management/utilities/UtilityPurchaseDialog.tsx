'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FUEL_TYPE_LABELS,
  PAID_BY_LABELS,
  PURCHASE_KIND_LABELS,
  formatCurrency,
  maskMeterNumber,
  pricePerUnit,
  purchaseQuantityUnit,
  type FuelType,
  type UtilityPaidBy,
  type UtilityPurchaseKind,
} from '@sureground/shared';
import {
  Alert,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  SegmentedControl,
  Select,
  Switch,
  Textarea,
  useToast,
} from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import {
  homeManagementService,
  type HomeManagementProperty,
} from '@/services/homeManagementService';
import { utilitiesService } from '@/services/utilitiesService';
import {
  dayToInstant,
  lagosToday,
  optionalPositiveNumber,
  optionalText,
  propertyName,
} from './utilityForm';

interface UtilityPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  properties: HomeManagementProperty[];
  defaultPropertyId?: string;
  /** The kinds this dialog offers; the first is selected. */
  kinds: UtilityPurchaseKind[];
  defaultGeneratorId?: string;
  defaultMeterId?: string;
}

const PAID_BY_ORDER: UtilityPaidBy[] = ['OWNER', 'MANAGER', 'TENANT', 'RESIDENT', 'OTHER'];

/** One form for fuel, tokens, bills and tankers. A token is cut to its last 4 digits as it is typed. */
export function UtilityPurchaseDialog({
  open,
  onOpenChange,
  properties,
  defaultPropertyId,
  kinds,
  defaultGeneratorId,
  defaultMeterId,
}: UtilityPurchaseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent size="xl">
          <PurchaseForm
            properties={properties}
            defaultPropertyId={defaultPropertyId}
            kinds={kinds}
            defaultGeneratorId={defaultGeneratorId}
            defaultMeterId={defaultMeterId}
            onDone={() => onOpenChange(false)}
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

function PurchaseForm({
  properties,
  defaultPropertyId,
  kinds,
  defaultGeneratorId,
  defaultMeterId,
  onDone,
}: Omit<UtilityPurchaseDialogProps, 'open' | 'onOpenChange'> & { onDone: () => void }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [propertyId, setPropertyId] = useState(
    defaultPropertyId || (properties.length === 1 ? properties[0].id : '')
  );
  const [kind, setKind] = useState<UtilityPurchaseKind>(kinds[0]);
  const [day, setDay] = useState(lagosToday());
  const [amount, setAmount] = useState(0);
  const [quantity, setQuantity] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('DIESEL');
  const [generatorId, setGeneratorId] = useState(defaultGeneratorId ?? '');
  const [tankId, setTankId] = useState('');
  const [meterId, setMeterId] = useState(defaultMeterId ?? '');
  const [token, setToken] = useState('');
  const [paidBy, setPaidBy] = useState<UtilityPaidBy>('OWNER');
  const [supplierName, setSupplierName] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [purchasedByName, setPurchasedByName] = useState('');
  const [chargeable, setChargeable] = useState(true);
  const [note, setNote] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);

  const generators = useQuery({
    queryKey: homeManagementKeys.utilities.generators(propertyId),
    queryFn: () => unwrap(utilitiesService.listGenerators(propertyId)),
    enabled: !!propertyId && kind === 'FUEL',
  });
  const tanks = useQuery({
    queryKey: [...homeManagementKeys.assets(propertyId), 'water-stores'],
    queryFn: async () => {
      const kindsToList = ['WATER_TANK', 'BOREHOLE', 'WATER_TREATMENT'] as const;
      const pages = await Promise.all(
        kindsToList.map((utilityKind) =>
          unwrap(homeManagementService.listAssets({ propertyId, utilityKind, pageSize: 50 }))
        )
      );
      return pages.flatMap((page) => page.items);
    },
    enabled: !!propertyId && kind === 'WATER_TANKER',
  });
  const meters = useQuery({
    queryKey: homeManagementKeys.utilities.meters(propertyId),
    queryFn: () => unwrap(utilitiesService.listMeters(propertyId)),
    enabled: !!propertyId && (kind === 'ELECTRICITY_TOKEN' || kind === 'ELECTRICITY_BILL'),
  });
  const vendors = useQuery({
    queryKey: [...homeManagementKeys.vendors, 'property', propertyId],
    queryFn: () => unwrap(homeManagementService.listAssignableVendors(propertyId)),
    enabled: !!propertyId,
  });

  const unit = purchaseQuantityUnit(kind);
  const quantityValue = optionalPositiveNumber(quantity);
  const perUnit = pricePerUnit(amount, quantityValue);
  const eligibleMeters = (meters.data ?? []).filter((meter) =>
    kind === 'ELECTRICITY_TOKEN' ? meter.meterType === 'PREPAID' : meter.meterType !== 'PREPAID'
  );
  const needsMeter = kind === 'ELECTRICITY_TOKEN' || kind === 'ELECTRICITY_BILL';
  const canSubmit = !!propertyId && amount > 0 && (!needsMeter || !!meterId);

  const save = useMutation({
    mutationFn: async () => {
      const purchase = await unwrap(
        utilitiesService.createPurchase({
          propertyId,
          kind,
          occurredAt: dayToInstant(day),
          amount,
          quantity: unit ? quantityValue : undefined,
          fuelType: kind === 'FUEL' ? fuelType : undefined,
          generatorAssetId: kind === 'FUEL' ? generatorId || undefined : undefined,
          tankAssetId: kind === 'WATER_TANKER' ? tankId || undefined : undefined,
          meterId: needsMeter ? meterId : undefined,
          tokenLast4: kind === 'ELECTRICITY_TOKEN' && token.length === 4 ? token : undefined,
          vendorId: vendorId || undefined,
          supplierName: optionalText(supplierName),
          paidBy,
          purchasedByName: optionalText(purchasedByName),
          chargeable,
          note: optionalText(note),
        })
      );
      // The record stands on its own; a receipt that fails to upload is reported, not rolled back.
      if (receipt) {
        try {
          await unwrap(utilitiesService.addPurchaseDocument(purchase.id, receipt));
        } catch {
          toast.error('Saved, but the receipt did not upload. Open the entry to try again.');
        }
      }
      return purchase;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.utilities.all });
      void queryClient.invalidateQueries({ queryKey: homeManagementKeys.timeline() });
      toast.success(`${PURCHASE_KIND_LABELS[kind]} recorded.`);
      onDone();
    },
  });

  const kindTitle: Record<UtilityPurchaseKind, string> = {
    FUEL: 'Log fuel',
    ELECTRICITY_TOKEN: 'Record a token purchase',
    ELECTRICITY_BILL: 'Record an electricity bill',
    WATER_TANKER: 'Record a tanker delivery',
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) save.mutate();
      }}
    >
      <DialogTitle className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        {kindTitle[kind]}
      </DialogTitle>
      <DialogDescription className="mt-1 text-sm text-muted-foreground">
        Record what was bought and what it cost. Attach the receipt so the owner can check it.
      </DialogDescription>

      {kinds.length > 1 && (
        <SegmentedControl
          className="mt-5"
          aria-label="What was bought"
          value={kind}
          onValueChange={(value) => setKind(value)}
          segments={kinds.map((value) => ({ value, label: PURCHASE_KIND_LABELS[value] }))}
        />
      )}

      <div className="mt-6 grid gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Property" required>
            <Select
              ariaLabel="Property"
              value={propertyId}
              onValueChange={(value) => {
                setPropertyId(value);
                setGeneratorId('');
                setTankId('');
                setMeterId('');
                setVendorId('');
              }}
              placeholder="Select a property"
              options={properties.map((property) => ({
                value: property.id,
                label: propertyName(property),
              }))}
            />
          </Field>
          <Field label="Date" required>
            <DatePicker value={day} onChange={setDay} max={lagosToday()} ariaLabel="Date" />
          </Field>
          <Field
            label="Amount paid"
            required
            hint={
              perUnit !== null && unit
                ? `${formatCurrency(perUnit)} per ${unit === 'kWh' ? 'kWh' : 'litre'}`
                : 'Whole naira'
            }
          >
            <CurrencyInput value={amount || ''} onValueChange={setAmount} placeholder="0" />
          </Field>
          {unit && (
            <Field
              label={unit === 'kWh' ? 'Units (kWh)' : 'Litres'}
              hint="Optional, but it shows the price per unit"
            >
              <Input
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value.replace(/[^\d.]/g, ''))}
                placeholder={unit === 'kWh' ? 'e.g. 68.5' : 'e.g. 150'}
              />
            </Field>
          )}

          {kind === 'FUEL' && (
            <>
              <Field label="Fuel" required>
                <Select
                  ariaLabel="Fuel"
                  value={fuelType}
                  onValueChange={(value) => setFuelType(value as FuelType)}
                  options={(Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((value) => ({
                    value,
                    label: FUEL_TYPE_LABELS[value],
                  }))}
                />
              </Field>
              <Field
                label="Generator"
                hint={
                  generators.data && generators.data.length === 0
                    ? 'No generators on this property yet. Add one under Assets with the type Generator.'
                    : 'Optional'
                }
              >
                <Select
                  ariaLabel="Generator"
                  value={generatorId}
                  disabled={!propertyId}
                  onValueChange={setGeneratorId}
                  options={[
                    { value: '', label: 'Not for one generator' },
                    ...(generators.data ?? []).map((generator) => ({
                      value: generator.id,
                      label: generator.name,
                    })),
                  ]}
                />
              </Field>
            </>
          )}

          {needsMeter && (
            <Field
              label="Meter"
              required
              hint={
                meters.data && eligibleMeters.length === 0
                  ? kind === 'ELECTRICITY_TOKEN'
                    ? 'No prepaid meters on this property. Add one under Power.'
                    : 'No postpaid meters on this property. Add one under Power.'
                  : undefined
              }
            >
              <Select
                ariaLabel="Meter"
                value={meterId}
                disabled={!propertyId}
                onValueChange={setMeterId}
                placeholder="Select a meter"
                options={eligibleMeters.map((meter) => ({
                  value: meter.id,
                  label: [meter.label || meter.unit?.name, maskMeterNumber(meter.meterNumberLast4)]
                    .filter(Boolean)
                    .join(', '),
                }))}
              />
            </Field>
          )}

          {kind === 'ELECTRICITY_TOKEN' && (
            <Field
              label="Last 4 digits of the token"
              hint="Only the last 4 digits are kept, so the token cannot be reused from this record."
            >
              <Input
                inputMode="numeric"
                autoComplete="off"
                value={token}
                onChange={(event) => setToken(event.target.value.replace(/\D/g, '').slice(-4))}
                placeholder="e.g. 4821"
              />
            </Field>
          )}

          {kind === 'WATER_TANKER' && (
            <Field label="Delivered to" hint="Optional">
              <Select
                ariaLabel="Tank or borehole"
                value={tankId}
                disabled={!propertyId}
                onValueChange={setTankId}
                options={[
                  { value: '', label: 'Not recorded' },
                  ...(tanks.data ?? []).map((asset) => ({ value: asset.id, label: asset.name })),
                ]}
              />
            </Field>
          )}
        </div>

        <div className="space-y-4">
          <Field label="Paid by" required>
            <Select
              ariaLabel="Paid by"
              value={paidBy}
              onValueChange={(value) => setPaidBy(value as UtilityPaidBy)}
              options={PAID_BY_ORDER.map((value) => ({ value, label: PAID_BY_LABELS[value] }))}
            />
          </Field>
          <Field label="Supplier" hint="Optional, for example the filling station or tanker owner">
            <Input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
          </Field>
          {(vendors.data?.length ?? 0) > 0 && (
            <Field label="Vendor from your list" hint="Optional">
              <Select
                ariaLabel="Vendor"
                value={vendorId}
                onValueChange={setVendorId}
                options={[
                  { value: '', label: 'None' },
                  ...(vendors.data ?? []).map((vendor) => ({
                    value: vendor.id,
                    label: vendor.name,
                  })),
                ]}
              />
            </Field>
          )}
          <Field label="Bought by" hint="Optional, for example the caretaker">
            <Input
              value={purchasedByName}
              onChange={(event) => setPurchasedByName(event.target.value)}
            />
          </Field>
          <Field label="Note">
            <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <Field label="Receipt" hint="A photo or PDF, up to 25MB">
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
            />
          </Field>
          <Switch
            checked={chargeable}
            onCheckedChange={setChargeable}
            label="Counts towards service charge"
            description="Turn off for a cost the owner bears alone."
          />
        </div>
      </div>

      {save.error && (
        <Alert variant="danger" className="mt-5">
          {save.error.message || 'This could not be saved. Check the details and try again.'}
        </Alert>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-border pt-5">
        <Button type="button" variant="outline" rounded="md" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" rounded="md" isLoading={save.isPending} disabled={!canSubmit}>
          Save
        </Button>
      </div>
    </form>
  );
}
