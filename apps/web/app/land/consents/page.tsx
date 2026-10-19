import { ConsentRequestList } from '@/components/land/authority/ConsentRequestList';

export default function LandConsentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Land sale consents</h1>
        <p className="mt-1 text-muted-foreground">
          Sellers who named you as someone whose consent their land sale needs. Consent only if you
          agree to the sale. If you object, the sale is paused and GetRentos looks into it.
        </p>
      </div>
      <ConsentRequestList />
    </div>
  );
}
