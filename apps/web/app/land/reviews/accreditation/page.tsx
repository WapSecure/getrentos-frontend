import { AccreditationPanel } from '@/components/land/reviews/AccreditationPanel';
import { PageHeader } from '@getrentos/ui';

export default function LandAccreditationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Professional accreditation"
        description="Surveyors, lawyers, valuers and inspectors are accredited before GetRentos engages them on land. Keep your licence current: an expired licence pauses new engagements."
      />
      <AccreditationPanel />
    </div>
  );
}
