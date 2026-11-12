'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Calculator, Landmark, Percent, TrendingUp } from '@sureground/icons';
import { Badge, type BadgeVariant } from '@sureground/ui/Badge';
import { Button } from '@sureground/ui/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '@sureground/ui/Card';
import { CurrencyInput } from '@sureground/ui/CurrencyInput';
import { DataTable, type Column } from '@sureground/ui/Table';
import { Disclosure } from '@sureground/ui/Disclosure';
import { Field } from '@sureground/ui/Field';
import { NumberInput } from '@sureground/ui/NumberInput';
import { StatGroup } from '@sureground/ui/StatGroup';
import { StatGroupSkeleton } from '@sureground/ui/Skeleton';
import { unwrap } from '@/lib/apiHelpers';
import { formatCurrency, formatDate } from '@/lib/format';
import {
  analysisDefault,
  analysisInput,
  percent,
  SOURCE_LABEL,
  type AnalysisEdits,
  type AnalysisField,
} from '@/lib/listingAnalysis';
import { investorKeys } from '@/lib/queryKeys';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDiasporaAvailability } from '@/hooks/useDiasporaAvailability';
import { investorService } from '@/services/investorService';
import { ShowroomSection } from '@/components/showroom/ShowroomSection';
import type {
  AnalysisCostLine,
  AnalysisFigure,
  AnalysisScenario,
  FigureSource,
} from '@/types/investor';

const SOURCE_VARIANT: Record<FigureSource, BadgeVariant> = {
  VERIFIED: 'success',
  THIRD_PARTY_ESTIMATE: 'info',
  YOUR_ASSUMPTION: 'neutral',
};

const SourceBadge = ({ figure }: { figure: AnalysisFigure }) => (
  <Badge variant={SOURCE_VARIANT[figure.source]} title={figure.basis}>
    {SOURCE_LABEL[figure.source]}
  </Badge>
);

const naira = (figure: AnalysisFigure) =>
  figure.value === null ? '—' : formatCurrency(figure.value);

const PCT_FIELDS: { field: Exclude<AnalysisField, 'annualRent'>; label: string }[] = [
  { field: 'vacancyPct', label: 'Vacancy, % of rent' },
  { field: 'rentGrowthPct', label: 'Rent growth, % a year' },
  { field: 'maintenancePct', label: 'Maintenance, % of rent' },
  { field: 'managementFeePct', label: 'Management fee, % of rent collected' },
  { field: 'legalFeesPct', label: "Buyer's lawyer, % of price" },
  { field: 'agencyFeePct', label: 'Agency commission, % of price' },
  { field: 'consentPct', label: 'Consent, registration and stamp duty, % of price' },
];

type ScenarioRow = { label: string; pick: (s: AnalysisScenario) => AnalysisFigure; pct?: boolean };
const SCENARIO_ROWS: ScenarioRow[] = [
  { label: 'Acquisition cost', pick: (s) => s.acquisitionCost },
  { label: 'Yearly rent', pick: (s) => s.annualRent },
  { label: 'Net income, first year', pick: (s) => s.netIncome },
  { label: 'Gross yield', pick: (s) => s.grossYieldPct, pct: true },
  { label: 'Net yield', pick: (s) => s.netYieldPct, pct: true },
  { label: 'Net income over 5 years', pick: (s) => s.cashFlowNet },
];

/**
 * DIA-19: investment analysis in naira on an investment-eligible listing. Every figure carries
 * its source; the investor's own figures replace the defaults. Hidden while Diaspora Invest is
 * off, and when the API has no analysis for the listing.
 */
