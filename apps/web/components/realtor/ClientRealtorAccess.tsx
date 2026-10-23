'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  Pagination,
  SearchInput,
  Skeleton,
  useToast,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

const PAGE_SIZE = 10;

/** `showHeader={false}` when the page already gives its own heading. */
export function ClientRealtorAccess({ showHeader = true }: { showHeader?: boolean } = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [propertiesFor, setPropertiesFor] = useState<string | null>(null);
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertySearch, setPropertySearch] = useState('');
  const invitationSearch = search.trim() || undefined;
  const assignablePropertySearch = propertySearch.trim() || undefined;
  const { data: invitationsData, isLoading } = useQuery({
    queryKey: [
      ...realtorKeys.clientInvitations,
      { page, pageSize: PAGE_SIZE, search: invitationSearch },
    ],
    queryFn: () =>
      unwrap(
        realtorService.listRealtorInvitations({
          page,
          pageSize: PAGE_SIZE,
          search: invitationSearch,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const invitations = invitationsData?.items ?? [];
  const invitationTotal = invitationsData?.total ?? 0;
  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
    enabled: !!propertiesFor,
    queryKey: [
      ...realtorKeys.assignableProperties(propertiesFor ?? ''),
      { page: propertyPage, pageSize: PAGE_SIZE, search: assignablePropertySearch },
    ],
    queryFn: () =>
      unwrap(
        realtorService.getAssignableProperties(propertiesFor!, {
          page: propertyPage,
          pageSize: PAGE_SIZE,
          search: assignablePropertySearch,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const properties = propertiesData?.items ?? [];
  const propertyTotal = propertiesData?.total ?? 0;
  const refreshInvitations = () =>
    queryClient.invalidateQueries({ queryKey: realtorKeys.clientInvitations });
  const approve = useMutation({
    mutationFn: (id: string) => unwrap(realtorService.approveRealtorInvitation(id)),
    onSuccess: () => {
      refreshInvitations();
      toast.success('Realtor access approved.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => unwrap(realtorService.revokeRealtorAccess(id)),
    onSuccess: () => {
      refreshInvitations();
      setPropertiesFor(null);
      toast.success('Realtor access revoked.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const assign = useMutation({
    mutationFn: ({ id, propertyId }: { id: string; propertyId: string }) =>
      unwrap(realtorService.assignProperty(id, propertyId)),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.assignableProperties(id) });
      refreshInvitations();
      toast.success('Property assigned to Realtor.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleProperties = (relationshipId: string) => {
    setPropertiesFor((current) => (current === relationshipId ? null : relationshipId));
    setPropertyPage(1);
    setPropertySearch('');
  };

  return (
    <>
      {showHeader && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Realtor access</h1>
          <p className="mt-1 text-muted-foreground">
            Approve representatives and choose exactly which properties they may manage.
          </p>
        </div>
      )}
      <div className="mb-6 max-w-md">
        <SearchInput
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setPage(1);
            setPropertiesFor(null);
          }}
          placeholder="Search Realtors..."
          label="Search Realtor invitations"
        />
      </div>
      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading invitations" />
      ) : invitations.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            invitationTotal === 0 && invitationSearch
              ? 'No Realtor invitations match your search.'
              : 'No Realtor invitations.'
          }
        />
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="p-5">
              <h2 className="font-semibold text-foreground">
                {invitation.realtor.legalName || invitation.realtor.email}
              </h2>
              <p className="text-sm text-muted-foreground">
                {invitation.realtor.companyName || invitation.realtor.email}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {invitation.status === 'PENDING' ? (
                  <Button
                    isLoading={approve.isPending && approve.variables === invitation.id}
                    onClick={() => approve.mutate(invitation.id)}
                  >
                    Approve access
                  </Button>
                ) : invitation.status === 'ACTIVE' ? (
                  <>
                    <Button variant="outline" onClick={() => toggleProperties(invitation.id)}>
                      Choose properties
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      isLoading={revoke.isPending && revoke.variables === invitation.id}
                      onClick={() => revoke.mutate(invitation.id)}
                    >
                      Revoke
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Access revoked</span>
                )}
              </div>
              {propertiesFor === invitation.id && (
                <div className="mt-4 border-t border-border pt-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium">Your properties</p>
                    <div className="w-full sm:max-w-xs">
                      <SearchInput
                        value={propertySearch}
                        onValueChange={(value) => {
                          setPropertySearch(value);
                          setPropertyPage(1);
                        }}
                        placeholder="Search properties..."
                        label="Search properties available to assign"
                      />
                    </div>
                  </div>
                  {isLoadingProperties ? (
                    <div role="status" aria-label="Loading properties" className="space-y-3 py-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : properties.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">
                      {assignablePropertySearch
                        ? 'No properties match your search.'
                        : 'No properties are available to assign.'}
                    </p>
                  ) : (
                    properties.map((property) => (
                      <div
                        key={property.id}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span className="min-w-0">
                          {property.title} · {property.city}, {property.state}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={
                            assign.isPending && assign.variables?.propertyId === property.id
                          }
                          onClick={() =>
                            assign.mutate({ id: invitation.id, propertyId: property.id })
                          }
                        >
                          Assign
                        </Button>
                      </div>
                    ))
                  )}
                  {propertyTotal > 0 && (
                    <Pagination
                      page={propertyPage}
                      pageSize={PAGE_SIZE}
                      total={propertyTotal}
                      onPageChange={setPropertyPage}
                      className="mt-3"
                    />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      {invitationTotal > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={invitationTotal}
          onPageChange={(nextPage) => {
            setPage(nextPage);
            setPropertiesFor(null);
          }}
          className="mt-6"
        />
      )}
    </>
  );
}
