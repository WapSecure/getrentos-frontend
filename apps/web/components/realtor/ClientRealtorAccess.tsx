'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Toast, type ToastVariant } from '@/components/ui/Toast';
import { unwrap } from '@/lib/apiHelpers';
import { realtorService } from '@/services/realtorService';

type Invitation = { id: string; status: string; realtor: { legalName: string; email: string; companyName?: string | null } };
type Property = { id: string; title: string; city: string; state: string };

export function ClientRealtorAccess() {
  const client = useQueryClient(); const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null); const [propertiesFor, setPropertiesFor] = useState<string | null>(null);
  const { data: invitations = [], isLoading } = useQuery({ queryKey: ['client', 'realtor-invitations'], queryFn: () => unwrap(realtorService.listRealtorInvitations()) as Promise<Invitation[]> });
  const { data: properties = [] } = useQuery({ enabled: !!propertiesFor, queryKey: ['client', 'realtor-properties', propertiesFor], queryFn: () => unwrap(realtorService.getAssignableProperties(propertiesFor!)) as Promise<Property[]> });
  const refresh = () => client.invalidateQueries({ queryKey: ['client', 'realtor-invitations'] });
  const approve = useMutation({ mutationFn: (id: string) => unwrap(realtorService.approveRealtorInvitation(id)), onSuccess: () => { refresh(); setToast({ message: 'Realtor access approved.', variant: 'success' }); }, onError: (error: Error) => setToast({ message: error.message, variant: 'error' }) });
  const revoke = useMutation({ mutationFn: (id: string) => unwrap(realtorService.revokeRealtorAccess(id)), onSuccess: () => { refresh(); setToast({ message: 'Realtor access revoked.', variant: 'success' }); }, onError: (error: Error) => setToast({ message: error.message, variant: 'error' }) });
  const assign = useMutation({ mutationFn: ({ id, propertyId }: { id: string; propertyId: string }) => unwrap(realtorService.assignProperty(id, propertyId)), onSuccess: () => { setToast({ message: 'Property assigned to Realtor.', variant: 'success' }); }, onError: (error: Error) => setToast({ message: error.message, variant: 'error' }) });
  return <><div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Realtor access</h1><p className="mt-1 text-muted-foreground">Approve representatives and choose exactly which properties they may manage.</p></div>{isLoading ? <p className="text-sm text-muted-foreground">Loading invitations…</p> : invitations.length === 0 ? <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">No pending Realtor invitations.</div> : <div className="space-y-4">{invitations.map((invitation) => <div key={invitation.id} className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold text-foreground">{invitation.realtor.legalName}</h2><p className="text-sm text-muted-foreground">{invitation.realtor.companyName || invitation.realtor.email}</p><div className="mt-4 flex flex-wrap gap-2">{invitation.status === 'PENDING' ? <Button isLoading={approve.isPending} onClick={() => approve.mutate(invitation.id)}>Approve access</Button> : <><Button variant="outline" onClick={() => setPropertiesFor(propertiesFor === invitation.id ? null : invitation.id)}>Choose properties</Button><Button variant="ghost" className="text-destructive" isLoading={revoke.isPending} onClick={() => revoke.mutate(invitation.id)}>Revoke</Button></>}</div>{propertiesFor === invitation.id && <div className="mt-4 border-t border-border pt-4"><p className="mb-2 text-sm font-medium">Your properties</p>{properties.map((property) => <div key={property.id} className="flex items-center justify-between py-2 text-sm"><span>{property.title} · {property.city}, {property.state}</span><Button size="sm" variant="outline" isLoading={assign.isPending} onClick={() => assign.mutate({ id: invitation.id, propertyId: property.id })}>Assign</Button></div>)}</div>}</div>)}</div>}{toast && <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />}</>;
}
