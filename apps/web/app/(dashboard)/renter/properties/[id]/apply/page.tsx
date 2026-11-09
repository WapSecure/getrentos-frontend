'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Search } from 'lucide-react';
import {
  Button,
  EmptyState,
  PageErrorState,
  PageLoadingState,
  clearSessionDraft,
  PageHeader,
} from '@sureground/ui';
import {
  ApplicationWizard,
  applicationDraftKey,
  type ApplicationFormData,
} from '@/components/renter/property-apply/ApplicationWizard';
import { useRenterUser } from '../../../layout';
import { ROUTES, buildRoute } from '@/lib/constants/auth';
import type { Property } from '@/types/renter';
import { renterService } from '@/services/renterService';
import { kycService } from '@/services/kycService';
import { unwrap, unwrapOptional, ApiError } from '@/lib/apiHelpers';
import { applyLastApplication } from '@sureground/shared';
import { renterKeys } from '@/lib/queryKeys';
import { VerificationRequiredNotice } from '@/components/shared/verification/VerificationRequiredNotice';

/** Matches the `min` the move-in picker enforces, so the two cannot disagree. */
const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * `availableFrom` is the listing's own date and is often already in the past
 * (a stale advert, or seed data). The picker sets `min` to today, but `min`
 * does NOT clamp a value that is pre-filled into it: so defaulting straight to
 * `availableFrom` let an application be submitted with a move-in date that had
 * already gone by. Fall back to the earliest date the picker actually offers.
 */
const earliestMoveInDate = (availableFrom?: string | null): string => {
  const today = todayIso();
  const available = availableFrom?.slice(0, 10);
  return available && available >= today ? available : today;
};

const buildInitialData = (
  property: Property | null,
  user: { fullName: string; email: string } | null
): ApplicationFormData => ({
  fullName: user?.fullName || '',
  email: user?.email || '',
  phone: '',
  currentAddress: '',
  employer: '',
  employmentStatus: 'Employed',
  monthlyIncome: '',
  moveInDate: earliestMoveInDate(property?.availableFrom),
  leaseTerm: '12 months',
  notes: '',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
  referenceName: '',
  referencePhone: '',
  referenceRelationship: '',
  documents: [
    { name: 'Government ID', uploaded: false, required: true },
    { name: 'Proof of Income', uploaded: false, required: true },
    { name: 'Bank Statement', uploaded: false, required: true },
    { name: 'Reference Letter', uploaded: false, required: false },
    { name: 'Credit Report', uploaded: false, required: false },
  ],
});

/** Turns the API's refusal into a sentence that says what to change and where. */
function refusalMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 400) {
    const body = error.details as { message?: string | string[] } | undefined;
    const messages = Array.isArray(body?.message)
      ? body.message
      : body?.message
        ? [body.message]
        : [];
    if (messages.some((m) => /^references\./.test(m)))
      return 'Your reference needs a name and a phone number. Go back to Employment and complete them, or clear the reference.';
    if (messages.some((m) => /^nextOfKin/.test(m)))
      return 'Your next of kin needs a name and a phone number. Go back to Employment and complete them, or clear the entry.';
    if (messages.length) return `The application was not accepted: ${messages[0]}.`;
  }
  return error instanceof Error && error.message
    ? error.message
    : 'The application could not be sent. Please try again.';
}

