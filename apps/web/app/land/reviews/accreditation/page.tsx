import { AccreditationPanel } from '@/components/land/reviews/AccreditationPanel';

export default function LandAccreditationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Professional accreditation</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Surveyors, lawyers, valuers and inspectors are accredited before GetRentos engages them on
          land. Keep your licence current: an expired licence pauses new engagements.
        </p>
      </div>
      <AccreditationPanel />
    </div>
  );
}
