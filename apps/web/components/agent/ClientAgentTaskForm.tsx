'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@getrentos/ui';
import { DatePicker } from '@getrentos/ui';
import { Field } from '@getrentos/ui';
import { Input } from '@getrentos/ui';
import { Select } from '@getrentos/ui';
import { TimePicker } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import { agentService } from '@/services/agentService';

type Assignment = { id: string; status: string; agent: { id: string; legalName: string } };
type Property = { id: string; title: string; city: string; state: string };

const TASK_TYPES = ['INSPECTION', 'VERIFICATION', 'VALUATION', 'DOCUMENT_PICKUP'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

export function ClientAgentTaskForm() {
  const [assignmentId, setAssignmentId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<(typeof TASK_TYPES)[number]>('INSPECTION');
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');

  const { data: assignments = [] } = useQuery({
    queryKey: agentKeys.clientAssignments,
    queryFn: () => unwrap(agentService.listClientAssignments()) as Promise<Assignment[]>,
  });
  const selected = assignments.find((item) => item.id === assignmentId);
  const { data: properties = [] } = useQuery({
    enabled: Boolean(assignmentId),
    queryKey: agentKeys.assignableProperties(assignmentId),
    queryFn: () =>
      unwrap(agentService.listAssignableProperties(assignmentId)) as Promise<Property[]>,
  });
  const create = useMutation({
    mutationFn: () =>
      unwrap(
        agentService.createClientTask({
          agentId: selected!.agent.id,
          propertyId,
          title,
          type,
          priority,
          dueAt: new Date(`${dueDate}T${dueTime}:00`).toISOString(),
        })
      ),
    onSuccess: () => {
      setTitle('');
      setPropertyId('');
      setDueDate('');
      setDueTime('');
    },
  });
  const active = assignments.filter((item) => item.status === 'ACTIVE');

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold text-foreground">Create field task</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tasks can only be assigned to an approved Agent for an explicitly assigned property.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Agent">
          <Select
            ariaLabel="Select Agent"
            placeholder="Select Agent"
            value={assignmentId}
            onValueChange={(value) => {
              setAssignmentId(value);
              setPropertyId('');
            }}
            options={active.map((item) => ({ value: item.id, label: item.agent.legalName }))}
          />
        </Field>
        <Field label="Property">
          <Select
            ariaLabel="Select property"
            placeholder="Select property"
            value={propertyId}
            onValueChange={setPropertyId}
            disabled={!assignmentId}
            options={properties.map((item) => ({
              value: item.id,
              label: `${item.title} · ${item.city}`,
            }))}
          />
        </Field>
        <Field label="Task title">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due date">
            <DatePicker value={dueDate} onChange={setDueDate} />
          </Field>
          <Field label="Due time">
            <TimePicker value={dueTime} onChange={setDueTime} />
          </Field>
        </div>
        <Field label="Task type">
          <Select
            ariaLabel="Task type"
            value={type}
            onValueChange={(value) => setType(value as (typeof TASK_TYPES)[number])}
            options={TASK_TYPES.map((item) => ({ value: item, label: item.replace('_', ' ') }))}
          />
        </Field>
        <Field label="Priority">
          <Select
            ariaLabel="Priority"
            value={priority}
            onValueChange={(value) => setPriority(value as (typeof PRIORITIES)[number])}
            options={PRIORITIES.map((item) => ({ value: item, label: item }))}
          />
        </Field>
      </div>
      {create.error && (
        <p className="mt-3 text-sm text-destructive">Unable to create task. Please try again.</p>
      )}
      <Button
        className="mt-4"
        isLoading={create.isPending}
        disabled={!selected || !propertyId || !title || !dueDate || !dueTime}
        onClick={() => create.mutate()}
      >
        Create task
      </Button>
    </section>
  );
}
