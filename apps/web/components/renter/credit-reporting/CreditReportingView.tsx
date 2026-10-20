import { Building2, ShieldCheck } from 'lucide-react';
import { Alert, Card } from '@getrentos/ui';

export const CreditReportingView = () => {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-secondary p-3">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="max-w-2xl">
          <h1 className="text-xl font-semibold text-foreground">
            Credit reporting is not available
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            GetRentos does not currently submit rent payments to a credit bureau. There is no
            enrollment to complete and no payment data will be shared for credit reporting.
          </p>
          <Alert variant="neutral" icon={ShieldCheck} className="mt-4">
            If this service launches, it will include explicit consent, withdrawal, correction,
            retention and dispute controls before any bureau receives data.
          </Alert>
        </div>
      </div>
    </Card>
  );
};
