import { BuyerInspections } from '@/components/land/inspections/BuyerInspections';

export default function BuyerLandInspectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Independent inspections</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          An accredited inspector visits land you are considering and reports with geotagged,
          timestamped photos. GetRentos checks each report before you see it.
        </p>
      </div>
      <BuyerInspections />
    </div>
  );
}
