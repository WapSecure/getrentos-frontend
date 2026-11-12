'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Siren, TriangleAlert } from '@sureground/icons';
import { NotAssignedToEstate } from '@/components/gateman/NotAssignedToEstate';
import {
  Alert,
  Button,
  CardSkeleton,
  DocumentUpload,
  EmptyState,
  Field,
  ListSkeleton,
  PageHeader,
  Select,
  Textarea,
  useToast,
} from '@sureground/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { IncidentCard } from '@/components/estate/incidents/IncidentCard';
import { GateRowIcon, GateSection, gateRowEdge } from '@/components/gateman/GateSection';

const categoryOptions = [
  { value: 'SECURITY', label: 'Security' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'SAFETY', label: 'Safety' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

const PANIC_DESCRIPTION = 'Panic button activated';

export default function GatemanIncidentsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [category, setCategory] = useState('OTHER');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [panicSent, setPanicSent] = useState(false);

  const { estate, isLoading: isEstateLoading } = useGatemanPost();

  const { data: openIncidents, isLoading: isOpenLoading } = useQuery({
    queryKey: estateKeys.incidents(estate?.id ?? '', 'open'),
    queryFn: () => unwrap(estateService.listIncidents(estate!.id, 'open')),
    enabled: !!estate,
  });
  const open = openIncidents ?? [];

  const invalidate = () => {
    if (!estate) return;
    queryClient.invalidateQueries({ queryKey: ['estate', estate.id, 'incidents'] });
  };

  const reportIncident = useMutation({
    mutationFn: (data: Parameters<typeof estateService.reportIncident>[1]) =>
      unwrap(estateService.reportIncident(estate!.id, data)),
    onSuccess: () => {
      setCategory('OTHER');
      setPriority('MEDIUM');
      setDescription('');
      setPhoto(null);
      invalidate();
      toast.success('Incident reported. The estate manager can see it now.');
    },
    onError: (error: Error) =>
      toast.error(error.message || 'The incident was not reported. Try again.'),
  });

  const panicAlert = useMutation({
    mutationFn: () =>
      unwrap(
        estateService.reportIncident(estate!.id, {
          category: 'SECURITY',
          priority: 'CRITICAL',
          description: PANIC_DESCRIPTION,
        })
      ),
    onSuccess: () => {
      setPanicSent(true);
      invalidate();
      setTimeout(() => setPanicSent(false), 5000);
    },
  });

  if (isEstateLoading) {
    return <CardSkeleton />;
  }

  if (!estate) {
    return <NotAssignedToEstate icon={Siren} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader title={estate.name} description="Report an incident or raise the alarm." />

      <section
        aria-labelledby="panic-title"
        className="overflow-hidden rounded-2xl border border-destructive/30 bg-card shadow-sm"
      >
        <header className="flex items-start gap-3 px-5 pt-5">
          <GateRowIcon tone="danger">
            <Siren />
          </GateRowIcon>
          <div className="min-w-0">
            <h2 id="panic-title" className="text-base font-semibold text-foreground">
              Emergency
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              For an emergency only. This sends a critical security incident to the estate manager.
            </p>
          </div>
        </header>
        <div className="p-5">
          <button
            type="button"
            onClick={() => panicAlert.mutate()}
            disabled={panicAlert.isPending}
            aria-busy={panicAlert.isPending || undefined}
            className="group flex w-full flex-col items-center gap-2 rounded-2xl bg-destructive px-4 py-7 text-destructive-foreground shadow-md shadow-destructive/25 transition hover:brightness-95 active:translate-y-px active:brightness-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-destructive/40 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-foreground/15 ring-1 ring-destructive-foreground/30"
            >
              <TriangleAlert className="h-6 w-6" />
            </span>
            <span className="text-lg font-bold tracking-[0.18em]">
              {panicAlert.isPending ? 'Sending…' : 'PANIC ALERT'}
            </span>
            <span className="text-xs text-destructive-foreground/85">
              Tap to immediately notify the estate manager
            </span>
          </button>
          {panicSent && (
            <Alert variant="success" className="mt-4">
              Alert sent: the estate manager has been notified.
            </Alert>
          )}
        </div>
      </section>

      <GateSection
        id="report-incident"
        title="Report an incident"
        description="For anything that is not an emergency. Say what happened and where."
      >
        <div className="space-y-4 p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={category} onValueChange={setCategory} options={categoryOptions} />
            </Field>
            <Field label="Priority">
              <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
            </Field>
          </div>

          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What happened, where, and who's involved…"
            />
          </Field>

          <Field label="Photo" optionalLabel="(optional)">
            <DocumentUpload
              value={photo ? [{ id: 'photo', file: photo }] : []}
              onChange={(items) => setPhoto(items[0]?.file ?? null)}
              accept="image/*"
              multiple={false}
              label=""
            />
          </Field>
        </div>

        <div className="border-t border-border bg-secondary/40 px-5 py-4 sm:px-6">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            disabled={!description.trim()}
            isLoading={reportIncident.isPending}
            loadingText="Reporting…"
            onClick={() =>
              reportIncident.mutate({
                description: description.trim(),
                category: category as 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER',
                priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
                photo: photo ?? undefined,
              })
            }
          >
            Report incident
          </Button>
        </div>
      </GateSection>

      <GateSection
        id="open-incidents"
        title="Open incidents"
        count={isOpenLoading ? undefined : open.length}
        countLabel={`${open.length} open`}
        description="Reported at this estate and not yet resolved or dismissed."
      >
        {isOpenLoading ? (
          <div className="p-5">
            <ListSkeleton rows={2} />
          </div>
        ) : open.length === 0 ? (
          <EmptyState bare size="compact" icon={ShieldCheck} title="No open incidents right now." />
        ) : (
          <ul className="divide-y divide-border">
            {open.map((incident) => {
              const tone =
                incident.priority === 'critical'
                  ? 'danger'
                  : incident.priority === 'high'
                    ? 'warning'
                    : 'neutral';
              return (
                <li key={incident.id} className={`flex gap-3 px-5 py-4 ${gateRowEdge(tone)}`}>
                  <GateRowIcon tone={tone}>
                    <TriangleAlert />
                  </GateRowIcon>
                  {/* The shared card brings its own padding; the row supplies it here. */}
                  <div className="min-w-0 flex-1 [&>div]:p-0">
                    <IncidentCard incident={incident} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </GateSection>
    </div>
  );
}
