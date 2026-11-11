import { BuyerInspections } from '@/components/shared/inspections/BuyerInspections';
import { PageHeader } from '@sureground/ui';

export default function BuyerLandInspectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Independent inspections"
        description="An accredited inspector visits land you are considering and reports with geotagged, timestamped photos. Sureground checks each report before you see it."
      />
      <BuyerInspections scope="land" />
    </div>
  );
}
