'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  NumberInput,
  Select,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { Lock } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletKeys } from '@/lib/queryKeys';
import { shortletService } from '@/services/shortletService';
import {
  INTERNET_TYPE_LABEL,
  POWER_SOURCE_LABEL,
  WATER_SUPPLY_LABEL,
} from '@/lib/shortlet/essentials';
import type { ShortletListing } from '@/types/shortlet';

type TriState = '' | 'yes' | 'no';
const toTri = (v?: boolean): TriState => (v == null ? '' : v ? 'yes' : 'no');
const fromTri = (v: TriState): boolean | null => (v === '' ? null : v === 'yes');

const RULE_OPTIONS = [
  { value: '', label: 'Not stated' },
  { value: 'yes', label: 'Allowed' },
  { value: 'no', label: 'Not allowed' },
];

const withNotStated = (labels: Record<string, string>) => [
  { value: '', label: 'Not stated' },
  ...Object.entries(labels).map(([value, label]) => ({ value, label })),
];

/**
 * What a guest needs to know before booking: rules, and the honest answer to
 * "will there be light, water and Wi-Fi?". Check-in instructions live here too,
 * but only guests with a confirmed, paid stay ever see them.
 */
export function ShortletEssentialsDialog({
  listing,
  onClose,
}: {
  listing: ShortletListing;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const [houseRules, setHouseRules] = useState(listing.houseRules ?? '');
  const [pets, setPets] = useState<TriState>(toTri(listing.petsAllowed));
  const [smoking, setSmoking] = useState<TriState>(toTri(listing.smokingAllowed));
  const [parties, setParties] = useState<TriState>(toTri(listing.partiesAllowed));
  const [powerSources, setPowerSources] = useState<string[]>(listing.powerSources ?? []);
  const [powerHours, setPowerHours] = useState(listing.powerHoursPerDay?.toString() ?? '');
  const [water, setWater] = useState(listing.waterSupply ?? '');
  const [internet, setInternet] = useState(listing.internetType ?? '');
  const [speed, setSpeed] = useState(listing.internetSpeedMbps?.toString() ?? '');
  const [instructions, setInstructions] = useState(listing.checkInInstructions ?? '');

  const togglePower = (source: string, on: boolean) =>
    setPowerSources((current) => (on ? [...current, source] : current.filter((s) => s !== source)));

  const save = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.updateListing(listing.id, {
          houseRules: houseRules.trim() || null,
          petsAllowed: fromTri(pets),
          smokingAllowed: fromTri(smoking),
          partiesAllowed: fromTri(parties),
          powerSources,
          powerHoursPerDay: powerHours === '' ? null : Number(powerHours),
          waterSupply: water || null,
          internetType: internet || null,
          internetSpeedMbps: speed === '' || internet === 'NONE' ? null : Number(speed),
          checkInInstructions: instructions.trim() || null,
        })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shortletKeys.hostListings });
      queryClient.invalidateQueries({ queryKey: shortletKeys.public });
      setToast({ message: 'Saved.', variant: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message, variant: 'error' }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <div className="p-5">
          <DialogTitle>Rules &amp; essentials · {listing.title}</DialogTitle>
          <DialogDescription>
            Guests decide faster, and complain less, when they know this before they book.
          </DialogDescription>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto border-t border-border p-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">House rules</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Pets">
                <Select
                  value={pets}
                  onValueChange={(v) => setPets(v as TriState)}
                  options={RULE_OPTIONS}
                />
              </Field>
              <Field label="Smoking">
                <Select
                  value={smoking}
                  onValueChange={(v) => setSmoking(v as TriState)}
                  options={RULE_OPTIONS}
                />
              </Field>
              <Field label="Parties & events">
                <Select
                  value={parties}
                  onValueChange={(v) => setParties(v as TriState)}
                  options={RULE_OPTIONS}
                />
              </Field>
            </div>
            <Field label="Anything else" hint="Optional. e.g. quiet hours, visitors, shoes off">
              <Textarea
                value={houseRules}
                onChange={(e) => setHouseRules(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Quiet hours from 10pm. Visitors must be registered at the gate."
              />
            </Field>
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Power</h3>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {Object.entries(POWER_SOURCE_LABEL).map(([value, label]) => (
                <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={powerSources.includes(value)}
                    onCheckedChange={(on) => togglePower(value, on)}
                    aria-label={label}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Field
              label="Hours of power on a typical day"
              hint="Counting backup. 24 means the lights never go off."
            >
              <NumberInput min={0} max={24} value={powerHours} onValueChange={setPowerHours} />
            </Field>
          </section>

          <section className="grid grid-cols-1 gap-3 border-t border-border pt-5 sm:grid-cols-2">
            <Field label="Water">
              <Select
                value={water}
                onValueChange={setWater}
                options={withNotStated(WATER_SUPPLY_LABEL)}
              />
            </Field>
            <Field label="Internet">
              <Select
                value={internet}
                onValueChange={setInternet}
                options={withNotStated(INTERNET_TYPE_LABEL)}
              />
            </Field>
            {internet && internet !== 'NONE' && (
              <Field label="Usual speed (Mbps)" hint="Optional">
                <NumberInput min={1} max={10000} value={speed} onValueChange={setSpeed} />
              </Field>
            )}
          </section>

          <section className="space-y-2 border-t border-border pt-5">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <Lock className="h-3.5 w-3.5" /> Check-in instructions
            </h3>
            <p className="text-xs text-muted-foreground">
              Door or gate codes, where to collect keys, the Wi-Fi password. Only a guest whose stay
              is confirmed and paid can see this, until they check out.
            </p>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Tell the gateman you're staying at Flat 3B. Key box code 4471. Wi-Fi: LekkiLoft / sunshine123"
              aria-label="Check-in instructions"
            />
          </section>

          <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>

        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
