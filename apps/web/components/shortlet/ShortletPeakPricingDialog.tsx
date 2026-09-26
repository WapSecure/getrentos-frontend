'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  NumberInput,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { PartyPopper, Trash2 } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { shortletKeys } from '@/lib/queryKeys';
import { shortletService } from '@/services/shortletService';
import { formatCurrency, formatDate } from '@/lib/format';
import type { ShortletListing, ShortletSeason } from '@/types/shortlet';

const TODAY = new Date().toISOString().slice(0, 10);

/** Dec 20 to Jan 3: the Detty December peak, when diaspora guests fly home. */
function dettyDecemberDates() {
  const year = new Date().getFullYear();
  return { startDate: `${year}-12-20`, endDate: `${year + 1}-01-03` };
}

const toNum = (v: string) => (v.trim() === '' ? 0 : Number(v));

/**
 * Peak-season tools for one listing: discounts for long and last-minute stays,
 * notice and turnover days, and seasons with their own rate and minimum stay.
 */
export function ShortletPeakPricingDialog({
  listing,
  onClose,
}: {
  listing: ShortletListing;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const perNight = listing.pricingMode === 'PER_NIGHT';
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);

  const [weekly, setWeekly] = useState(String(listing.weeklyDiscountPct || ''));
  const [monthly, setMonthly] = useState(String(listing.monthlyDiscountPct || ''));
  const [lastMinute, setLastMinute] = useState(String(listing.lastMinuteDiscountPct || ''));
  const [lastMinuteDays, setLastMinuteDays] = useState(String(listing.lastMinuteDays || 3));
  const [notice, setNotice] = useState(String(listing.advanceNoticeDays || ''));
  const [prep, setPrep] = useState(String(listing.prepDays || ''));

  const [seasonName, setSeasonName] = useState('');
  const [seasonStart, setSeasonStart] = useState('');
  const [seasonEnd, setSeasonEnd] = useState('');
  const [seasonRate, setSeasonRate] = useState('');
  const [seasonMin, setSeasonMin] = useState('');

  const { data: seasons, isLoading: seasonsLoading } = useQuery({
    queryKey: shortletKeys.hostSeasons(listing.id),
    queryFn: () => unwrap(shortletService.listSeasons(listing.id)),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: shortletKeys.hostSeasons(listing.id) });
    queryClient.invalidateQueries({ queryKey: shortletKeys.hostListings });
    queryClient.invalidateQueries({ queryKey: shortletKeys.public });
  };

  const saveRules = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.updateListing(listing.id, {
          weeklyDiscountPct: toNum(weekly),
          monthlyDiscountPct: toNum(monthly),
          lastMinuteDiscountPct: toNum(lastMinute),
          lastMinuteDays: Math.max(1, toNum(lastMinuteDays)),
          advanceNoticeDays: toNum(notice),
          prepDays: toNum(prep),
        })
      ),
    onSuccess: () => {
      refresh();
      setToast({ message: 'Pricing rules saved.', variant: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message, variant: 'error' }),
  });

  const addSeason = useMutation({
    mutationFn: () =>
      unwrap(
        shortletService.createSeason(listing.id, {
          name: seasonName.trim(),
          startDate: seasonStart,
          endDate: seasonEnd,
          nightlyRate: perNight && seasonRate ? Number(seasonRate) : undefined,
          minNights: seasonMin ? Number(seasonMin) : undefined,
        })
      ),
    onSuccess: () => {
      setSeasonName('');
      setSeasonStart('');
      setSeasonEnd('');
      setSeasonRate('');
      setSeasonMin('');
      refresh();
      setToast({ message: 'Season added.', variant: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message, variant: 'error' }),
  });

  const removeSeason = useMutation({
    mutationFn: (id: string) => unwrap(shortletService.deleteSeason(id)),
    onSuccess: () => {
      refresh();
      setToast({ message: 'Season deleted.', variant: 'success' });
    },
    onError: (e: Error) => setToast({ message: e.message, variant: 'error' }),
  });

  const fillDettyDecember = () => {
    const dates = dettyDecemberDates();
    setSeasonName('Detty December');
    setSeasonStart(dates.startDate);
    setSeasonEnd(dates.endDate);
    if (!seasonMin) setSeasonMin('5');
  };

  const submitSeason = () => {
    if (!seasonName.trim()) return setToast({ message: 'Name the season.', variant: 'error' });
    if (!seasonStart || !seasonEnd) {
      return setToast({ message: 'Pick the first and last night.', variant: 'error' });
    }
    if (!(perNight && seasonRate) && !seasonMin) {
      return setToast({
        message: perNight
          ? 'Give the season a nightly rate, a minimum stay, or both.'
          : 'Give the season a minimum stay.',
        variant: 'error',
      });
    }
    addSeason.mutate();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <div className="p-5">
          <DialogTitle>Pricing &amp; seasons · {listing.title}</DialogTitle>
          <DialogDescription>
            Charge more for peak dates, reward longer stays, and keep time to turn the place around.
            Stays already booked keep the price they were booked at.
          </DialogDescription>
        </div>

        <div className="max-h-[70vh] space-y-6 overflow-y-auto border-t border-border p-5">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Seasons</h3>
              <Button variant="outline" size="sm" onClick={fillDettyDecember}>
                <PartyPopper className="mr-1.5 h-4 w-4" /> Detty December preset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {perNight
                ? 'Nights inside a season use its rate. Any stay that includes a season night must meet its minimum stay.'
                : 'This listing has one flat price per stay, so a season can only set a minimum stay.'}
            </p>

            {seasonsLoading ? (
              <p className="text-sm text-muted-foreground">Loading seasons…</p>
            ) : (seasons ?? []).length > 0 ? (
              <div className="space-y-2">
                {(seasons ?? []).map((s: ShortletSeason) => {
                  const past = s.endDate < TODAY;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{s.name}</span>
                          {past && <Badge variant="neutral">Ended</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Nights of {formatDate(s.startDate, 'short')} to{' '}
                          {formatDate(s.endDate, 'short')}
                          {s.nightlyRate != null ? ` · ${formatCurrency(s.nightlyRate)}/night` : ''}
                          {s.minNights != null ? ` · min ${s.minNights} nights` : ''}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Delete ${s.name}`}
                        onClick={() => removeSeason.mutate(s.id)}
                        disabled={removeSeason.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No seasons yet.</p>
            )}

            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <Field label="Season name">
                <Input
                  value={seasonName}
                  onChange={(e) => setSeasonName(e.target.value)}
                  placeholder="e.g. Detty December"
                  maxLength={60}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="First night">
                  <DatePicker
                    value={seasonStart}
                    onChange={setSeasonStart}
                    min={TODAY}
                    placeholder="Select date"
                  />
                </Field>
                <Field label="Last night">
                  <DatePicker
                    value={seasonEnd}
                    onChange={setSeasonEnd}
                    min={seasonStart || TODAY}
                    placeholder="Select date"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {perNight && (
                  <Field label="Nightly rate" hint="Blank = normal rate">
                    <CurrencyInput
                      prefix="₦"
                      value={seasonRate}
                      onValueChange={(v) => setSeasonRate(v === 0 ? '' : String(v))}
                    />
                  </Field>
                )}
                <Field label="Minimum stay (nights)" hint="Blank = listing minimum">
                  <NumberInput min={1} max={90} value={seasonMin} onValueChange={setSeasonMin} />
                </Field>
              </div>
              <Button className="w-full" onClick={submitSeason} disabled={addSeason.isPending}>
                {addSeason.isPending ? 'Adding…' : 'Add season'}
              </Button>
            </div>
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Discounts</h3>
            <p className="text-xs text-muted-foreground">
              {perNight
                ? 'Taken off the nights, never the cleaning fee. Discounts don’t stack: a guest gets only the biggest one they qualify for.'
                : 'Discounts only apply to per-night pricing. Switch this listing to per night to use them.'}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Weekly (7+ nights) %">
                <NumberInput min={0} max={90} value={weekly} onValueChange={setWeekly} />
              </Field>
              <Field label="Monthly (28+ nights) %">
                <NumberInput min={0} max={90} value={monthly} onValueChange={setMonthly} />
              </Field>
              <Field label="Last-minute %">
                <NumberInput min={0} max={90} value={lastMinute} onValueChange={setLastMinute} />
              </Field>
              <Field label="Last-minute means within (days)">
                <NumberInput
                  min={1}
                  max={30}
                  value={lastMinuteDays}
                  onValueChange={setLastMinuteDays}
                />
              </Field>
            </div>
          </section>

          <section className="space-y-3 border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Availability</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Notice before check-in (days)" hint="0 = same-day bookings">
                <NumberInput min={0} max={30} value={notice} onValueChange={setNotice} />
              </Field>
              <Field label="Prep time (days)" hint="Kept free before and after each stay">
                <NumberInput min={0} max={7} value={prep} onValueChange={setPrep} />
              </Field>
            </div>
            <Button
              className="w-full"
              onClick={() => saveRules.mutate()}
              disabled={saveRules.isPending}
            >
              {saveRules.isPending ? 'Saving…' : 'Save discounts & availability'}
            </Button>
          </section>
        </div>

        {toast && (
          <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
