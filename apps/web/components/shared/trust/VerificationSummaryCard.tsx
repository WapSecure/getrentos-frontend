import { VERIFICATION_SUMMARY_STATUS, type VerificationSummary } from '@sureground/shared';
import { Alert, type AlertVariant } from '@sureground/ui/Alert';
import { Badge } from '@sureground/ui/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@sureground/ui/Card';
import { DescriptionList, type DescriptionItem } from '@sureground/ui/DescriptionList';
import { formatDate } from '@/lib/format';
import { verificationSummaryBadges } from '@/lib/statusBadge';
import { TrustLabelsList } from './TrustLabelsList';

/** The summary's status as a badge, from the shared map (same words as the card). */
export function VerificationSummaryBadge({
  summary,
  className,
}: {
  summary: VerificationSummary;
  className?: string;
}) {
  const { label, variant, icon: Icon } = verificationSummaryBadges[summary.status];
  return (
    <Badge variant={variant} icon={Icon && <Icon className="h-3.5 w-3.5" />} className={className}>
      {label}
    </Badge>
  );
}

// The API sends roles in sentence case ("Accredited surveyor"); they sit mid-sentence after "by".
const inSentence = (role: string) =>
  role.startsWith('Sureground') ? role : role.charAt(0).toLowerCase() + role.slice(1);

const issuesVariant = (status: VerificationSummary['status']): AlertVariant =>
  status === 'REJECTED'
    ? 'danger'
    : status === 'NOT_STARTED' || status === 'SUBMITTED'
      ? 'neutral'
      : 'warning';

/**
 * A listing's verification summary (DIA-11): status, what was checked, by whom and when,
 * the documents seen, what is still open, the re-check date, and what it does not cover.
 * The limits are always shown, whatever the status.
 */
export function VerificationSummaryCard({ summary }: { summary: VerificationSummary }) {
  const { status, scope, checkedAt, checkedBy, documentsReviewed, openIssues, limits, recheckBy } =
    summary;
  const showChecks = scope.length > 0 && !!checkedAt;

  const details: DescriptionItem[] = [
    {
      label: 'Documents reviewed',
      value: documentsReviewed.length
        ? documentsReviewed.map((document) => document.label).join(', ')
        : 'None yet',
    },
  ];
  if (!showChecks && checkedAt)
    details.push({ label: 'Last checked', value: formatDate(checkedAt, 'long') });
  if (!showChecks && checkedBy.length)
    details.push({ label: 'Checked by', value: checkedBy.join(', ') });
  if (recheckBy) details.push({ label: 'Re-check due by', value: formatDate(recheckBy, 'long') });

  return (
    <Card>
      <CardHeader action={<VerificationSummaryBadge summary={summary} />}>
        <CardTitle>Sureground verification</CardTitle>
        <CardDescription>{VERIFICATION_SUMMARY_STATUS[status].description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {showChecks && (
          <TrustLabelsList
            footnote={false}
            labels={[
              {
                kind: 'VERIFICATION_SUMMARY',
                title:
                  status === 'VERIFICATION_EXPIRED'
                    ? 'Checked, but now lapsed'
                    : 'What was checked',
                scope,
                checkedAt,
                checkedBy: checkedBy.map(inSentence),
              },
            ]}
          />
        )}

        <DescriptionList layout="rows" items={details} />

        {openIssues.length > 0 && (
          <Alert variant={issuesVariant(status)} title="Still open">
            <ul className="list-disc space-y-1 pl-4">
              {openIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Alert>
        )}

        <div>
          <p className="text-sm font-medium text-foreground">What this does not cover</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {limits.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
