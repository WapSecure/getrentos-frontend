'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Building2, FileSignature, KeyRound, MapPin, ShieldAlert } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageErrorState } from '@getrentos/ui';
import { useCustody } from '@/components/agency/CustodyProvider';
import { unwrap } from '@/lib/apiHelpers';
import { authorityKeys } from '@/lib/queryKeys';
import { propertyAuthorityService } from '@/services/propertyAuthorityService';
import { grantsNothing, noticeSummary } from '@/services/mandateService';

/**
 * The workspace: one client's properties, and what this engagement lets you do
 * with them.
 *
 * Deliberately built around the SELECTED client rather than around everything the
 * firm holds. An owner's portal answers "what do I have"; a manager's has to
 * answer "what may I do for the person who hired me", and those are different
 * questions with different answers for the same property.
 *
 * It refuses to guess. With no client selected it shows nothing and says why,
 * rather than falling back to the whole portfolio — acting on the wrong client's
 * property is the failure the custody bar exists to prevent, and a helpful
 * default would be the same bug wearing a friendlier face.
 */
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
    // Nothing to ask for until we know which client. Skipping the query rather
    // than filtering the answer keeps "no selection" from looking like "no
    // properties".
    enabled: Boolean(selected),
  });

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-6">
        <div className="h-6 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error) {
    return <PageErrorState description={error} />;
  }

  if (live.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <EmptyState
          icon={FileSignature}
          title="Nothing to act on yet"
          description="A mandate has to be signed by both sides and verified by GetRentos before it lets you do anything. You will see the properties here the moment it does."
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
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em]">
            {selected.propertyTitle ?? 'Property'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            For {selected.ownerName ?? 'the owner'} · {noticeSummary(selected)}
          </p>
        </div>
        <Button variant="outline" href="/agency/mandates">
          Manage mandates
        </Button>
      </header>

      {grantsNothing(selected) && (
        <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span>
            This mandate is agreed but its scope grants no access yet, so there is nothing to act
            on. That is the scope rather than missing data.
          </span>
        </div>
      )}

      {propertiesError && (
        <PageErrorState
          description={(propertiesError as Error).message}
          onRetry={() => void refetch()}
        />
      )}

      {loadingProperties ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No property in this engagement yet"
          description="The mandate names a property; if it is not showing, the engagement may not be verified yet."
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
                      {[property.address, property.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                  <Link
                    href={`/landlord/properties/${property.propertyId}`}
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
