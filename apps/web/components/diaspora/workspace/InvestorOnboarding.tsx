'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from '@sureground/icons';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  CheckboxGroup,
  Field,
  PageHeader,
  Progress,
  QueryState,
  RadioGroup,
  Select,
  CardSkeleton,
  type SelectOption,
} from '@sureground/ui';
import { ApiError, unwrap } from '@/lib/apiHelpers';
import { COUNTRIES } from '@/lib/constants/countries';
import { DIASPORA_ROUTES, type InvestorPortal } from '@/lib/constants/diasporaRoutes';
import { formatLagosDate, isValidTimeZone } from '@/lib/format';
import { investorKeys } from '@/lib/queryKeys';
import { investorService } from '@/services/investorService';
import { browserTimeZone, TimeZoneSelect } from '@/components/shared/forms/TimeZoneSelect';
import {
  BUDGET_BANDS,
  DISPLAY_CURRENCIES,
  INTENDED_USES,
  INVESTMENT_HORIZONS,
  INVESTOR_PROPERTY_TYPES,
  OWNERSHIP_STRUCTURES,
  type BudgetBand,
  type DisplayCurrency,
  type IntendedUse,
  type InvestmentHorizon,
  type InvestorProfile,
  type InvestorProfileField,
  type InvestorProfileInput,
  type InvestorPropertyType,
  type OwnershipStructure,
} from '@/types/investor';
import {
  BUDGET_BAND_LABELS,
  CURRENCY_LABELS,
  HORIZON_LABELS,
  INTENDED_USE_LABELS,
  OWNERSHIP_LABELS,
  PROPERTY_TYPE_LABELS,
} from '../labels';

type Step = 'about' | 'plans' | 'risk';
const STEPS: { id: Step; title: string }[] = [
  { id: 'about', title: 'About you' },
  { id: 'plans', title: 'Your plans' },
  { id: 'risk', title: 'Risk statement' },
];

const messageOf = (error: unknown, fallback = 'Something went wrong. Please try again.') =>
  error instanceof Error && error.message ? error.message : fallback;

const COUNTRY_OPTIONS: SelectOption[] = COUNTRIES.map((country) => ({
  value: country.code,
  label: country.name,
}));

interface Draft {
  countryOfResidence: string;
  nationality: string;
  timeZone: string;
  displayCurrency: DisplayCurrency | '';
  intendedUses: IntendedUse[];
  propertyTypes: InvestorPropertyType[];
  budgetBand: BudgetBand | '';
  horizon: InvestmentHorizon | '';
  ownershipStructure: OwnershipStructure | '';
}

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

/** Where to start: the first step with a required field still empty, else the statement if it is still owed. */
const firstStep = (profile: InvestorProfile | null, wantsRisk: boolean): Step => {
  if (!profile) return 'about';
  const missing = new Set(profile.missingFields ?? []);
  if (ABOUT_FIELDS.some((field) => missing.has(field))) return 'about';
  if (PLANS_FIELDS.some((field) => missing.has(field))) return 'plans';
  if (wantsRisk || !profile.onboardingCompletedAt) return 'risk';
  return 'about';
};

const draftFrom = (profile: InvestorProfile | null | undefined): Draft => ({
  countryOfResidence: profile?.countryOfResidence ?? '',
  nationality: profile?.nationality ?? 'NG',
  timeZone: profile?.timeZone ?? browserTimeZone(),
  displayCurrency: profile?.displayCurrency ?? 'NGN',
  intendedUses: profile?.intendedUses ?? [],
  propertyTypes: profile?.propertyTypes ?? [],
  budgetBand: profile?.budgetBand ?? '',
  horizon: profile?.horizon ?? '',
  ownershipStructure: profile?.ownershipStructure ?? '',
});

type Errors = Partial<Record<keyof Draft, string>>;

const validateAbout = (draft: Draft): Errors => {
  const errors: Errors = {};
  if (!draft.countryOfResidence) errors.countryOfResidence = 'Choose the country you live in.';
  if (!draft.nationality) errors.nationality = 'Choose your nationality.';
  if (!draft.timeZone || !isValidTimeZone(draft.timeZone))
    errors.timeZone = 'Choose your time zone.';
  if (!draft.displayCurrency) errors.displayCurrency = 'Choose a currency.';
  return errors;
};

const validatePlans = (draft: Draft): Errors => {
  const errors: Errors = {};
  if (draft.intendedUses.length === 0) errors.intendedUses = 'Choose at least one.';
  if (draft.propertyTypes.length === 0) errors.propertyTypes = 'Choose at least one.';
  if (!draft.budgetBand) errors.budgetBand = 'Choose a budget.';
  if (!draft.horizon) errors.horizon = 'Choose how long you expect to hold.';
  if (!draft.ownershipStructure) errors.ownershipStructure = 'Choose how you will own it.';
  return errors;
};

const StepCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) => (
  <Card>
    <CardHeader>
      <CardTitle as="h2">{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const ProfileForm = ({
  initial,
  step,
  onStep,
  onSaved,
}: {
  initial: InvestorProfile | null;
  step: 'about' | 'plans';
  onStep: (step: Step) => void;
  onSaved: (step: 'about' | 'plans') => void;
}) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft>(() => draftFrom(initial));
  const [errors, setErrors] = useState<Errors>({});
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: (input: InvestorProfileInput) => unwrap(investorService.saveProfile(input)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: investorKeys.all });
      onSaved(step);
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = step === 'about' ? validateAbout(draft) : validatePlans(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    // The API merges, so each step saves only its own fields.
    if (step === 'about') {
      save.mutate({
        countryOfResidence: draft.countryOfResidence.toUpperCase(),
        nationality: draft.nationality.toUpperCase(),
        timeZone: draft.timeZone,
        displayCurrency: draft.displayCurrency as DisplayCurrency,
      });
      return;
    }
    save.mutate({
      intendedUses: draft.intendedUses,
      propertyTypes: draft.propertyTypes,
      budgetBand: draft.budgetBand as BudgetBand,
      horizon: draft.horizon as InvestmentHorizon,
      ownershipStructure: draft.ownershipStructure as OwnershipStructure,
    });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {step === 'about' ? (
        <StepCard
          title="About you"
          description="So we can show times in your time zone and know which checks you need."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Country you live in" required error={errors.countryOfResidence}>
              <Select
                value={draft.countryOfResidence}
                onValueChange={(value) => set('countryOfResidence', value)}
                options={COUNTRY_OPTIONS}
                placeholder="Choose a country"
                searchPlaceholder="Search countries…"
              />
            </Field>
            <Field label="Nationality" required error={errors.nationality}>
              <Select
                value={draft.nationality}
                onValueChange={(value) => set('nationality', value)}
                options={COUNTRY_OPTIONS}
                placeholder="Choose a country"
                searchPlaceholder="Search countries…"
              />
            </Field>
            <Field
              label="Your time zone"
              required
              error={errors.timeZone}
              hint="Set from this device. Times are shown in this zone next to Lagos time."
            >
              <TimeZoneSelect
                value={draft.timeZone}
                onValueChange={(value) => set('timeZone', value)}
              />
            </Field>
            <Field
              label="Currency you think in"
              required
              error={errors.displayCurrency}
              hint="Prices and payments stay in naira. Approximate amounts in this currency are planned."
            >
              <Select
                value={draft.displayCurrency}
                onValueChange={(value) => set('displayCurrency', value as DisplayCurrency)}
                options={DISPLAY_CURRENCIES.map((code) => ({
                  value: code,
                  label: CURRENCY_LABELS[code],
                }))}
                placeholder="Choose a currency"
                searchable={false}
              />
            </Field>
          </div>
        </StepCard>
      ) : (
        <StepCard
          title="Your plans"
          description="This tailors your workspace. It is not a commitment and you can change it later."
        >
          <div className="space-y-7">
            <CheckboxGroup
              legend="What is the property for?"
              required
              columns={2}
              value={draft.intendedUses}
              options={INTENDED_USES.map((option) => ({
                value: option,
                label: INTENDED_USE_LABELS[option],
              }))}
              onValueChange={(next) => set('intendedUses', next)}
              error={errors.intendedUses}
            />
            <CheckboxGroup
              legend="Which types of property?"
              required
              columns={2}
              value={draft.propertyTypes}
              options={INVESTOR_PROPERTY_TYPES.map((option) => ({
                value: option,
                label: PROPERTY_TYPE_LABELS[option],
              }))}
              onValueChange={(next) => set('propertyTypes', next)}
              error={errors.propertyTypes}
            />
            <Field label="Budget" required error={errors.budgetBand}>
              <RadioGroup
                value={draft.budgetBand}
                onValueChange={(value) => set('budgetBand', value)}
                options={BUDGET_BANDS.map((band) => ({
                  value: band,
                  label: BUDGET_BAND_LABELS[band],
                }))}
                variant="card"
                columns={2}
              />
            </Field>
            <Field label="How long do you expect to hold it?" required error={errors.horizon}>
              <RadioGroup
                value={draft.horizon}
                onValueChange={(value) => set('horizon', value)}
                options={INVESTMENT_HORIZONS.map((horizon) => ({
                  value: horizon,
                  label: HORIZON_LABELS[horizon],
                }))}
                variant="card"
                columns={2}
              />
            </Field>
            <Field label="How will you own it?" required error={errors.ownershipStructure}>
              <RadioGroup
                value={draft.ownershipStructure}
                onValueChange={(value) => set('ownershipStructure', value)}
                options={OWNERSHIP_STRUCTURES.map((structure) => ({
                  value: structure,
                  label: OWNERSHIP_LABELS[structure],
                }))}
                variant="card"
                columns={3}
              />
            </Field>
          </div>
        </StepCard>
      )}

      {save.isError && (
        <Alert variant="danger" title="Your profile was not saved">
          {messageOf(save.error)}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {step === 'plans' ? (
          <Button type="button" variant="ghost" onClick={() => onStep('about')}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" isLoading={save.isPending} loadingText="Saving…">
          Save and continue
        </Button>
      </div>
    </form>
  );
};

const RiskStep = ({ portal, onBack }: { portal: InvestorPortal; onBack: () => void }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [stale, setStale] = useState(false);
  const declaration = useQuery({
    queryKey: investorKeys.riskDeclaration,
    queryFn: () => unwrap(investorService.getRiskDeclaration()),
  });

  const accept = useMutation({
    mutationFn: (version: string) => unwrap(investorService.acceptRiskDeclaration(version)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: investorKeys.all });
      router.push(DIASPORA_ROUTES.workspace(portal));
    },
    onError: async (error) => {
      // A newer statement was published while this one was open: show it and ask again.
      if (error instanceof ApiError && error.status === 409) {
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
      isLoading={declaration.isLoading}
      isError={declaration.isError}
      onRetry={() => declaration.refetch()}
      isRetrying={declaration.isFetching}
      loading={<CardSkeleton lines={6} />}
      isEmpty={points.length === 0}
      empty={{
        icon: ShieldCheck,
        title: 'The risk statement is not available',
        description: 'Please try again later.',
      }}
    >
      <div className="space-y-6">
        <StepCard
          title="Before your first offer or purchase"
          description={data?.version ? `Risk statement, version ${data.version}` : 'Risk statement'}
        >
          <ul className="list-disc space-y-3 pl-5 text-sm leading-relaxed text-foreground">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </StepCard>

        {stale && (
          <Alert variant="warning" title="The statement has been updated">
            Please read the points above again before you accept.
          </Alert>
        )}

        {data?.accepted ? (
          <Alert variant="success" title="You have accepted this statement">
            {data.acceptedAt ? `Accepted ${formatLagosDate(data.acceptedAt, 'long')}.` : null}
          </Alert>
        ) : (
          <Checkbox
            checked={agreed}
            onCheckedChange={setAgreed}
            label="I have read and understood these points"
            description="Sureground does not give investment advice or promise returns, title or prices."
          />
        )}

        {accept.isError && !stale && (
          <Alert variant="danger" title="Your acceptance was not recorded">
            {messageOf(accept.error)}
          </Alert>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onBack}>
            Back
          </Button>
          {data?.accepted ? (
            <Button href={DIASPORA_ROUTES.workspace(portal)}>Go to your workspace</Button>
          ) : (
            <Button
              type="button"
              disabled={!agreed || !data?.version}
              isLoading={accept.isPending}
              loadingText="Recording…"
              onClick={() => data?.version && accept.mutate(data.version)}
            >
              Accept and continue
            </Button>
          )}
        </div>
      </div>
    </QueryState>
  );
};

export const InvestorOnboarding = ({ portal }: { portal: InvestorPortal }) => {
  const searchParams = useSearchParams();
  const profile = useQuery({
    queryKey: investorKeys.profile,
    queryFn: () => investorService.getProfile(),
  });
  const onboarded = Boolean(profile.data?.onboardingCompletedAt);
  const wantsRisk = searchParams.get('step') === 'risk';
  const [chosen, setStep] = useState<Step | null>(null);
  // A saved profile can go straight to the statement when the link asks for it.
  const step: Step = chosen ?? (profile.isSuccess ? firstStep(profile.data, wantsRisk) : 'about');

  const index = STEPS.findIndex((item) => item.id === step);
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Sureground Diaspora Invest"
        title={onboarded ? 'Your investor profile' : 'Set up your investor profile'}
        description="Three short steps. Your answers tailor your workspace; nothing here commits you to a purchase."
        breadcrumbs={[
          { label: 'Diaspora Invest', href: DIASPORA_ROUTES.workspace(portal) },
          { label: 'Profile' },
        ]}
      />
      <Progress
        value={index + 1}
        max={STEPS.length}
        label={`Step ${index + 1} of ${STEPS.length}: ${STEPS[index].title}`}
        size="sm"
      />
      <QueryState
        isLoading={profile.isLoading}
        isError={profile.isError}
        onRetry={() => profile.refetch()}
        isRetrying={profile.isFetching}
        loading={<CardSkeleton lines={6} />}
      >
        {step === 'risk' ? (
          <RiskStep portal={portal} onBack={() => setStep('plans')} />
        ) : (
          <ProfileForm
            initial={profile.data ?? null}
            step={step}
            onStep={setStep}
            onSaved={(saved) => setStep(saved === 'about' ? 'plans' : 'risk')}
          />
        )}
      </QueryState>
    </div>
  );
};
