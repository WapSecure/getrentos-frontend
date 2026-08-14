'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { agentService } from '@/services/agentService';
import { unwrap } from '@/lib/apiHelpers';

type Assignment = { id: string; status: string; agent: { id: string; legalName: string } };
type Property = { id: string; title: string; city: string; state: string };

export function ClientAgentTaskForm() {
  const [assignmentId, setAssignmentId] = useState(''); const [propertyId, setPropertyId] = useState(''); const [title, setTitle] = useState(''); const [type, setType] = useState('INSPECTION'); const [priority, setPriority] = useState('MEDIUM'); const [dueAt, setDueAt] = useState('');
  const { data: assignments = [] } = useQuery({ queryKey: ['client', 'agent-assignments'], queryFn: () => unwrap(agentService.listClientAssignments()) as Promise<Assignment[]> });
  const selected = assignments.find((item) => item.id === assignmentId);
  const { data: properties = [] } = useQuery({ enabled: Boolean(assignmentId), queryKey: ['client', 'agent-properties', assignmentId], queryFn: () => unwrap(agentService.listAssignableProperties(assignmentId)) as Promise<Property[]> });
  const create = useMutation({ mutationFn: () => unwrap(agentService.createClientTask({ agentId: selected!.agent.id, propertyId, title, type, priority, dueAt: new Date(dueAt).toISOString() })), onSuccess: () => { setTitle(''); setPropertyId(''); setDueAt(''); } });
  const active = assignments.filter((item) => item.status === 'ACTIVE');
  return <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-semibold text-foreground">Create field task</h2><p className="mt-1 text-sm text-muted-foreground">Tasks can only be assigned to an approved Agent for an explicitly assigned property.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><select className="rounded-lg border border-border bg-background p-2 text-sm" value={assignmentId} onChange={(event) => { setAssignmentId(event.target.value); setPropertyId(''); }}><option value="">Select Agent</option>{active.map((item) => <option key={item.id} value={item.id}>{item.agent.legalName}</option>)}</select><select className="rounded-lg border border-border bg-background p-2 text-sm" value={propertyId} disabled={!assignmentId} onChange={(event) => setPropertyId(event.target.value)}><option value="">Select property</option>{properties.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.city}</option>)}</select><input className="rounded-lg border border-border bg-background p-2 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" /><input className="rounded-lg border border-border bg-background p-2 text-sm" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /><select className="rounded-lg border border-border bg-background p-2 text-sm" value={type} onChange={(event) => setType(event.target.value)}>{['INSPECTION','VERIFICATION','VALUATION','DOCUMENT_PICKUP'].map((item) => <option key={item}>{item.replace('_', ' ')}</option>)}</select><select className="rounded-lg border border-border bg-background p-2 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}>{['LOW','MEDIUM','HIGH'].map((item) => <option key={item}>{item}</option>)}</select></div>{create.error && <p className="mt-3 text-sm text-red-600">Unable to create task. Please try again.</p>}<Button className="mt-4" isLoading={create.isPending} disabled={!selected || !propertyId || !title || !dueAt} onClick={() => create.mutate()}>Create task</Button></section>;
}
