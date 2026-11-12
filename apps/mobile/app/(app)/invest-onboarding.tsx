import { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ShieldCheck } from '@sureground/icons/native';
import {
  Button,
  Card,
  Checkbox,
  DetailSkeleton,
  FormAlert,
  Progress,
  QueryState,
  RadioGroup,
  Text,
  useTheme,
} from '@sureground/ui-native';
import {
  BUDGET_BAND_LABELS,
  BUDGET_BANDS,
  COUNTRIES,
  CURRENCY_LABELS,
  DISPLAY_CURRENCIES,
  HORIZON_LABELS,
  INTENDED_USE_LABELS,
  INTENDED_USES,
  INVESTMENT_HORIZONS,
  INVESTOR_PROPERTY_TYPES,
  OWNERSHIP_LABELS,
  OWNERSHIP_STRUCTURES,
  PROPERTY_TYPE_LABELS,
  isValidTimeZone,
  type BudgetBand,
  type DisplayCurrency,
  type IntendedUse,
  type InvestmentHorizon,
  type InvestorProfile,
  type InvestorProfileField,
  type InvestorProfileInput,
  type InvestorPropertyType,
  type OwnershipStructure,
} from '@sureground/shared';
import { investorApi } from '@/lib/api/investor';
import { ApiError, errorMessage } from '@/lib/api/client';
import { deviceTimeZone } from '@/lib/api/landBuyerExtras';
import { formatDate } from '@/lib/format';
import { qk } from '@/lib/query/keys';
import { DetailScreenHeader } from '@/components/dashboard/DetailScreenHeader';
import { SelectField } from '@/components/forms/SelectField';
import { goBack } from '@/lib/goBack';

// Sureground Diaspora Invest onboarding, as on web: about you, your plans, then the risk statement.

type Step = 'about' | 'plans' | 'risk';
const STEPS: { id: Step; title: string }[] = [
  { id: 'about', title: 'About you' },
  { id: 'plans', title: 'Your plans' },
  { id: 'risk', title: 'Risk statement' },
];

const ABOUT_FIELDS: readonly InvestorProfileField[] = [
  'countryOfResidence',
  'nationality',
  'timeZone',
];
const PLANS_FIELDS: readonly InvestorProfileField[] = [
  'intendedUses',
  'propertyTypes',
  'budgetBand',
  'horizon',
  'ownershipStructure',
];

/** Used when this device cannot list its zones. */
const FALLBACK_ZONES = [
  'Africa/Lagos',
  'Europe/London',
  'Europe/Dublin',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
  'Asia/Dubai',
  'Australia/Sydney',
];

const zoneOptions = (current: string) => {
  let zones = FALLBACK_ZONES;
  try {
    const listed = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.(
      'timeZone'
    );
    if (listed?.length) zones = listed;
  } catch {
    // Older engines: keep the short list.
  }
  const all = current && !zones.includes(current) ? [current, ...zones] : zones;
  return all.map((zone) => ({ value: zone, label: zone.replace(/_/g, ' ') }));
};

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

const firstStep = (profile: InvestorProfile | null, wantsRisk: boolean): Step => {
  if (!profile) return 'about';
  const missing = new Set(profile.missingFields ?? []);
  if (ABOUT_FIELDS.some((f) => missing.has(f))) return 'about';
  if (PLANS_FIELDS.some((f) => missing.has(f))) return 'plans';
  if (wantsRisk || !profile.onboardingCompletedAt) return 'risk';
  return 'about';
};

interface Draft {
  countryOfResidence: string;
  nationality: string;
  timeZone: string;
  displayCurrency: DisplayCurrency;
  intendedUses: IntendedUse[];
  propertyTypes: InvestorPropertyType[];
  budgetBand: BudgetBand | '';
  horizon: InvestmentHorizon | '';
  ownershipStructure: OwnershipStructure | '';
}

