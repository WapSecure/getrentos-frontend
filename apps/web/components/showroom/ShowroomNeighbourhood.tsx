import { GeoInsightsPanel } from '@/components/maps/GeoInsightsPanel';

export function ShowroomNeighbourhood({ listingId, title }: { listingId: string; title: string }) {
  return (
    <section aria-label="Location and neighbourhood" className="border-t border-border/70 pt-8">
      <GeoInsightsPanel listingId={listingId} title={title} audience="public" />
    </section>
  );
}
