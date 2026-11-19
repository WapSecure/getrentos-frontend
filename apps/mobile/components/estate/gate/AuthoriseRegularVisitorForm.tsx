import { useState } from 'react';
import { View } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import {
  Button,
  Checkbox,
  Chip,
  DateField,
  FormAlert,
  Text,
  TextField,
  TimeField,
  toISODate,
  useTheme,
} from '@sureground/ui-native';
import { EnterpriseUpsell, OneTimeCode } from '@/components/estate/gate/GateUI';
import { HouseholdPicker } from '@/components/estate/HouseholdPicker';
import {
  WEEK_DAYS,
  contractorDraftError,
  contractorPassBody,
  planRefusal,
  toggleDay,
  type IssuedContractorPass,
  type NewContractorPass,
} from '@/lib/api/estateGate';
import type { Household } from '@/lib/api/estateManager';
import { haptics } from '@/lib/haptics';
import { errorMessage } from '@/lib/api/client';

const UPSELL_POINTS = [
  'Let a cleaner, driver or contractor keep coming back on one code',
  'Limit them to the days and hours you agree',
  'Every arrival still recorded as its own visit',
];

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

/** The office authorises for any unit; a resident (`forHousehold`) adds to their own, with a shorter limit. */
export function AuthoriseRegularVisitorForm({
  estateId,
  estateName,
  forHousehold = false,
  maxDays,
  createPass,
  onCreated,
  onDone,
}: {
  estateId?: string;
  estateName?: string;
  forHousehold?: boolean;
  maxDays?: number;
  createPass: (body: NewContractorPass) => Promise<IssuedContractorPass>;
  onCreated: () => void;
  onDone: () => void;
}) {
  const { spacing } = useTheme();
  const [household, setHousehold] = useState<Household | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [trade, setTrade] = useState('');
  const [validFrom, setValidFrom] = useState(() => addDays(0));
  const [validUntil, setValidUntil] = useState(() => addDays(Math.min(182, maxDays ?? 182)));
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [restrictHours, setRestrictHours] = useState(false);
  const [dailyFrom, setDailyFrom] = useState('08:00');
  const [dailyTo, setDailyTo] = useState('17:00');
  const [issued, setIssued] = useState<IssuedContractorPass | null>(null);

  const draft = {
    householdId: household?.id,
    name,
    phone,
    company,
    trade,
    validFrom,
    validUntil,
    daysOfWeek,
    restrictHours,
    dailyFrom,
    dailyTo,
  };
  const problem = contractorDraftError(draft, { forHousehold, maxDays });

  const create = useMutation({
    mutationFn: () => createPass(contractorPassBody(draft)),
    onSuccess: (pass) => {
      void haptics.success();
      onCreated();
      setIssued(pass);
    },
  });
  const refusal = planRefusal(create.error);

  if (issued) {
    return (
      <OneTimeCode
        title={`Code for ${issued.name}`}
        code={issued.pin}
        qrDataUrl={issued.qrDataUrl}
        notes={[
          issued.scheduleLabel,
          'Shown only now. Send it to them before you close this; it can’t be read back.',
        ]}
        shareMessage={`Your gate code${estateName ? ` for ${estateName}` : ''} is ${issued.pin}. ${issued.scheduleLabel}. Show it at the gate each time you arrive.`}
        onDone={onDone}
      />
    );
  }

  if (refusal && !forHousehold) {
    return (
      <EnterpriseUpsell
        feature="Regular visitors"
        points={UPSELL_POINTS}
        current={refusal.current}
        estateName={estateName}
      />
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {!forHousehold && estateId ? (
        <HouseholdPicker
          estateId={estateId}
          value={household}
          onChange={setHousehold}
          label="Who are they working for"
        />
      ) : (
        <Text variant="caption" color="mutedForeground">
          For someone who comes to your home often, like a cleaner or a driver. They use one code on
          the days you choose, and the estate office is told.
        </Text>
      )}
      <TextField
        label="Full name"
        required
        value={name}
        onChangeText={setName}
        maxLength={120}
        placeholder="e.g. Chinedu Okafor"
      />
      <TextField
        label="Phone (optional)"
        value={phone}
        onChangeText={(v) => setPhone(v.replace(/(?!^\+)\D/g, ''))}
        keyboardType="phone-pad"
        maxLength={30}
        hint="With only a first name, a phone is needed to check them against the watch list"
      />
      {!forHousehold ? (
        <TextField
          label="Firm (optional)"
          value={company}
          onChangeText={setCompany}
          maxLength={120}
        />
      ) : null}
      <TextField
        label={forHousehold ? 'What they do (optional)' : 'Trade (optional)'}
        value={trade}
        onChangeText={setTrade}
        maxLength={80}
        placeholder={forHousehold ? 'e.g. Cleaner' : 'e.g. Electrician'}
      />
      <DateField label="From" value={validFrom} onChange={setValidFrom} min={addDays(0)} />
      <DateField
        label="Until"
        value={validUntil}
        onChange={setValidUntil}
        min={validFrom}
        hint={
          forHousehold
            ? `At most ${maxDays ?? 90} days; add a new one when it ends`
            : 'At most a year, so it gets looked at again'
        }
      />
      <View style={{ gap: spacing.xs }}>
        <Text variant="bodyStrong">Which days</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {WEEK_DAYS.map((d) => (
            <Chip
              key={d.value}
              label={d.short}
              selected={daysOfWeek.includes(d.value)}
              onPress={() => setDaysOfWeek((cur) => toggleDay(cur, d.value))}
            />
          ))}
        </View>
        <Text variant="caption" color="mutedForeground">
          {daysOfWeek.length
            ? 'They can only be let in on the days chosen.'
            : 'Any day. Choose days to limit them, e.g. Tuesdays only.'}
        </Text>
      </View>
      <Checkbox
        checked={restrictHours}
        onChange={setRestrictHours}
        label="Only during certain hours"
      />
      {restrictHours ? (
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TimeField
              label="From"
              value={dailyFrom}
              onChange={setDailyFrom}
              startHour={0}
              endHour={24}
              containerStyle={{ flex: 1 }}
            />
            <TimeField
              label="To"
              value={dailyTo}
              onChange={setDailyTo}
              startHour={0}
              endHour={24}
              containerStyle={{ flex: 1 }}
            />
          </View>
          <Text variant="caption" color="mutedForeground">
            On the estate’s clock. An end earlier than the start runs past midnight, for a night
            shift.
          </Text>
        </View>
      ) : null}
      {create.error ? (
        <FormAlert message={errorMessage(create.error, 'Could not create the authorisation.')} />
      ) : problem && name.trim() && (forHousehold || household) ? (
        <FormAlert tone="warning" message={problem} />
      ) : null}
      <Button
        label={forHousehold ? 'Add' : 'Authorise'}
        disabled={!!problem}
        loading={create.isPending}
        onPress={() => create.mutate()}
      />
      <Text variant="caption" color="mutedForeground" center>
        Their gate code is shown once, after you {forHousehold ? 'add them' : 'authorise'}.
      </Text>
    </View>
  );
}