export default function PropertyApplyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useRenterUser();
  const [submitted, setSubmitted] = useState(false);

  const propertyQuery = useQuery({
    queryKey: renterKeys.listing(params.id),
    queryFn: () => unwrap(renterService.getListing(params.id)),
  });
  const property = propertyQuery.data ?? null;

  // Gate the whole wizard on identity verification, rather than only rejecting
  // at submit: a renter shouldn't fill four steps and upload documents only to
  // be turned away at the end (and lose the draft).
  const kycQuery = useQuery({
    queryKey: ['kyc-status'],
    queryFn: () => unwrap(kycService.getStatus()),
  });
  // What the renter told us last time, so this form starts filled in. A
  // failure (or an API without the endpoint yet) just means an empty form.
  const lastDetailsQuery = useQuery({
    queryKey: renterKeys.lastApplicationDetails,
    queryFn: () => unwrapOptional(renterService.getLastApplicationDetails(), null),
    staleTime: 5 * 60_000,
    retry: false,
  });
  // The server's own answer (review or NIN); the old review row only as a fallback.
  const identityApproved =
    kycQuery.data?.identityVerified ?? kycQuery.data?.identity?.status === 'APPROVED';
  const verificationHref = `${ROUTES.RENTER_SETTINGS}?tab=verification`;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const submitMutation = useMutation({
    mutationFn: (data: ApplicationFormData) =>
      unwrap(renterService.submitApplication(property?.id ?? '', data)),
    onMutate: () => setSubmitError(null),
    // The API's validation messages name DTO fields; say which step to fix.
    onError: (error) => setSubmitError(refusalMessage(error)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: renterKeys.applications });
      queryClient.invalidateQueries({ queryKey: renterKeys.dashboardStats });
      clearSessionDraft(applicationDraftKey(property?.id ?? params.id));
      setSubmitted(true);
    },
  });

  const handleSubmit = async (data: ApplicationFormData) => {
    await submitMutation.mutateAsync(data);
  };

  if (propertyQuery.isLoading || kycQuery.isLoading || lastDetailsQuery.isLoading)
    return <PageLoadingState />;

  if (propertyQuery.isError && !propertyQuery.data) {
    return (
      <PageErrorState
        title="Application form is unavailable"
        description="We could not load the property required for this application. No application has been submitted."
        onRetry={() => void propertyQuery.refetch()}
        isRetrying={propertyQuery.isFetching}
      />
    );
  }

  if (!property) {
    return (
      <EmptyState
        icon={Search}
        title="Property not found"
        description="This listing may have been removed or the link is incorrect."
        action={
          <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
            Back to Discover
          </Button>
        }
      />
    );
  }

  if (property.acceptingApplications === false) {
    return (
      <EmptyState
        icon={Search}
        title="No longer accepting applications"
        description="This unit has been let, so it isn't accepting new applications. No application has been submitted and no documents were shared."
        action={
          <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
            Find another home
          </Button>
        }
      />
    );
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-success-subtle flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-success" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Application submitted</h1>
        <p className="text-muted-foreground mt-2">
          Your application for <span className="text-foreground font-medium">{property.title}</span>{' '}
          has been sent to {property.landlordName || 'the landlord'}. You&apos;ll be notified as
          soon as there&apos;s an update.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button variant="primary" onClick={() => router.push(ROUTES.RENTER_APPLICATIONS)}>
            View my applications
          </Button>
          <Button variant="outline" onClick={() => router.push(ROUTES.RENTER_DISCOVER)}>
            Keep browsing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        href={buildRoute.renterPropertyDetail(property.id)}
        icon={<ArrowLeft className="w-4 h-4" />}
        className="mb-4"
      >
        Back to property
      </Button>

      <PageHeader
        title="Apply to rent"
        description={
          <>
            {property.title} · {property.location}
          </>
        }
      />

      <div className="max-w-2xl space-y-4">
        {identityApproved ? (
          <>
            {submitMutation.error && (
              <VerificationRequiredNotice error={submitMutation.error} href={verificationHref} />
            )}
            <ApplicationWizard
              submitError={submitError}
              property={property}
              initialData={applyLastApplication(
                buildInitialData(property, user),
                lastDetailsQuery.data
              )}
              onSubmit={handleSubmit}
              isSubmitting={submitMutation.isPending}
            />
          </>
        ) : (
          <div className="space-y-3">
            <VerificationRequiredNotice
              error={{ reason: 'IDENTITY_REQUIRED' }}
              href={verificationHref}
              verificationHref={verificationHref}
            />
            <p className="text-sm text-muted-foreground">
              Verify your identity to apply for this home. It only takes a minute, and you can pick
              up your application here once it&apos;s approved.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
