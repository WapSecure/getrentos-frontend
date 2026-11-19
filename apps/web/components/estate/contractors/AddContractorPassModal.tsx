'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Checkbox,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Field,
  Input,
  Select,
  TimePicker,
  ToggleChip,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';

// Must match the API's caps.
const OFFICE_MAX_VALIDITY_DAYS = 366;

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
  /** Absent for a household's own regular visitor: the API uses the resident's household. */
  householdId?: string;
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
  /** Office mode only; a household adds to its own unit. */
  estateId?: string;
  /** A resident adding their own regular visitor: no unit to choose, no firm, and a shorter limit. */
  forHousehold?: boolean;
  maxDays?: number;
  onClose: () => void;
  onSubmit: (data: AddContractorPassInput) => void;
  isSubmitting?: boolean;
  error?: string | null;
}

const localDate = (offsetDays: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

// Mirrors the server's normalisation.
const hasFullName = (value: string) => value.trim().split(/\s+/).filter(Boolean).length >= 2;

export const AddContractorPassModal = ({
  isOpen,
  estateId,
  forHousehold = false,
  maxDays = OFFICE_MAX_VALIDITY_DAYS,
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
  const defaultSpan = Math.min(182, maxDays);
  const [validUntil, setValidUntil] = useState(localDate(defaultSpan));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [restrictHours, setRestrictHours] = useState(false);
  const [dailyFrom, setDailyFrom] = useState('08:00');
  const [dailyTo, setDailyTo] = useState('17:00');
  const [localError, setLocalError] = useState<string | null>(null);

  const { data: households } = useQuery({
    queryKey: ['estate', estateId, 'households', 'for-contractor-pass'],
    queryFn: () => unwrap(estateService.listHouseholds(estateId as string, { pageSize: 100 })),
    enabled: isOpen && !!estateId && !forHousehold,
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
    setValidUntil(localDate(defaultSpan));
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
    if (!forHousehold && !householdId) {
      return setLocalError('Choose the household they are working for.');
    }
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
    if (spanDays > maxDays) {
      return setLocalError(
        forHousehold
          ? `That is ${Math.round(spanDays)} days. A regular visitor pass can run for at most ${maxDays}; add a new one when it ends.`
          : `That is ${Math.round(spanDays)} days. An authorisation can run for at most ${maxDays}, so it is looked at again at least once a year.`
      );
    }

    setLocalError(null);
    onSubmit({
      householdId: forHousehold ? undefined : householdId,
      name: name.trim(),
      phone: phone.trim() || undefined,
      company: forHousehold ? undefined : company.trim() || undefined,
      trade: trade.trim() || undefined,
      // The API wants an instant: run to the end of the last day so the permission doesn't lapse that morning.
      validFrom: new Date(`${validFrom}T00:00:00`).toISOString(),
      validUntil: new Date(`${validUntil}T23:59:59`).toISOString(),
      daysOfWeek,
      dailyFrom: restrictHours ? dailyFrom : undefined,
      dailyTo: restrictHours ? dailyTo : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent size="lg">
        <DialogTitle className="pr-8 text-lg font-semibold text-foreground">
          {forHousehold ? 'Add a regular visitor' : 'Authorise a regular visitor'}
        </DialogTitle>
        <DialogDescription className="mt-1 text-sm text-muted-foreground">
          {forHousehold
            ? 'For someone who comes to your home often, like a cleaner or a driver. They use one code on the days you choose, and the estate office is told.'
            : 'For somebody who comes back: a cleaner, a driver, a contractor on site.'}
        </DialogDescription>

        <div className="mt-5 space-y-4">
          {(localError || error) && <Alert variant="danger">{localError ?? error}</Alert>}

          {!forHousehold && (
            <Field
              label="Who are they working for?"
              hint="Every arrival is recorded against this unit, so it is also the one that is told when they turn up."
            >
              <Select
                value={householdId}
                onValueChange={setHouseholdId}
                options={householdOptions}
                searchable
              />
            </Field>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Name">
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Chinedu Okafor"
              />
            </Field>
            <Field label="Phone" optionalLabel="(optional)">
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0803 111 2222"
              />
            </Field>
          </div>

          <div className={forHousehold ? '' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
            {!forHousehold && (
              <Field label="Firm" optionalLabel="(optional)">
                <Input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Zenith Electrical"
                />
              </Field>
            )}
            <Field label={forHousehold ? 'What they do' : 'Trade'} optionalLabel="(optional)">
              <Input
                type="text"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder={forHousehold ? 'e.g. Cleaner' : 'e.g. Electrician'}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="From">
              <DatePicker value={validFrom} onChange={setValidFrom} />
            </Field>
            <Field label="Until">
              <DatePicker value={validUntil} onChange={setValidUntil} min={validFrom} />
            </Field>
          </div>

          <div>
            <p className="block text-sm font-medium text-foreground mb-1">Which days?</p>
            <div role="group" aria-label="Which days?" className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const selected = daysOfWeek.includes(day.value);
                return (
                  <ToggleChip
                    key={day.value}
                    pressed={selected}
                    onPressedChange={() =>
                      setDaysOfWeek((current) =>
                        selected
                          ? current.filter((value) => value !== day.value)
                          : [...current, day.value]
                      )
                    }
                  >
                    {day.short}
                  </ToggleChip>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {daysOfWeek.length === 0
                ? 'Any day. Selecting days restricts admission to them: useful for a cleaner who only comes on Tuesdays.'
                : 'They can only be admitted on the days selected.'}
            </p>
          </div>

          <div>
            <Checkbox
              checked={restrictHours}
              onCheckedChange={setRestrictHours}
              label="Only during certain hours"
            />
            {restrictHours && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <TimePicker value={dailyFrom} onChange={setDailyFrom} ariaLabel="Daily from" />
                <TimePicker value={dailyTo} onChange={setDailyTo} ariaLabel="Daily to" />
              </div>
            )}
            {restrictHours && (
              <p className="text-xs text-muted-foreground mt-1">
                Judged in the estate&apos;s own local time. An end earlier than the start is read as
                crossing midnight, for a night shift.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            The gate code is shown once, after you create this.
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submit}
              isLoading={isSubmitting}
              loadingText="Creating…"
            >
              {forHousehold ? 'Add' : 'Authorise'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
