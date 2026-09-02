'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Siren, TriangleAlert } from 'lucide-react';
import { Button, LegacyInput, Select } from '@getrentos/ui';
import { estateService } from '@/services/estateService';
import { unwrap } from '@/lib/apiHelpers';
import { estateKeys } from '@/lib/queryKeys';
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

  const { data: estate, isLoading: isEstateLoading } = useQuery({
    queryKey: estateKeys.myEstate,
    queryFn: () => unwrap(estateService.getMyEstate()),
  });

  const { data: openIncidents } = useQuery({
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
    return <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />;
  }

  if (!estate) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You&apos;re not assigned to an estate yet.</p>
      </div>
    );
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
        onClick={() => panicAlert.mutate()}
        disabled={panicAlert.isPending}
        className="w-full rounded-2xl bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-60 text-white py-6 flex flex-col items-center gap-2 shadow-lg shadow-red-600/20 transition-colors"
      >
        <TriangleAlert className="w-8 h-8" />
        <span className="text-lg font-bold tracking-wide">
          {panicAlert.isPending ? 'Sending…' : 'PANIC ALERT'}
        </span>
        <span className="text-xs text-red-100">Tap to immediately notify the estate manager</span>
      </button>

      {panicSent && (
        <p className="text-center text-sm font-medium text-red-600">
          Alert sent — the estate manager has been notified.
        </p>
      )}

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Report an incident</h2>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Category</label>
            <Select value={category} onValueChange={setCategory} options={categoryOptions} />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
            <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What happened, where, and who's involved…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Photo <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <LegacyInput
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button
          variant="primary"
          fullWidth
          disabled={!description.trim() || reportIncident.isPending}
          onClick={() =>
            reportIncident.mutate({
              description: description.trim(),
              category: category as 'SECURITY' | 'MAINTENANCE' | 'SAFETY' | 'OTHER',
              priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
              photo: photo ?? undefined,
            })
          }
        >
          {reportIncident.isPending ? 'Reporting…' : 'Report Incident'}
        </Button>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Open Incidents ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open incidents right now.</p>
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