const draftFrom = (p: InvestorProfile | null | undefined): Draft => ({
  countryOfResidence: p?.countryOfResidence ?? '',
  nationality: p?.nationality ?? 'NG',
  timeZone: p?.timeZone ?? deviceTimeZone(),
  displayCurrency: p?.displayCurrency ?? 'NGN',
  intendedUses: p?.intendedUses ?? [],
  propertyTypes: p?.propertyTypes ?? [],
  budgetBand: p?.budgetBand ?? '',
  horizon: p?.horizon ?? '',
  ownershipStructure: p?.ownershipStructure ?? '',
});

type Errors = Partial<Record<keyof Draft, string>>;

const validate = (step: 'about' | 'plans', d: Draft): Errors => {
  const e: Errors = {};
  if (step === 'about') {
    if (!d.countryOfResidence) e.countryOfResidence = 'Choose the country you live in.';
    if (!d.nationality) e.nationality = 'Choose your nationality.';
    if (!d.timeZone || !isValidTimeZone(d.timeZone)) e.timeZone = 'Choose your time zone.';
    return e;
  }
  if (!d.intendedUses.length) e.intendedUses = 'Choose at least one.';
  if (!d.propertyTypes.length) e.propertyTypes = 'Choose at least one.';
  if (!d.budgetBand) e.budgetBand = 'Choose a budget.';
  if (!d.horizon) e.horizon = 'Choose how long you expect to hold.';
  if (!d.ownershipStructure) e.ownershipStructure = 'Choose how you will own it.';
  return e;
};

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export default function InvestOnboarding() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const { step: asked } = useLocalSearchParams<{ step?: string }>();
  const profile = useQuery({ queryKey: qk.investor.profile, queryFn: investorApi.profile });
  const [chosen, setChosen] = useState<Step | null>(null);
  const step: Step =
    chosen ?? (profile.isSuccess ? firstStep(profile.data, asked === 'risk') : 'about');
  const index = STEPS.findIndex((s) => s.id === step);
  const go = (next: Step) => {
    setChosen(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <DetailScreenHeader
        eyebrow="Sureground Diaspora Invest"
        title={
          profile.data?.onboardingCompletedAt ? 'Your investor profile' : 'Set up your profile'
        }
        subtitle="Three short steps. Nothing here commits you to a purchase."
        onBack={() => goBack('/(app)/invest')}
      />
      <ScrollView
        ref={scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing['3xl'],
          gap: spacing.lg,
        }}
      >
        <View style={{ gap: spacing.sm }}>
          <Text variant="callout" style={{ fontWeight: '600' }}>
            {`Step ${index + 1} of ${STEPS.length}: ${STEPS[index].title}`}
          </Text>
          <Progress value={(index + 1) / STEPS.length} accessibilityLabel="Profile steps" />
        </View>
        <QueryState query={profile} skeleton={<DetailSkeleton />}>
          {step === 'risk' ? (
            <RiskStep onBack={() => go('plans')} />
          ) : (
            <ProfileStep
              key={step}
              step={step}
              initial={profile.data ?? null}
              onBack={() => go('about')}
              onSaved={() => go(step === 'about' ? 'plans' : 'risk')}
            />
          )}
        </QueryState>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileStep({
  step,
  initial,
  onBack,
  onSaved,
}: {
  step: 'about' | 'plans';
  initial: InvestorProfile | null;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { spacing } = useTheme();
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initial));
  const [errors, setErrors] = useState<Errors>({});
  const zones = useMemo(() => zoneOptions(draft.timeZone), [draft.timeZone]);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: (input: InvestorProfileInput) => investorApi.saveProfile(input),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.investor.all });
      onSaved();
    },
  });

  const submit = () => {
    const found = validate(step, draft);
    setErrors(found);
    if (Object.keys(found).length) return;
    // The API merges, so each step saves only its own fields.
    save.mutate(
      step === 'about'
        ? {
            countryOfResidence: draft.countryOfResidence.toUpperCase(),
            nationality: draft.nationality.toUpperCase(),
            timeZone: draft.timeZone,
            displayCurrency: draft.displayCurrency,
          }
        : {
            intendedUses: draft.intendedUses,
            propertyTypes: draft.propertyTypes,
            budgetBand: draft.budgetBand as BudgetBand,
            horizon: draft.horizon as InvestmentHorizon,
            ownershipStructure: draft.ownershipStructure as OwnershipStructure,
          }
    );
  };

  return (
    <View style={{ gap: spacing.lg }}>
      <Card style={{ gap: spacing.lg }}>
        {step === 'about' ? (
          <>
            <Text variant="callout" color="mutedForeground">
              So we can show times in your time zone and know which checks you need.
            </Text>
            <SelectField
              label="Country you live in"
              required
              value={draft.countryOfResidence}
              options={COUNTRY_OPTIONS}
              onChange={(v) => set('countryOfResidence', v)}
              placeholder="Choose a country"
              error={errors.countryOfResidence}
            />
            <SelectField
              label="Nationality"
              required
              value={draft.nationality}
              options={COUNTRY_OPTIONS}
              onChange={(v) => set('nationality', v)}
              placeholder="Choose a country"
              error={errors.nationality}
            />
            <SelectField
              label="Your time zone"
              required
              value={draft.timeZone}
              options={zones}
              onChange={(v) => set('timeZone', v)}
              placeholder="Choose a time zone"
              hint="Set from this device. Times show in this zone next to Lagos time."
              error={errors.timeZone}
            />
            <RadioGroup
              label="Currency you think in"
              variant="card"
              value={draft.displayCurrency}
              onChange={(v) => set('displayCurrency', v)}
              options={DISPLAY_CURRENCIES.map((c) => ({ value: c, label: CURRENCY_LABELS[c] }))}
            />
            <Text variant="caption" color="mutedForeground">
              Prices and payments stay in naira. Amounts in this currency are a guide only.
            </Text>
          </>
        ) : (
          <>
            <Text variant="callout" color="mutedForeground">
              This tailors your workspace. It is not a commitment and you can change it later.
            </Text>
            <CheckList
              label="What is the property for?"
              values={draft.intendedUses}
              options={INTENDED_USES.map((v) => ({ value: v, label: INTENDED_USE_LABELS[v] }))}
              onToggle={(v) => set('intendedUses', toggle(draft.intendedUses, v))}
              error={errors.intendedUses}
            />
            <CheckList
              label="Which types of property?"
              values={draft.propertyTypes}
              options={INVESTOR_PROPERTY_TYPES.map((v) => ({
                value: v,
                label: PROPERTY_TYPE_LABELS[v],
              }))}
              onToggle={(v) => set('propertyTypes', toggle(draft.propertyTypes, v))}
              error={errors.propertyTypes}
            />
            <RadioGroup
              label="Budget"
              variant="card"
              value={draft.budgetBand}
              onChange={(v) => set('budgetBand', v as BudgetBand)}
              options={BUDGET_BANDS.map((b) => ({ value: b, label: BUDGET_BAND_LABELS[b] }))}
              error={errors.budgetBand}
            />
            <RadioGroup
              label="How long do you expect to hold it?"
              variant="card"
              value={draft.horizon}
              onChange={(v) => set('horizon', v as InvestmentHorizon)}
              options={INVESTMENT_HORIZONS.map((h) => ({ value: h, label: HORIZON_LABELS[h] }))}
              error={errors.horizon}
            />
            <RadioGroup
              label="How will you own it?"
              variant="card"
              value={draft.ownershipStructure}
              onChange={(v) => set('ownershipStructure', v as OwnershipStructure)}
              options={OWNERSHIP_STRUCTURES.map((o) => ({ value: o, label: OWNERSHIP_LABELS[o] }))}
              error={errors.ownershipStructure}
            />
          </>
        )}
      </Card>
      {save.isError ? (
        <FormAlert
          title="Your profile was not saved"
          message={errorMessage(save.error, 'Something went wrong. Please try again.')}
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {step === 'plans' ? <Button label="Back" variant="ghost" onPress={onBack} /> : null}
        <Button
          label="Save and continue"
          loading={save.isPending}
          loadingLabel="Saving…"
          onPress={submit}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

function CheckList<T extends string>({
  label,
  values,
  options,
  onToggle,
  error,
}: {
  label: string;
  values: T[];
  options: { value: T; label: string }[];
  onToggle: (value: T) => void;
  error?: string;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }} accessibilityLabel={label}>
      <Text variant="callout" color="mutedForeground" style={{ fontWeight: '600' }}>
        {label}
      </Text>
      {options.map((o) => (
        <Checkbox
          key={o.value}
          checked={values.includes(o.value)}
          onChange={() => onToggle(o.value)}
          label={o.label}
        />
      ))}
      {error ? (
        <Text variant="caption" color="destructive" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

function RiskStep({ onBack }: { onBack: () => void }) {
  const { colors, spacing } = useTheme();
  const qc = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [stale, setStale] = useState(false);
  const declaration = useQuery({ queryKey: qk.investor.risk, queryFn: investorApi.risk });
  const accept = useMutation({
    mutationFn: (version: string) => investorApi.acceptRisk(version),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: qk.investor.all });
      router.replace('/(app)/invest');
    },
    onError: async (e) => {
      // A newer statement was published while this one was open: show it and ask again.
      if (e instanceof ApiError && e.status === 409) {
        setStale(true);
        setAgreed(false);
        await declaration.refetch();
      }
    },
  });
  const data = declaration.data;
  const points = data?.points ?? [];

  return (
    <QueryState
      query={declaration}
      skeleton={<DetailSkeleton />}
      isEmpty={points.length === 0}
      empty={{
        icon: <ShieldCheck size={32} color={colors.mutedForeground} />,
        title: 'The risk statement is not available',
        description: 'Please try again later.',
      }}
    >
      <View style={{ gap: spacing.lg }}>
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: 2 }}>
            <Text variant="bodyStrong" accessibilityRole="header">
              Before your first offer or purchase
            </Text>
            <Text variant="caption" color="mutedForeground">
              {data?.version ? `Risk statement, version ${data.version}` : 'Risk statement'}
            </Text>
          </View>
          {points.map((point) => (
            <View key={point} style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Text variant="callout">•</Text>
              <Text variant="callout" style={{ flex: 1 }}>
                {point}
              </Text>
            </View>
          ))}
        </Card>
        {stale ? (
          <FormAlert
            tone="warning"
            title="The statement has been updated"
            message="Please read the points above again before you accept."
          />
        ) : null}
        {data?.accepted ? (
          <FormAlert
            tone="success"
            title="You have accepted this statement"
            message={data.acceptedAt ? `Accepted ${formatDate(data.acceptedAt)}.` : null}
          />
        ) : (
          <Checkbox
            checked={agreed}
            onChange={setAgreed}
            label="I have read and understood these points. Sureground does not give investment advice or promise returns, title or prices."
          />
        )}
        {accept.isError && !stale ? (
          <FormAlert
            title="Your acceptance was not recorded"
            message={errorMessage(accept.error, 'Something went wrong. Please try again.')}
          />
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Button label="Back" variant="ghost" onPress={onBack} />
          {data?.accepted ? (
            <Button
              label="Go to your workspace"
              onPress={() => router.replace('/(app)/invest')}
              style={{ flex: 1 }}
            />
          ) : (
            <Button
              label="Accept and continue"
              loading={accept.isPending}
              loadingLabel="Recording…"
              disabled={!agreed || !data?.version}
              onPress={() => data?.version && accept.mutate(data.version)}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </View>
    </QueryState>
  );
}