export function ListingInvestmentAnalysis({ listingId }: { listingId: string }) {
  const { enabled } = useDiasporaAvailability();
  const [edits, setEdits] = useState<AnalysisEdits>({});
  // Debounced as a string, so an unchanged input never schedules another render.
  const settled = useDebouncedValue(JSON.stringify(analysisInput(edits)), 500);
  const input = useMemo(() => JSON.parse(settled) as ReturnType<typeof analysisInput>, [settled]);
  const analysis = useQuery({
    queryKey: investorKeys.analysis(listingId, input),
    queryFn: () => unwrap(investorService.getListingAnalysis(listingId, input)),
    enabled,
    // An optional section: if the analysis can't load, leave it out rather than failing the listing page.
    throwOnError: false,
    retry: false,
    placeholderData: keepPreviousData,
  });

  if (!enabled || analysis.isError) return null;
  const data = analysis.data;
  if (!data) {
    return (
      <ShowroomSection id="investment-analysis" title="Investment analysis">
        <StatGroupSkeleton groups={[4]} />
      </ShowroomSection>
    );
  }

  const valueOf = (field: AnalysisField) => edits[field] ?? analysisDefault(data, field);
  const edit = (field: AnalysisField, value: string) =>
    setEdits((current) => ({ ...current, [field]: value }));
  const edited = Object.keys(edits).length > 0;
  const year5 = data.cashFlow.total;

  const costColumns: Column<AnalysisCostLine>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (line) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{line.label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{line.amount.basis}</p>
          {line.range && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Range {formatCurrency(line.range.low)} to {formatCurrency(line.range.high)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      numeric: true,
      render: (line) => (
        <div className="space-y-1.5">
          <p className="text-foreground">{naira(line.amount)}</p>
          <SourceBadge figure={line.amount} />
        </div>
      ),
    },
  ];

  const scenarioColumns: Column<ScenarioRow>[] = [
    { key: 'figure', header: 'Figure', render: (row) => row.label },
    ...data.scenarios.map(
      (scenario): Column<ScenarioRow> => ({
        key: scenario.key,
        header: scenario.label,
        numeric: true,
        render: (row) => {
          const figure = row.pick(scenario);
          return row.pct ? percent(figure.value) : naira(figure);
        },
      })
    ),
  ];

  return (
    <ShowroomSection id="investment-analysis" title="Investment analysis">
      <div className="space-y-6">
        <p className="max-w-3xl text-sm text-muted-foreground">
          In naira, from this listing’s price, similar rentals on Sureground and published fee
          rates. Each figure says where it comes from; change any you have better figures for.
        </p>

        <StatGroup
          title="Central case"
          items={[
            {
              icon: Landmark,
              label: 'Acquisition cost',
              value: naira(data.acquisitionCost),
              supplement: <SourceBadge figure={data.acquisitionCost} />,
            },
            {
              icon: Percent,
              label: 'Gross yield',
              value: percent(data.grossYieldPct.value),
              supplement: <SourceBadge figure={data.grossYieldPct} />,
            },
            {
              icon: Calculator,
              label: 'Net yield',
              value: percent(data.netYieldPct.value),
              supplement: <SourceBadge figure={data.netYieldPct} />,
            },
            {
              icon: TrendingUp,
              label: `Net income over ${data.cashFlow.years} years`,
              value: naira(year5),
              supplement: <SourceBadge figure={year5} />,
            },
          ]}
        />

        <DataTable
          caption="Acquisition costs"
          columns={costColumns}
          data={data.costs}
          getRowKey={(line) => line.key}
          totals={{
            item: 'Acquisition cost',
            amount: naira(data.acquisitionCost),
          }}
        />

        <Card>
          <CardHeader>
            <CardTitle as="h3">Your figures</CardTitle>
            <CardDescription>
              Defaults are filled in. Change any of them and the figures above update.
            </CardDescription>
          </CardHeader>
          <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
            <Field
              label="Yearly rent"
              labelAside={<SourceBadge figure={data.assumptions.annualRent} />}
              hint={data.assumptions.annualRent.basis}
              className="sm:col-span-2"
            >
              <CurrencyInput
                value={valueOf('annualRent')}
                onValueChange={(n) => edit('annualRent', String(n))}
                allowZero
                prefix="₦"
              />
            </Field>
            {PCT_FIELDS.map(({ field, label }) => (
              <Field key={field} label={label}>
                <NumberInput
                  value={valueOf(field)}
                  onValueChange={(v) => edit(field, v)}
                  integer={false}
                  inputMode="decimal"
                  trailingIcon={<span className="text-sm text-muted-foreground">%</span>}
                />
              </Field>
            ))}
          </div>
          {edited && (
            <div className="border-t border-border px-5 py-3">
              <Button variant="link" onClick={() => setEdits({})}>
                Go back to the defaults
              </Button>
            </div>
          )}
        </Card>

        <section aria-labelledby="analysis-scenarios" className="space-y-3">
          <h3 id="analysis-scenarios" className="text-base font-semibold text-foreground">
            Three scenarios
          </h3>
          <DataTable
            caption="Cautious, central and optimistic scenarios"
            columns={scenarioColumns}
            data={SCENARIO_ROWS}
            getRowKey={(row) => row.label}
            density="compact"
          />
          <p className="text-xs text-muted-foreground">
            Cautious and optimistic move only the rent and the fees, within the ranges Sureground
            holds. Your other figures apply to all three.
          </p>
        </section>

        <Card>
          <Disclosure summary="How this is worked out">
            <ul className="list-disc space-y-1.5 pl-5">
              {data.methodology.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-4 font-medium text-foreground">Not included</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              {data.notIncluded.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="mt-4 text-xs">
              Method {data.methodologyVersion}, worked out on {formatDate(data.asOf, 'long')}.
            </p>
          </Disclosure>
        </Card>

        <p className="text-xs text-muted-foreground">{data.disclaimer}</p>
      </div>
    </ShowroomSection>
  );
}
