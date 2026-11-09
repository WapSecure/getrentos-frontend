import { AccreditationPanel } from '@/components/land/reviews/AccreditationPanel';
import { PageHeader } from '@sureground/ui';

export default function LandAccreditationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Professional accreditation"
        description="Surveyors, lawyers, valuers and inspectors are accredited before Sureground engages them on land. Keep your licence current: an expired licence pauses new engagements."
      />
      <AccreditationPanel />
    </div>
  );
}
