'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCheck } from 'lucide-react';
import { Button, Card, EmptyState, ListSkeleton, Pagination, useToast } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';

type Assignment = {
  id: string;
  status: string;
  agent: { legalName: string; email: string; companyName?: string | null };
};
type Property = { id: string; title: string; city: string; state: string };

export function ClientAgentAccess() {
  const queryClient = useQueryClient();
  const [propertiesFor, setPropertiesFor] = useState<string | null>(null);
  const toast = useToast();
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);
  const { data: assignmentsData, isLoading } = useQuery({
    queryKey: [...agentKeys.clientAssignments, { page, pageSize: PAGE_SIZE }],
    queryFn: () => unwrap(agentService.listClientAssignments({ page, pageSize: PAGE_SIZE })),
    placeholderData: keepPreviousData,
  });
  const assignments = (assignmentsData?.items ?? []) as Assignment[];
  const assignmentTotal = assignmentsData?.total ?? 0;
  const { data: propertiesData } = useQuery({
    enabled: Boolean(propertiesFor),
    queryKey: [
      ...agentKeys.assignableProperties(propertiesFor ?? ''),
      { page: propertyPage, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        agentService.listAssignableProperties(propertiesFor!, {
          page: propertyPage,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const properties = (propertiesData?.items ?? []) as Property[];
  const propertyTotal = propertiesData?.total ?? 0;
  const refresh = () => queryClient.invalidateQueries({ queryKey: agentKeys.clientAssignments });
  const approve = useMutation({
    mutationFn: (id: string) => unwrap(agentService.approveClientAssignment(id)),
    onSuccess: () => {
      refresh();
      toast.success('Agent access approved.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => unwrap(agentService.revokeClientAssignment(id)),
    onSuccess: () => {
      refresh();
      toast.success('Agent access revoked.');
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const assign = useMutation({
    mutationFn: ({ id, propertyId }: { id: string; propertyId: string }) =>
      unwrap(agentService.assignClientProperty(id, propertyId)),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: agentKeys.assignableProperties(propertiesFor ?? ''),
      });
      toast.success('Property assigned to Agent.');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Field Agent access</h1>
        <p className="mt-1 text-muted-foreground">
          Approve Agents and assign only the properties they may work on.
        </p>
      </div>
      {isLoading ? (
        <ListSkeleton variant="cards" rows={3} label="Loading Agent requests" />
      ) : assignments.length === 0 ? (
        <EmptyState icon={UserCheck} title="No Agent requests." />
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="p-5">
              <h2 className="font-semibold text-foreground">{assignment.agent.legalName}</h2>
              <p className="text-sm text-muted-foreground">
                {assignment.agent.companyName || assignment.agent.email}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {assignment.status === 'PENDING' ? (
                  <Button
                    isLoading={approve.isPending && approve.variables === assignment.id}
                    onClick={() => approve.mutate(assignment.id)}
                  >
                    Approve access
                  </Button>
                ) : assignment.status === 'ACTIVE' ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPropertiesFor(propertiesFor === assignment.id ? null : assignment.id);
                        setPropertyPage(1);
                      }}
                    >
                      Choose properties
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive"
                      isLoading={revoke.isPending && revoke.variables === assignment.id}
                      onClick={() => revoke.mutate(assignment.id)}
                    >
                      Revoke
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">Access revoked</span>
                )}
              </div>
              {propertiesFor === assignment.id && (
                <div className="mt-4 border-t border-border pt-4">
                  {properties.map((property) => (
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
                        isLoading={assign.isPending && assign.variables?.propertyId === property.id}
                        onClick={() =>
                          assign.mutate({ id: assignment.id, propertyId: property.id })
                        }
                      >
                        Assign
                      </Button>
                    </div>
                  ))}
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
      {assignmentTotal > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={assignmentTotal}
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
