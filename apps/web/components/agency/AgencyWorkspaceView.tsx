'use client';

import { formatLocation } from '@sureground/shared';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  CalendarX,
  FileSignature,
  KeyRound,
  MapPin,
  ShieldAlert,
} from '@sureground/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardSkeleton,
  EmptyState,
  PageErrorState,
  PageHeader,
  Skeleton,
} from '@sureground/ui';
import { useCustody } from '@/components/agency/CustodyProvider';
import { unwrap } from '@/lib/apiHelpers';
import { ROUTES } from '@/lib/constants/auth';
import { authorityKeys } from '@/lib/queryKeys';
import { propertyAuthorityService } from '@/services/propertyAuthorityService';
import {
  endedOn,
  formatDay,
  grantsNothing,
  hasEnded,
  noticeSummary,
} from '@/services/mandateService';
import { describeAgencyError } from './agencyAccess';

// With no client selected this shows nothing rather than the whole portfolio: acting on the wrong client's property is what the custody bar prevents.
export function AgencyWorkspaceView() {
  const { selected, live, loading, error } = useCustody();

  const {
    data: managed,
    isLoading: loadingProperties,
    error: propertiesError,
    refetch,
  } = useQuery({
    queryKey: authorityKeys.managed,
    queryFn: () => unwrap(propertyAuthorityService.managed()),
    // Skip the query rather than filter the answer, so "no selection" never looks like "no properties".
    enabled: Boolean(selected),
  });

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <Skeleton className="h-6 w-64" />
        <CardSkeleton className="mt-4" />
      </div>
    );
  }

  if (error && live.length === 0) {
    return <PageErrorState description={error} />;
  }

  if (selected && hasEnded(selected)) {
    const on = endedOn(selected);
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState
          icon={CalendarX}
          title={on ? `This engagement ended on ${formatDay(on)}` : 'This engagement has ended'}
          description={`You no longer act for ${selected.ownerName ?? 'the owner'} on ${selected.propertyTitle ?? 'this property'}. Its record stays on the mandate${live.length > 0 ? '; choose another client in the bar above to keep working' : ''}.`}
          action={<Button href={`/agency/mandates/${selected.id}`}>View the engagement</Button>}
        />
      </div>
    );
  }

  if (live.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState
          icon={FileSignature}
          title="Nothing to act on yet"
          description="A mandate has to be signed by both sides and verified by Sureground before it lets you do anything. You will see the properties here the moment it does."
          action={<Button href="/agency/mandates">See your mandates</Button>}
        />
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState
          icon={KeyRound}
          title="Choose who you are acting for"
          description="You hold more than one engagement. Pick a client in the bar above, and this workspace will show only their properties and only what you are allowed to do with them."
          action={<Button href="/agency/mandates">See your mandates</Button>}
        />
      </div>
    );
  }

  const properties = (managed ?? []).filter(
    (property) => property.propertyId === selected.propertyId
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6">
      <PageHeader
        title={selected.propertyTitle ?? 'Property'}
        description={
          <>
            For {selected.ownerName ?? 'the owner'} · {noticeSummary(selected)}
          </>
        }
        actions={
          <Button variant="outline" href="/agency/mandates">
            Manage mandates
          </Button>
        }
      />

      {grantsNothing(selected) && (
        <Alert variant="neutral" icon={ShieldAlert}>
          This mandate is agreed but its scope grants no access yet, so there is nothing to act on.
          That is the scope rather than missing data.
        </Alert>
      )}

      {propertiesError && !managed && (
        <PageErrorState
          description={describeAgencyError(propertiesError)}
          onRetry={() => void refetch()}
        />
      )}

      {loadingProperties ? (
        <CardSkeleton />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No property in this engagement yet"
          description="The mandate names a property, but it is not in the list of properties you can act on right now. Check the engagement's status under Manage mandates."
        />
      ) : (
        <ul className="space-y-4">
          {properties.map((property) => (
            <li key={property.propertyId}>
              <Card static className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="font-medium">{property.title}</span>
                      <Badge variant="info">{property.propertyType}</Badge>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {formatLocation(property.address, property.city)}
                    </p>
                  </div>
                  <Link
                    // The owner workspace has no per-property page; a property opens as its units.
                    href={`${ROUTES.LANDLORD_UNITS}?property=${property.propertyId}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open the property
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
