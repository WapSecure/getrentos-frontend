'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  Toast,
  type ToastVariant,
} from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { landlordKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { automationService, type BroadcastAudience } from '@/services/automationService';
import { AUDIENCE_OPTIONS, MERGE_FIELDS } from './constants';

export function BroadcastComposer() {
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const [audience, setAudience] = useState<BroadcastAudience>('ALL_TENANTS');
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { data: propertiesData } = useQuery({
    queryKey: [...landlordKeys.properties, { page: 1, pageSize: 100 }],
    queryFn: () => unwrap(landlordService.listProperties({ page: 1, pageSize: 100 })),
  });
  const properties = propertiesData?.items ?? [];

  const { data: templates = [] } = useQuery({
    queryKey: landlordKeys.announcementTemplates,
    queryFn: () => unwrap(automationService.listTemplates()),
  });

  const send = useMutation({
    mutationFn: () =>
      unwrap(
        automationService.broadcast({
          audience,
          propertyId: audience === 'PROPERTY' ? propertyId : undefined,
          title,
          body,
        })
      ),
    onSuccess: (res) => {
      setToast({
        message:
          res.recipientCount === 0
            ? 'No tenants matched that audience.'
            : `Sent to ${res.recipientCount} tenant${res.recipientCount === 1 ? '' : 's'}.`,
        variant: res.recipientCount === 0 ? 'error' : 'success',
      });
      if (res.recipientCount > 0) {
        setTitle('');
        setBody('');
      }
    },
    onError: (e: Error) => setToast({ message: e.message || 'Unable to send.', variant: 'error' }),
  });

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (t) {
      setTitle(t.title);
      setBody(t.content);
    }
  };

  const canSend =
    title.trim().length > 0 &&
    body.trim().length > 0 &&
    (audience !== 'PROPERTY' || Boolean(propertyId));

  return (
    <Card static className="max-w-2xl p-5">
      <h2 className="text-base font-semibold text-foreground">Send an announcement</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Message a group of tenants at once. Each tenant gets it in-app and by email.
      </p>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Audience">
            <Select
              value={audience}
              onValueChange={(v) => setAudience(v as BroadcastAudience)}
              options={AUDIENCE_OPTIONS}
            />
          </Field>
          {audience === 'PROPERTY' && (
            <Field label="Property">
              <Select
                value={propertyId}
                onValueChange={setPropertyId}
                placeholder="Select a property"
                options={properties.map((p) => ({ value: p.id, label: p.name }))}
              />
            </Field>
          )}
          {templates.length > 0 && (
            <Field label="Start from a template" hint="Optional">
              <Select
                value=""
                onValueChange={applyTemplate}
                placeholder="Choose a template"
                options={templates.map((t) => ({ value: t.id, label: t.title }))}
              />
            </Field>
          )}
        </div>

        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Water supply notice"
          />
        </Field>
        <Field label="Message" hint={`Merge fields: ${MERGE_FIELDS.join(', ')}`}>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Hi {{tenant_name}}, a quick notice about {{property}}…"
          />
        </Field>

        <div className="flex justify-end">
          <Button
            icon={<Send className="h-4 w-4" />}
            onClick={() => send.mutate()}
            disabled={!canSend || send.isPending}
          >
            {send.isPending ? 'Sending…' : 'Send announcement'}
          </Button>
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
    </Card>
  );
}
