'use client';

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Field,
  Input,
  Pagination,
  SearchInput,
  Select,
  TimePicker,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { agentKeys } from '@/lib/queryKeys';
import {
  AGENT_WORKING_DAYS,
  agentService,
  type AgentFieldPreferences,
} from '@/services/agentService';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Weekday code of a YYYY-MM-DD date (the date the client picked, as a calendar day). */
const weekdayOf = (day: string) =>
  AGENT_WORKING_DAYS[(new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7];

type Assignment = {
  id: string;
  status: string;
  agent: { id: string; legalName: string; agentFieldPreference?: AgentFieldPreferences | null };
};
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
  const PAGE_SIZE = 10;
  const [assignmentPage, setAssignmentPage] = useState(1);
  const [propertyPage, setPropertyPage] = useState(1);
  const [propertySearch, setPropertySearch] = useState('');

  const { data: assignmentsData } = useQuery({
    queryKey: [
      ...agentKeys.clientAssignments,
      { status: 'active', page: assignmentPage, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        agentService.listClientAssignments({
          status: 'active',
          page: assignmentPage,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const assignments = (assignmentsData?.items ?? []) as Assignment[];
  const assignmentTotal = assignmentsData?.total ?? 0;
  const selected = assignments.find((item) => item.id === assignmentId);
  const prefs = selected?.agent?.agentFieldPreference ?? null;
  const offDay =
    prefs &&
    dueDate &&
    prefs.workingDays.length > 0 &&
    !prefs.workingDays.includes(weekdayOf(dueDate))
      ? DAY_NAMES[AGENT_WORKING_DAYS.indexOf(weekdayOf(dueDate))]
      : null;
  const { data: propertiesData } = useQuery({
    enabled: Boolean(assignmentId),
    queryKey: [
      ...agentKeys.assignableProperties(assignmentId),
      { search: propertySearch, page: propertyPage, pageSize: PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        agentService.listAssignableProperties(assignmentId, {
          search: propertySearch || undefined,
          page: propertyPage,
          pageSize: PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });
  const properties = (propertiesData?.items ?? []) as Property[];
  const propertyTotal = propertiesData?.total ?? 0;
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
  const active = assignments;

  return (
    <Card className="p-5">
      <h2 className="font-semibold text-foreground">Create field task</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tasks can only be assigned to an approved Agent for an explicitly assigned property.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Agent">
          <Select
            ariaLabel="Select agent"
            placeholder="Select agent"
            value={assignmentId}
            onValueChange={(value) => {
              setAssignmentId(value);
              setPropertyId('');
              setPropertySearch('');
              setPropertyPage(1);
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
        {assignmentTotal > 0 && (
          <div className="sm:col-span-2">
            <Pagination
              page={assignmentPage}
              pageSize={PAGE_SIZE}
              total={assignmentTotal}
              onPageChange={(nextPage) => {
                setAssignmentPage(nextPage);
                setAssignmentId('');
                setPropertyId('');
              }}
            />
          </div>
        )}
        {assignmentId && (
          <div className="sm:col-span-2 space-y-3">
            <SearchInput
              value={propertySearch}
              onValueChange={(value) => {
                setPropertySearch(value);
                setPropertyPage(1);
                setPropertyId('');
              }}
              placeholder="Search properties to assign"
              label="Search properties to assign"
            />
            {propertyTotal > 0 && (
              <Pagination
                page={propertyPage}
                pageSize={PAGE_SIZE}
                total={propertyTotal}
                onPageChange={(nextPage) => {
                  setPropertyPage(nextPage);
                  setPropertyId('');
                }}
              />
            )}
          </div>
        )}
        <Field label="Task title">
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Task title"
          />
        </Field>
        {prefs &&
          (prefs.serviceAreas.length > 0 ||
            prefs.workingDays.length > 0 ||
            prefs.maxTasksPerDay !== null) && (
            <div className="sm:col-span-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{selected?.agent?.legalName} works</p>
              <ul className="mt-1 space-y-0.5">
                {prefs.serviceAreas.length > 0 && <li>In {prefs.serviceAreas.join(', ')}</li>}
                {prefs.workingDays.length > 0 && (
                  <li>
                    On{' '}
                    {prefs.workingDays
                      .map((d) => DAY_NAMES[AGENT_WORKING_DAYS.indexOf(d)].slice(0, 3))
                      .join(', ')}
                  </li>
                )}
                {prefs.maxTasksPerDay !== null && (
                  <li>
                    Up to {prefs.maxTasksPerDay} task{prefs.maxTasksPerDay === 1 ? '' : 's'} a day
                  </li>
                )}
              </ul>
            </div>
          )}
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Due date"
            error={offDay ? `This agent doesn't take field work on ${offDay}s.` : undefined}
          >
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
        <Alert variant="danger" className="mt-3">
          Unable to create task. Please try again.
        </Alert>
      )}
      <Button
        className="mt-4"
        isLoading={create.isPending}
        disabled={!selected || !propertyId || !title || !dueDate || !dueTime || Boolean(offDay)}
        onClick={() => create.mutate()}
      >
        Create task
      </Button>
    </Card>
  );
}
