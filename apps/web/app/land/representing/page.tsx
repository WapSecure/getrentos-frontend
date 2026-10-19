import { RepresentingDesk } from '@/components/land/representatives/RepresentingDesk';

export default function LandRepresentingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Buyers I represent</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          People buying land who asked you to act for them. You can only do what each one allowed.
        </p>
      </div>
      <RepresentingDesk />
    </div>
  );
}
