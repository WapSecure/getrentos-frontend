import Link from 'next/link';
import {
  ArrowLeft,
  BadgeCheck,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Info,
  Mail,
  MapPin,
  Phone,
  Ruler,
} from '@sureground/icons';
import {
  DEVELOPMENT_STAGE_LABEL,
  completionLabel,
  instalmentAmountLabel,
  type ShowroomDevelopment,
} from '@sureground/shared/showroom';
import { Badge, MediaMosaic, ProgressiveImg } from '@sureground/ui';
import { Footer } from '@/components/layout/Footer';
import { Navigation } from '@/components/layout/Navigation';
import { formatCurrency } from '@/lib/format';
import { DEVELOPMENTS_PATH } from '@/lib/publicDevelopments';
import { DevelopmentChecks, DevelopmentPaymentNotice } from './DevelopmentAssurance';
import { ShowroomSection as Section } from './ShowroomSection';

const naira = (n: number) => formatCurrency(n);

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

/** An off-plan development: listed only. The developer takes the money; the page says so in two places. */
export function DevelopmentPage({ development: d }: { development: ShowroomDevelopment }) {
  const prices = d.unitTypes
    .map((u) => u.priceFromNaira)
    .filter((n): n is number => typeof n === 'number');
  const lowest = prices.length ? Math.min(...prices) : undefined;
  const completion = completionLabel(d.expectedCompletion);
  const unitName = new Map(d.unitTypes.map((u) => [u.id, u.name]));
  const location = [d.addressLine, d.lga, d.city, d.state].filter(Boolean).join(', ');
  const titleApprovals = d.approvals.filter((a) => a.kind !== 'OTHER_APPROVAL');
  const otherApprovals = d.approvals.filter((a) => a.kind === 'OTHER_APPROVAL');

  return (
    <main className="min-h-screen bg-background pt-16">
      <Navigation />
      <article className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <Link
          href={DEVELOPMENTS_PATH}
          className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Developments
        </Link>

        <MediaMosaic
          items={d.media}
          title={d.name}
          emptyLabel="The developer has not added photos yet"
          className="-mx-4 mt-3 rounded-none shadow-none sm:mx-0 sm:rounded-2xl sm:shadow-sm"
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:gap-14">
          <div className="min-w-0 space-y-10">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="#checks"
                  className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Four staff checks passed. See what was checked and what was not"
                >
                  <Badge variant="success" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                    Four staff checks passed
                  </Badge>
                </a>
                <Badge variant="neutral">Off-plan</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground text-balance sm:text-4xl">
                {d.name}
              </h1>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{location}</span>
              </p>
              <p className="flex items-start gap-1.5 text-muted-foreground">
                <Building2 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  By {d.developerName}
                  {d.registeredName &&
                  d.registeredName.toLowerCase() !== d.developerName.toLowerCase()
                    ? ` (registered as ${d.registeredName})`
                    : ''}
                </span>
              </p>
              <ul
                aria-label="Stage and completion"
                className="flex flex-wrap items-center gap-y-2 divide-x divide-border pt-1 text-sm font-medium text-foreground"
              >
                <li className="px-4 first:pl-0">{DEVELOPMENT_STAGE_LABEL[d.stage]}</li>
                {completion && (
                  <li className="flex items-center gap-2 px-4">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    Expected {completion}
                  </li>
                )}
              </ul>
              <p className="text-xs text-muted-foreground">
                The stage and expected completion are as the developer states them.
              </p>
            </header>

            {d.summary && (
              <Section id="about" title="About this development">
                <p className="max-w-3xl whitespace-pre-line leading-7 text-muted-foreground">
                  {d.summary}
                </p>
              </Section>
            )}

            {d.unitTypes.length > 0 && (
              <Section id="units" title="Unit types">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {d.unitTypes.map((u) => (
                    <li key={u.id} className="rounded-xl border border-border bg-card p-4 text-sm">
                      <p className="font-medium text-foreground">{u.name}</p>
                      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                        {u.bedrooms !== undefined && (
                          <li className="flex items-center gap-1.5">
                            <BedDouble className="h-4 w-4" aria-hidden="true" /> {u.bedrooms} bed
                          </li>
                        )}
                        {u.bathrooms !== undefined && (
                          <li className="flex items-center gap-1.5">
                            <Bath className="h-4 w-4" aria-hidden="true" /> {u.bathrooms} bath
                          </li>
                        )}
                        {u.sizeSqm !== undefined && (
                          <li className="flex items-center gap-1.5">
                            <Ruler className="h-4 w-4" aria-hidden="true" /> about {u.sizeSqm} m²
                          </li>
                        )}
                      </ul>
                      {u.priceFromNaira !== undefined && (
                        <p className="data-value mt-3 text-base font-semibold text-foreground">
                          From {naira(u.priceFromNaira)}
                        </p>
                      )}
                      {u.unitsAvailable !== undefined && u.unitsTotal !== undefined && (
                        <p className="mt-1 text-muted-foreground">
                          {u.unitsAvailable} of {u.unitsTotal} available
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  Prices, sizes and availability are as the developer states them. Sureground has
                  not checked them.
                </p>
              </Section>
            )}

            <Section id="payment" title="Payment plan">
              <DevelopmentPaymentNotice />
              {d.instalments.length > 0 && (
                <ol className="mt-4 divide-y divide-border rounded-xl border border-border bg-card text-sm">
                  {d.instalments.map((i) => (
                    <li
                      key={i.id}
                      className="flex flex-wrap items-baseline justify-between gap-2 p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{i.label}</p>
                        <p className="mt-0.5 text-muted-foreground">
                          {[i.dueWhen, i.unitTypeId ? unitName.get(i.unitTypeId) : 'All unit types']
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <p className="data-value font-medium text-foreground">
                        {instalmentAmountLabel(i, naira)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
              {d.paymentNote && (
                <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">
                    In the developer&apos;s words:{' '}
                  </span>
                  {d.paymentNote}
                </p>
              )}
            </Section>

            {d.progress.length > 0 && (
              <Section id="progress" title="Progress on site">
                <p className="text-sm text-muted-foreground">
                  Photos from the developer, newest first, with the date each was taken.
                </p>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {d.progress.map((m) => (
                    <li key={m.id} className="space-y-1.5">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
                        <ProgressiveImg
                          src={m.variants?.find((v) => v.width === 320)?.url ?? m.url}
                          alt={m.alt ?? ''}
                          placeholder={m.placeholder}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">{day(m.capturedAt!)}</p>
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            <Section id="approvals" title="Approvals">
              <ul className="space-y-3 text-sm">
                {titleApprovals.map((a) => (
                  <li
                    key={a.kind}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <BadgeCheck
                      className="mt-0.5 h-5 w-5 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        {a.label}
                        {a.authority ? ` (${a.authority})` : ''}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        Checked by Sureground{a.checkedAt ? ` on ${day(a.checkedAt)}` : ''}. The
                        documents stay private.
                      </p>
                    </div>
                  </li>
                ))}
                {otherApprovals.map((a) => (
                  <li
                    key={a.label}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <Info
                      className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-medium text-foreground">{a.label}</p>
                      <p className="mt-1 text-muted-foreground">
                        Stated by the developer. Sureground has not checked it.
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>

            <DevelopmentChecks development={d} />
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Price and contact">
            <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
              {lowest !== undefined && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Units from</p>
                  <p className="data-value text-3xl font-semibold tracking-[-0.025em] text-foreground">
                    {naira(lowest)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">As the developer states it</p>
                </div>
              )}
              {(d.salesPhone || d.salesEmail) && (
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-foreground">Contact the developer</p>
                  {d.salesPhone && (
                    <a
                      href={`tel:${d.salesPhone.replace(/\s/g, '')}`}
                      className="flex min-h-10 items-center gap-2 text-primary hover:underline"
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" /> {d.salesPhone}
                    </a>
                  )}
                  {d.salesEmail && (
                    <a
                      href={`mailto:${d.salesEmail}`}
                      className="flex min-h-10 items-center gap-2 break-all text-primary hover:underline"
                    >
                      <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> {d.salesEmail}
                    </a>
                  )}
                </div>
              )}
              <DevelopmentPaymentNotice compact />
            </div>
          </aside>
        </div>
      </article>
      <Footer />
    </main>
  );
}
