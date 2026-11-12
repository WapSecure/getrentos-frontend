import type { CommercialDetails, ShowroomMarket } from '@sureground/shared/showroom';
import { DescriptionList } from '@sureground/ui/DescriptionList';
import {
  COMMERCIAL_VAT_ANCHOR,
  commercialSections,
  type CommercialRow,
} from '@/lib/commercialShowroom';
import { ShowroomSection as Section } from './ShowroomSection';

function Rows({ rows }: { rows: CommercialRow[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs">
      <DescriptionList
        columns={2}
        items={rows.map((row) => ({
          // The VAT row is the one the note by the costs links to.
          label:
            row.key === 'vat' ? (
              <span id={COMMERCIAL_VAT_ANCHOR} className="scroll-mt-24">
                {row.label}
              </span>
            ) : (
              row.label
            ),
          value: <span className="whitespace-pre-line">{row.value}</span>,
          hint: row.hint,
          wide: row.value.length > 60,
        }))}
      />
    </div>
  );
}

/**
 * The commercial journey: the lease first, then the space, then what it takes to run a business
 * there. Everything is the lister's own statement; a section with nothing stated is left out.
 */
export function ShowroomCommercial({
  commercial,
  market,
}: {
  commercial: CommercialDetails;
  market: ShowroomMarket;
}) {
  const { lease, space, running } = commercialSections(commercial, market);
  return (
    <>
      {lease.length > 0 && (
        <Section id="lease-and-terms" title="Lease and terms">
          <Rows rows={lease} />
        </Section>
      )}
      {space.length > 0 && (
        <Section id="the-space" title="The space">
          <Rows rows={space} />
        </Section>
      )}
      {running.length > 0 && (
        <Section id="running-the-business" title="Running the business">
          <Rows rows={running} />
        </Section>
      )}
    </>
  );
}
