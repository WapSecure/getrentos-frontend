import {
  DEVELOPMENT_STAGE_LABEL,
  completionLabel,
  type ShowroomDevelopmentSummary,
} from '@sureground/shared/showroom';
import { ListingCard } from '@sureground/ui';
import { developmentPath } from '@/lib/publicDevelopments';

/** A live development in a grid: the shared listing card, worded for off-plan. */
export function DevelopmentCard({
  development: d,
  eager = false,
}: {
  development: ShowroomDevelopmentSummary;
  eager?: boolean;
}) {
  const completion = completionLabel(d.expectedCompletion);
  return (
    <ListingCard
      title={d.name}
      href={developmentPath(d.id)}
      location={`${d.city}, ${d.state}`}
      price={d.priceFromNaira ?? null}
      priceNote={d.priceFromNaira ? 'From, as the developer states it' : undefined}
      image={d.cover?.url ?? null}
      imageAlt={d.cover?.alt ?? d.name}
      {...(d.cover?.width && d.cover.height
        ? {
            imagePreview: {
              width: d.cover.width,
              height: d.cover.height,
              ...(d.cover.placeholder ? { placeholder: d.cover.placeholder } : {}),
            },
          }
        : {})}
      eager={eager}
      status={DEVELOPMENT_STAGE_LABEL[d.stage]}
      statusVariant="neutral"
      meta={[
        `By ${d.developerName}`,
        completion ? `Expected ${completion}` : null,
        d.cover?.source === 'render' ? "Artist's impression" : null,
      ]
        .filter(Boolean)
        .join(' · ')}
    />
  );
}
