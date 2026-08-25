'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Button, Input, Pagination, Toast, type ToastVariant } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { realtorService } from '@/services/realtorService';

const PAGE_SIZE = 10;

export function ClientRealtorAccess() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
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
  });
  const properties = propertiesData?.items ?? [];
  const propertyTotal = propertiesData?.total ?? 0;
  const refreshInvitations = () =>
    queryClient.invalidateQueries({ queryKey: realtorKeys.clientInvitations });
  const approve = useMutation({
    mutationFn: (id: string) => unwrap(realtorService.approveRealtorInvitation(id)),
    onSuccess: () => {
      refreshInvitations();
      setToast({ message: 'Realtor access approved.', variant: 'success' });
    },
    onError: (error: Error) => setToast({ message: error.message, variant: 'error' }),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => unwrap(realtorService.revokeRealtorAccess(id)),
    onSuccess: () => {
      refreshInvitations();
      setPropertiesFor(null);
      setToast({ message: 'Realtor access revoked.', variant: 'success' });
    },
    onError: (error: Error) => setToast({ message: error.message, variant: 'error' }),
  });
  const assign = useMutation({
    mutationFn: ({ id, propertyId }: { id: string; propertyId: string }) =>
      unwrap(realtorService.assignProperty(id, propertyId)),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: realtorKeys.assignableProperties(id) });
      refreshInvitations();
      setToast({ message: 'Property assigned to Realtor.', variant: 'success' });
    },
    onError: (error: Error) => setToast({ message: error.message, variant: 'error' }),
  });

  const toggleProperties = (relationshipId: string) => {
    setPropertiesFor((current) => (current === relationshipId ? null : relationshipId));
    setPropertyPage(1);
    setPropertySearch('');
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Realtor access</h1>
        <p className="mt-1 text-muted-foreground">
          Approve representatives and choose exactly which properties they may manage.
        </p>
      </div>
      <div className="mb-6 max-w-md">
        <Input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
            setPropertiesFor(null);
          }}
          placeholder="Search Realtors..."
          leadingIcon={<Search className="h-4 w-4" />}
          aria-label="Search Realtor invitations"
        />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading invitations…</p>
      ) : invitations.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          {invitationTotal === 0 && invitationSearch
            ? 'No Realtor invitations match your search.'
            : 'No Realtor invitations.'}
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <div key={invitation.id} className="rounded-2xl border border-border bg-card p-5">
              <h2 className="font-semibold text-foreground">
                {invitation.realtor.legalName || invitation.realtor.email}
              </h2>
              <p className="text-sm text-muted-foreground">
                {invitation.realtor.companyName || invitation.realtor.email}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {invitation.status === 'PENDING' ? (
                  <Button
                    isLoading={approve.isPending}
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
                      isLoading={revoke.isPending}
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
                      <Input
                        type="search"
                        value={propertySearch}
                        onChange={(event) => {
                          setPropertySearch(event.target.value);
                          setPropertyPage(1);
                        }}
                        placeholder="Search properties..."
                        leadingIcon={<Search className="h-4 w-4" />}
                        aria-label="Search properties available to assign"
                      />
                    </div>
                  </div>
                  {isLoadingProperties ? (
                    <p className="py-2 text-sm text-muted-foreground">Loading properties…</p>
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
                        <span>
                          {property.title} · {property.city}, {property.state}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={assign.isPending}
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
            </div>
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
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </>
  );
}
