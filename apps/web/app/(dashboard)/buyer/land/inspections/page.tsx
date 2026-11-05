import { BuyerInspections } from '@/components/land/inspections/BuyerInspections';
import { PageHeader } from '@getrentos/ui';

export default function BuyerLandInspectionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Independent inspections"
        description="An accredited inspector visits land you are considering and reports with geotagged, timestamped photos. GetRentos checks each report before you see it."
      />
      <BuyerInspections />
    </div>
  );
}
