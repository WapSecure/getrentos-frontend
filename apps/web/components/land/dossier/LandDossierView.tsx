'use client';

import { Printer } from 'lucide-react';
import { Badge, Button } from '@getrentos/ui';
import { formatCurrency, formatDate } from '@/lib/format';
import { LAND_TITLE_TYPE_LABELS, type LandTitleType } from '@/types/land';
import type { AcquisitionCostItem, LandDossier } from '@/types/landDossier';
import { TrustLabelsList } from '../market/TrustLabelsList';

const words = (value: string) => {
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const STATUS_BADGE: Record<string, { label: string; variant: 'success' | 'info' | 'neutral' }> = {
  CONFIRMED: { label: 'Confirmed', variant: 'success' },
  ESTIMATED: { label: 'Estimated', variant: 'info' },
  NOT_YET_KNOWN: { label: 'Not yet known', variant: 'neutral' },
};

const costFigure = (item: AcquisitionCostItem) =>
  item.status === 'CONFIRMED'
    ? formatCurrency(item.amount ?? 0)
    : item.status === 'ESTIMATED'
      ? item.low === item.high
        ? `≈ ${formatCurrency(item.low ?? 0)}`
        : `${formatCurrency(item.low ?? 0)} – ${formatCurrency(item.high ?? 0)}`
      : '—';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="break-inside-avoid rounded-2xl border border-border bg-card p-5 print:rounded-none print:border-0 print:border-t print:p-0 print:pt-4">
    <h2 className="text-base font-semibold text-foreground">{title}</h2>
    <div className="mt-3">{children}</div>
  </section>
);

/**
 * The buyer decision dossier, laid out to read on screen and to print or save
 * as PDF from the browser (blueprint §8.3).
 */
export const LandDossierView = ({ dossier }: { dossier: LandDossier }) => {
  const { subject, parcel, acquisitionCost: cost } = dossier;
  return (
    <article className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            Decision dossier
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{subject.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {subject.city}, {subject.state} · {formatCurrency(subject.price)}
            {subject.planName ? ` · ${subject.planName}` : ''} · generated{' '}
            {formatDate(dossier.generatedAt)}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          icon={<Printer className="h-4 w-4" />}
          className="print:hidden"
        >
          Print or save as PDF
        </Button>
      </header>

      <p className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm text-foreground">
        {dossier.freshnessNote}
      </p>

      <Section title="The land">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Title</dt>
            <dd>
              {parcel.titleType
                ? (LAND_TITLE_TYPE_LABELS[parcel.titleType as LandTitleType] ??
                  words(parcel.titleType))
                : 'Not stated'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Area</dt>
            <dd>
              {(subject.plot?.areaValue ?? parcel.areaValue).toLocaleString('en-NG')}{' '}
              {words(subject.plot?.areaUnit ?? parcel.areaUnit)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Road access</dt>
            <dd>{parcel.roadAccess ? 'Yes' : 'Not stated'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Encumbrances</dt>
            <dd>{words(parcel.encumbranceStatus)}</dd>
          </div>
          {dossier.riskBand && (
            <div>
              <dt className="text-xs text-muted-foreground">Risk</dt>
              <dd>
                {words(dossier.riskBand)} ({dossier.riskScore}/100)
              </dd>
            </div>
          )}
          {dossier.assuranceTier && (
            <div>
              <dt className="text-xs text-muted-foreground">Review level</dt>
              <dd>{words(dossier.assuranceTier)}</dd>
            </div>
          )}
          {subject.plot && (
            <div>
              <dt className="text-xs text-muted-foreground">Plot</dt>
              <dd>
                {subject.plot.block ? `Block ${subject.plot.block}, ` : ''}plot{' '}
                {subject.plot.plotNumber}
              </dd>
            </div>
          )}
        </dl>
      </Section>

      <Section title="What was checked, and what was not">
        <TrustLabelsList labels={dossier.labels} notVerified={dossier.notVerified} />
        {dossier.checklist.policyPack && (
          <p className="mt-3 text-xs text-muted-foreground">
            Checked against {dossier.checklist.policyPack.state} rules
            {dossier.checklist.policyPack.status === 'APPROVED'
              ? ''
              : ' (draft, pending counsel review)'}
            .
          </p>
        )}
      </Section>

      <Section title="All-in cost">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {cost.items.map((item) => (
              <tr key={`${item.key}-${item.status}`} className="align-top">
                <td className="py-2 pr-3">
                  <p className="text-foreground">
                    {item.label}
                    {item.recurring && <span className="text-muted-foreground"> · recurring</span>}
                  </p>
                  {item.basis && <p className="text-xs text-muted-foreground">{item.basis}</p>}
                </td>
                <td className="py-2 pr-3 text-right">
                  <Badge variant={STATUS_BADGE[item.status].variant}>
                    {STATUS_BADGE[item.status].label}
                  </Badge>
                </td>
                <td className="whitespace-nowrap py-2 text-right font-medium text-foreground">
                  {costFigure(item)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Confirmed so far</span>
            <span className="font-semibold text-foreground">
              {formatCurrency(cost.confirmedTotal)}
            </span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">With estimates</span>
            <span className="font-semibold text-foreground">
              {cost.estimatedLow === cost.estimatedHigh
                ? formatCurrency(cost.estimatedLow)
                : `${formatCurrency(cost.estimatedLow)} – ${formatCurrency(cost.estimatedHigh)}`}
            </span>
          </p>
          {cost.unknownCount > 0 && (
            <p className="text-xs text-muted-foreground">
              Plus {cost.unknownCount} cost{cost.unknownCount === 1 ? '' : 's'} not yet known. Ask
              the seller and your lawyer for these before you commit.
            </p>
          )}
          {cost.estimatesDraft && (
            <p className="text-xs text-muted-foreground">
              Estimates are indicative and pending professional review.
            </p>
          )}
        </div>
      </Section>

      <Section title="Title chronology">
        {dossier.titleChronology.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chain of title has been recorded yet.</p>
        ) : (
          <ol className="space-y-2 text-sm">
            {dossier.titleChronology.map((event, index) => (
              <li key={`${event.kind}-${index}`} className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{words(event.kind)}</span>
                <span className="text-muted-foreground">
                  {formatDate(event.occurredAt)}
                  {event.registeredAt ? ` · registered ${formatDate(event.registeredAt)}` : ''}
                </span>
                <Badge variant={event.verified ? 'success' : 'neutral'}>
                  {event.verified ? 'Verified by GetRentos' : 'As stated by the owner'}
                </Badge>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title="Sources">
        <p className="text-sm text-muted-foreground">
          Documents GetRentos holds for this land (the files are not shared here):
        </p>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {dossier.sourceIndex.length === 0 ? (
            <li className="text-muted-foreground">None on file.</li>
          ) : (
            dossier.sourceIndex.map((source) => (
              <li
                key={source.documentType}
                className="rounded-full bg-secondary px-3 py-1 text-foreground"
              >
                {words(source.documentType)}
                {source.count > 1 ? ` × ${source.count}` : ''}
              </li>
            ))
          )}
        </ul>
        {dossier.outsideReviews.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Independent reviews:{' '}
            {dossier.outsideReviews
              .map(
                (review) =>
                  `${words(review.role)}${review.completedAt ? ` (${formatDate(review.completedAt)})` : ''}`
              )
              .join(', ')}
            .
          </p>
        )}
      </Section>

      <p className="text-xs text-muted-foreground">{dossier.disclaimer}</p>
    </article>
  );
};
