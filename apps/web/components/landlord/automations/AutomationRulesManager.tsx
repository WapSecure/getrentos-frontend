'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Pencil, Play, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  DatePicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  Select,
  Switch,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService, type BillingCycle } from '@/services/landlordService';
import {
  automationService,
  type AutomationRule,
  type AutomationTrigger,
  type BroadcastAudience,
  type CreateRuleInput,
} from '@/services/automationService';
import {
  AUDIENCE_LABELS,
  AUDIENCE_OPTIONS,
  CADENCE_LABELS,
  CADENCE_OPTIONS,
  MERGE_FIELDS,
  TRIGGER_LABELS,
  TRIGGER_OPTIONS,
} from './constants';

type RuleForm = {
  name: string;
  trigger: AutomationTrigger;
  audience: BroadcastAudience;
  propertyId: string;
  title: string;
  body: string;
  cadence: BillingCycle;
  firstRunAt: string;
  enabled: boolean;
};

const emptyForm: RuleForm = {
  name: '',
  trigger: 'SCHEDULE',
  audience: 'ALL_TENANTS',
  propertyId: '',
  title: '',
  body: '',
  cadence: 'MONTHLY',
  firstRunAt: '',
  enabled: true,
};

export function AutomationRulesManager() {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RuleForm>(emptyForm);

  const { data: rules = [], isLoading } = useQuery({
    queryKey: landlordKeys.automationRules,
    queryFn: () => unwrap(automationService.listRules()),
  });
  const { data: propertiesData } = useQuery({
    queryKey: [...landlordKeys.properties, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(landlordService.listProperties({ page: 1, pageSize: 100 })),
  });
  const properties = propertiesData?.items ?? [];

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: landlordKeys.automationRules });

  const save = useMutation({
    mutationFn: () => {
      const isSchedule = form.trigger === 'SCHEDULE';
      const payload: CreateRuleInput = isSchedule
        ? {
            name: form.name,
            trigger: 'SCHEDULE',
            audience: form.audience,
            propertyId: form.audience === 'PROPERTY' ? form.propertyId : undefined,
            title: form.title,
            body: form.body,
            cadence: form.cadence,
            firstRunAt: form.firstRunAt,
            enabled: form.enabled,
          }
        : {
            name: form.name,
            trigger: form.trigger,
            propertyId: form.propertyId || undefined,
            title: form.title,
            body: form.body,
            enabled: form.enabled,
          };
      return editingId
        ? unwrap(automationService.updateRule(editingId, payload))
        : unwrap(automationService.createRule(payload));
    },
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setToast({ message: editingId ? 'Rule updated.' : 'Rule created.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Unable to save the rule.', variant: 'error' }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => unwrap(automationService.deleteRule(id)),
    onSuccess: () => {
      invalidate();
      setToast({ message: 'Rule removed.', variant: 'success' });
    },
    onError: (e: Error) =>
      setToast({ message: e.message || 'Unable to remove.', variant: 'error' }),
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      unwrap(automationService.updateRule(id, { enabled })),
    onSuccess: () => invalidate(),
    onError: (e: Error) =>
      setToast({ message: e.message || 'Unable to update.', variant: 'error' }),
  });

  const run = useMutation({
    mutationFn: (id: string) => unwrap(automationService.runRule(id)),
    onSuccess: (res) => {
      invalidate();
      setToast({
        message: `Sent to ${res.recipientCount} tenant${res.recipientCount === 1 ? '' : 's'}.`,
        variant: 'success',
      });
    },
    onError: (e: Error) => setToast({ message: e.message || 'Unable to run.', variant: 'error' }),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };
  const openEdit = (r: AutomationRule) => {
    setEditingId(r.id);
    setForm({
      name: r.name,
      trigger: r.trigger,
      audience: r.audience ?? 'ALL_TENANTS',
      propertyId: r.propertyId ?? '',
      title: r.title,
      body: r.body,
      cadence: r.cadence ?? 'MONTHLY',
      firstRunAt: r.nextRunAt ? r.nextRunAt.slice(0, 10) : '',
      enabled: r.enabled,
    });
    setOpen(true);
  };

  const canSave =
    form.name.trim() &&
    form.title.trim() &&
    form.body.trim() &&
    (form.trigger !== 'SCHEDULE' ||
      (form.firstRunAt && (form.audience !== 'PROPERTY' || form.propertyId)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Automation rules</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Send an announcement automatically — on a recurring schedule, or when a tenancy event
            happens (rent due soon, overdue, lease expiring).
          </p>
        </div>
        <Button onClick={openCreate}>New rule</Button>
      </div>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-2xl bg-secondary/50" />
      ) : rules.length === 0 ? (
        <Card static className="p-2">
          <EmptyState
            icon={CalendarClock}
            title="No automation rules yet"
            description="Create a rule to message all tenants monthly, or to chase a tenant automatically when their rent goes overdue."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <Card key={r.id} static className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{r.name}</h3>
                    <Badge variant="info">{TRIGGER_LABELS[r.trigger]}</Badge>
                    {r.trigger === 'SCHEDULE' && r.audience && (
                      <Badge variant="neutral">{AUDIENCE_LABELS[r.audience]}</Badge>
                    )}
                    {r.trigger === 'SCHEDULE' && r.cadence && (
                      <Badge variant="neutral">{CADENCE_LABELS[r.cadence]}</Badge>
                    )}
                    {!r.enabled && <Badge variant="warning">Paused</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.trigger === 'SCHEDULE'
                      ? `Next run ${r.nextRunAt ? formatDate(r.nextRunAt, 'long') : '—'}`
                      : 'Fires automatically for the tenant when it happens'}
                    {r.lastRunAt
                      ? ` · last sent ${r.lastRecipientCount ?? 0} on ${formatDate(r.lastRunAt)}`
                      : ' · not run yet'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={r.enabled}
                    onCheckedChange={(enabled) => toggle.mutate({ id: r.id, enabled })}
                    aria-label="Enable rule"
                  />
                  {r.trigger === 'SCHEDULE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      rounded="md"
                      icon={<Play className="h-4 w-4" />}
                      onClick={() => run.mutate(r.id)}
                      disabled={run.isPending}
                    >
                      Run now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    rounded="md"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={() => openEdit(r)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    rounded="md"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => remove.mutate(r.id)}
                    disabled={remove.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {editingId ? 'Edit rule' : 'New automation rule'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            On a schedule it broadcasts to an audience; on an event it messages the tenant the event
            is about.
          </DialogDescription>
          <div className="mt-5 space-y-4">
            <Field label="Rule name">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Monthly rent reminder"
              />
            </Field>
            <Field label="When">
              <Select
                value={form.trigger}
                onValueChange={(v) => setForm((f) => ({ ...f, trigger: v as AutomationTrigger }))}
                options={TRIGGER_OPTIONS}
              />
            </Field>
            {form.trigger === 'SCHEDULE' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Audience">
                  <Select
                    value={form.audience}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, audience: v as BroadcastAudience }))
                    }
                    options={AUDIENCE_OPTIONS}
                  />
                </Field>
                {form.audience === 'PROPERTY' && (
                  <Field label="Property">
                    <Select
                      value={form.propertyId}
                      onValueChange={(propertyId) => setForm((f) => ({ ...f, propertyId }))}
                      placeholder="Select a property"
                      options={properties.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </Field>
                )}
                <Field label="Repeat">
                  <Select
                    value={form.cadence}
                    onValueChange={(v) => setForm((f) => ({ ...f, cadence: v as BillingCycle }))}
                    options={CADENCE_OPTIONS}
                  />
                </Field>
                <Field label="First run">
                  <DatePicker
                    value={form.firstRunAt}
                    onChange={(v) => setForm((f) => ({ ...f, firstRunAt: v }))}
                  />
                </Field>
              </div>
            ) : (
              <Field label="Property scope" hint="Optional — leave as all for the whole portfolio.">
                <Select
                  value={form.propertyId}
                  onValueChange={(propertyId) => setForm((f) => ({ ...f, propertyId }))}
                  options={[
                    { value: '', label: 'All properties' },
                    ...properties.map((p) => ({ value: p.id, label: p.name })),
                  ]}
                />
              </Field>
            )}
            <Field label="Title">
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <Field label="Message" hint={`Merge fields: ${MERGE_FIELDS.join(', ')}`}>
              <Textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                rows={4}
              />
            </Field>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" rounded="md" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              rounded="md"
              onClick={() => save.mutate()}
              disabled={!canSave || save.isPending}
            >
              {save.isPending ? 'Saving…' : 'Save rule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
