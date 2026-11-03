'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@getrentos/ui';
import { Application } from '@/types/renter';

interface ApplicationAnalyticsProps {
  applications: Application[];
}

export const ApplicationAnalytics = ({ applications }: ApplicationAnalyticsProps) => {
  const total = applications.length;
  const approved = applications.filter((a) => a.status === 'approved').length;
  const rejected = applications.filter((a) => a.status === 'rejected').length;
  const pending = applications.filter(
    (a) => a.status === 'pending' || a.status === 'under_review'
  ).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Status summary</CardTitle>
        <CardDescription>Applications shown on this page</CardDescription>
      </CardHeader>
      <dl className="divide-y divide-border px-5 pb-3">
        {[
          ['Awaiting a decision', pending],
          ['Approved', approved],
          ['Not approved', rejected],
          ['Total shown', total],
        ].map(([label, value]) => (
          <div key={String(label)} className="flex items-center justify-between py-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="data-value font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};
