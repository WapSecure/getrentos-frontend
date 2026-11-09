'use client';

import { useQuery } from '@tanstack/react-query';
import { Sparkles } from 'lucide-react';
import { Card, Skeleton } from '@sureground/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';

// Never ranks or recommends: the decision is the landlord's. Hidden if it fails; the full report below is the record.
export function ApplicantSummary({ applicationId }: { applicationId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: landlordKeys.applicantSummary(applicationId),
    queryFn: () => unwrap(landlordService.getApplicantSummary(applicationId)),
    staleTime: 10 * 60_000,
    retry: false,
  });

  if (isLoading) {
    return (
      <Card static className="space-y-2 p-4">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }
  if (!data) return null;

  return (
    <Card static className="space-y-3 p-4" aria-labelledby="applicant-summary-title">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 id="applicant-summary-title" className="text-sm font-semibold text-foreground">
          Summary of the facts
        </h3>
      </div>
      <p className="text-sm text-foreground">{data.summary}</p>
      {data.questions.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Questions to ask the applicant</p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {data.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}
      {data.checks.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">Before you decide</p>
          <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
            {data.checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-2xs text-muted-foreground">{data.disclaimer}</p>
    </Card>
  );
}
