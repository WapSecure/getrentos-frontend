'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button, LegacyInput, Select } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';

/** The API's cap. Kept in step so the form never allows what the server will reject. */
const MAX_VALIDITY_DAYS = 366;

const DAYS = [
  { value: 1, short: 'Mon' },
  { value: 2, short: 'Tue' },
  { value: 3, short: 'Wed' },
  { value: 4, short: 'Thu' },
  { value: 5, short: 'Fri' },
  { value: 6, short: 'Sat' },
  { value: 0, short: 'Sun' },
];

export interface AddContractorPassInput {
  householdId: string;
  name: string;
  phone?: string;
  company?: string;
  trade?: string;
  validFrom: string;
  validUntil: string;
  daysOfWeek: number[];
  dailyFrom?: string;
  dailyTo?: string;
}

interface AddContractorPassModalProps {
  isOpen: boolean;
  estateId: string;
  onClose: () => void;
  onSubmit: (data: AddContractorPassInput) => void;
  isSubmitting?: boolean;
  /** The API's own wording. For a Free estate this is the Enterprise upsell. */
  error?: string | null;
}

const localDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

/** Same normalisation idea as the server's: is there more than one name word? */
const hasFullName = (value: string) => value.trim().split(/\s+/).filter(Boolean).length >= 2;

/**
 * Authorises somebody to arrive repeatedly.
 *
 * The form refuses two things before the request is made, because the API
 * refuses them too and a round trip teaches the manager nothing:
 *
 *  - A single name word with no phone. There is nothing to screen them against,
 *    and an authorisation the gate cannot check is one it cannot enforce.
 *  - A window with one end, or a span past a year. Both are the server's rules;
 *    saying so here means the manager is told why rather than just "no".
 *
 * The Enterprise refusal is shown from the API's own message, because that
 * message names the tier — and this modal is the moment an estate finds out the
 * feature is paid for.
 */
export const AddContractorPassModal = ({
  isOpen,
  estateId,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: AddContractorPassModalProps) => {
  const [householdId, setHouseholdId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [trade, setTrade] = useState('');
  const [validFrom, setValidFrom] = useState(localDate(0));
  const [validUntil, setValidUntil] = useState(localDate(182));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [restrictHours, setRestrictHours] = useState(false);
  const [dailyFrom, setDailyFrom] = useState('08:00');
  const [dailyTo, setDailyTo] = useState('17:00');
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: households } = useQuery({
    queryKey: ['estate', estateId, 'households', 'for-contractor-pass'],
    queryFn: () => unwrap(estateService.listHouseholds(estateId, { pageSize: 100 })),
    enabled: isOpen && !!estateId,
  });

  const householdOptions = (households?.items ?? []).map((household) => ({
    value: household.id,
    label: household.unitLabel,
  }));

  const reset = () => {
    setHouseholdId('');
    setName('');
    setPhone('');
    setCompany('');
    setTrade('');
    setValidFrom(localDate(0));
    setValidUntil(localDate(182));
    setDaysOfWeek([]);
    setRestrictHours(false);
    setDailyFrom('08:00');
    setDailyTo('17:00');
    setLocalError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const submit = () => {
    if (!householdId) return setLocalError('Choose the household they are working for.');
    if (!name.trim()) return setLocalError('Enter their name.');
    if (!hasFullName(name) && !phone.trim()) {
      return setLocalError(
        'Add a surname or a phone number. With only one name word there is nothing to check them against, so the estate would be relying on a rule that can never fire.'
      );
    }
    const spanDays =
      (new Date(`${validUntil}T00:00:00`).getTime() - new Date(`${validFrom}T00:00:00`).getTime()) /
      86_400_000;
    if (!(spanDays > 0)) return setLocalError('The authorisation has to end after it starts.');
    if (spanDays > MAX_VALIDITY_DAYS) {
      return setLocalError(
        `That is ${Math.round(spanDays)} days. An authorisation can run for at most ${MAX_VALIDITY_DAYS}, so it is looked at again at least once a year.`
      );
    }

    setLocalError(null);
    onSubmit({
      householdId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      trade: trade.trim() || undefined,
      // A date input is a calendar day; the API wants an instant. Midnight to
      // the end of the last day, so a permission does not lapse the morning it
      // was set to run until.
      validFrom: new Date(`${validFrom}T00:00:00`).toISOString(),
      validUntil: new Date(`${validUntil}T23:59:59`).toISOString(),
      daysOfWeek,
      dailyFrom: restrictHours ? dailyFrom : undefined,
      dailyTo: restrictHours ? dailyTo : undefined,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Authorise a regular visitor
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  For somebody who comes back — a cleaner, a driver, a contractor on site.
                </p>
              </div>
              <button onClick={handleClose} aria-label="Close" className="text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {(localError || error) && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{localError ?? error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Who are they working for?
                </label>
                <Select
                  value={householdId}
                  onValueChange={setHouseholdId}
                  options={householdOptions}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Every arrival is recorded against this unit, so it is also the one that is told
                  when they turn up.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Name</label>
                  <LegacyInput
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chinedu Okafor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Phone <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <LegacyInput
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0803 111 2222"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Firm <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <LegacyInput
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Zenith Electrical"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Trade <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <LegacyInput
                    type="text"
                    value={trade}
                    onChange={(e) => setTrade(e.target.value)}
                    placeholder="e.g. Electrician"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">From</label>
                  <LegacyInput
                    type="date"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Until</label>
                  <LegacyInput
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Which days?
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map((day) => {
                    const selected = daysOfWeek.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          setDaysOfWeek((current) =>
                            selected
                              ? current.filter((value) => value !== day.value)
                              : [...current, day.value]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm border ${
                          selected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border text-muted-foreground'
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {daysOfWeek.length === 0
                    ? 'Any day. Selecting days restricts admission to them — useful for a cleaner who only comes on Tuesdays.'
                    : 'They can only be admitted on the days selected.'}
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={restrictHours}
                    onChange={(e) => setRestrictHours(e.target.checked)}
                  />
                  Only during certain hours
                </label>
                {restrictHours && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <LegacyInput
                      type="time"
                      value={dailyFrom}
                      onChange={(e) => setDailyFrom(e.target.value)}
                    />
                    <LegacyInput
                      type="time"
                      value={dailyTo}
                      onChange={(e) => setDailyTo(e.target.value)}
                    />
                  </div>
                )}
                {restrictHours && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Judged in the estate&apos;s own local time. An end earlier than the start is
                    read as crossing midnight, for a night shift.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 p-5 border-t border-border">
              <p className="text-xs text-muted-foreground">
                The gate code is shown once, after you create this.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={submit} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Authorise'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
