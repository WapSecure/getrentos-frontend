'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Toast, type ToastVariant } from '@/components/ui/Toast';
import { unwrap } from '@/lib/apiHelpers';
import { agentService } from '@/services/agentService';

type Assignment = { id: string; status: string; agent: { legalName: string; email: string; companyName?: string | null } };
type Property = { id: string; title: string; city: string; state: string };

export function ClientAgentAccess() {
  const queryClient = useQueryClient();
  const [propertiesFor, setPropertiesFor] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const { data: assignments = [], isLoading } = useQuery({ queryKey: ['client', 'agent-assignments'], queryFn: () => unwrap(agentService.listClientAssignments()) as Promise<Assignment[]> });
  const { data: properties = [] } = useQuery({ enabled: Boolean(propertiesFor), queryKey: ['client', 'agent-properties', propertiesFor], queryFn: () => unwrap(agentService.listAssignableProperties(propertiesFor!)) as Promise<Property[]> });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['client', 'agent-assignments'] });
  const approve = useMutation({ mutationFn: (id: string) => unwrap(agentService.approveClientAssignment(id)), onSuccess: () => { refresh(); setToast({ message: 'Agent access approved.', variant: 'success' }); }, onError: (error: Error) => setToast({ message: error.message, variant: 'error' }) });
  const revoke = useMutation({ mutationFn: (id: string) => unwrap(agentService.revokeClientAssignment(id)), onSuccess: () => { refresh(); setToast({ message: 'Agent access revoked.', variant: 'success' }); }, onError: (error: Error) => setToast({ message: error.message, variant: 'error' }) });
  const assign = useMutation({ mutationFn: ({ id, propertyId }: { id: string; propertyId: string }) => unwrap(agentService.assignClientProperty(id, propertyId)), onSuccess: () => setToast({ message: 'Property assigned to Agent.', variant: 'success' }), onError: (error: Error) => setToast({ message: error.message, variant: 'error' }) });
  return <><div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Field Agent access</h1><p className="mt-1 text-muted-foreground">Approve Agents and assign only the properties they may work on.</p></div>{isLoading ? <p className="text-sm text-muted-foreground">Loading Agent requests…</p> : assignments.length === 0 ? <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No Agent requests.</div> : <div className="space-y-4">{assignments.map((assignment) => <div key={assignment.id} className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold text-foreground">{assignment.agent.legalName}</h2><p className="text-sm text-muted-foreground">{assignment.agent.companyName || assignment.agent.email}</p><div className="mt-4 flex flex-wrap gap-2">{assignment.status === 'PENDING' ? <Button isLoading={approve.isPending} onClick={() => approve.mutate(assignment.id)}>Approve access</Button> : <><Button variant="outline" onClick={() => setPropertiesFor(propertiesFor === assignment.id ? null : assignment.id)}>Choose properties</Button><Button variant="ghost" className="text-destructive" isLoading={revoke.isPending} onClick={() => revoke.mutate(assignment.id)}>Revoke</Button></>}</div>{propertiesFor === assignment.id && <div className="mt-4 border-t border-border pt-4">{properties.map((property) => <div key={property.id} className="flex items-center justify-between py-2 text-sm"><span>{property.title} · {property.city}, {property.state}</span><Button size="sm" variant="outline" isLoading={assign.isPending} onClick={() => assign.mutate({ id: assignment.id, propertyId: property.id })}>Assign</Button></div>)}</div>}</div>)}</div>}{toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}</>;
}
