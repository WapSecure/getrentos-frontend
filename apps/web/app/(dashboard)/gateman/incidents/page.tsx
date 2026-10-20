'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Siren, TriangleAlert } from 'lucide-react';
import {
  Alert,
  Button,
  Card,
  CardSkeleton,
  DocumentUpload,
  EmptyState,
  Field,
  ListSkeleton,
  Select,
  Textarea,
} from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
import { useGatemanPost } from '@/lib/gateman/GatemanPostProvider';
import { IncidentCard } from '@/components/estate/incidents/IncidentCard';

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
    },
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
    return <EmptyState icon={Siren} title="You're not assigned to an estate yet." />;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
          <Siren className="w-7 h-7" />
        </div>
        <h1 className="text-xl font-bold text-foreground">{estate.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Report an incident or raise the alarm.</p>
      </div>

      <button
        type="button"
        onClick={() => panicAlert.mutate()}
        disabled={panicAlert.isPending}
        aria-busy={panicAlert.isPending || undefined}
        className="w-full rounded-2xl bg-destructive hover:brightness-95 active:brightness-90 disabled:opacity-60 text-destructive-foreground py-6 flex flex-col items-center gap-2 shadow-lg shadow-destructive/20 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
      >
        <TriangleAlert className="w-8 h-8" />
        <span className="text-lg font-bold tracking-wide">
          {panicAlert.isPending ? 'Sending…' : 'PANIC ALERT'}
        </span>
        <span className="text-xs text-destructive-foreground/80">
          Tap to immediately notify the estate manager
        </span>
      </button>

      {panicSent && (
        <Alert variant="success">Alert sent: the estate manager has been notified.</Alert>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Report an incident</h2>

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
            rows={3}
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

        <Button
          variant="primary"
          fullWidth
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
          Report Incident
        </Button>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Open Incidents ({open.length})
        </h2>
        {isOpenLoading ? (
          <ListSkeleton rows={2} />
        ) : open.length === 0 ? (
          <EmptyState icon={ShieldCheck} size="compact" title="No open incidents right now." />
        ) : (
          <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
            {open.map((incident) => (
              <IncidentCard key={incident.id} incident={incident} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
