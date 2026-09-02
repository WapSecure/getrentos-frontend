'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import { Button, LegacyInput, Select } from '@getrentos/ui';
import { estateResidentService } from '@/services/estateResidentService';
import { unwrap } from '@/lib/apiHelpers';
import { estateResidentKeys } from '@/lib/queryKeys';
import { MaintenanceTicketCard } from '@/components/estate/maintenance/MaintenanceTicketCard';

const categoryOptions = [
  { value: 'PLUMBING', label: 'Plumbing' },
  { value: 'ELECTRICAL', label: 'Electrical' },
  { value: 'STRUCTURAL', label: 'Structural' },
  { value: 'COMMON_AREA', label: 'Common Area' },
  { value: 'OTHER', label: 'Other' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'URGENT', label: 'Urgent' },
];

export default function ResidentMaintenancePage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('OTHER');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  const { data: tickets, isLoading } = useQuery({
    queryKey: estateResidentKeys.maintenanceTickets,
    queryFn: () => unwrap(estateResidentService.listMyMaintenanceTickets()),
  });

  const reportTicket = useMutation({
    mutationFn: (data: Parameters<typeof estateResidentService.reportMaintenanceTicket>[0]) =>
      unwrap(estateResidentService.reportMaintenanceTicket(data)),
    onSuccess: () => {
      setCategory('OTHER');
      setPriority('MEDIUM');
      setDescription('');
      setPhoto(null);
      queryClient.invalidateQueries({ queryKey: estateResidentKeys.maintenanceTickets });
    },
  });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Maintenance</h1>
        <p className="text-muted-foreground mt-1">
          Report an issue with your unit or a shared area
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4 mb-8">
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
            placeholder="What's wrong, and where…"
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
          disabled={!description.trim() || reportTicket.isPending}
          onClick={() =>
            reportTicket.mutate({
              description: description.trim(),
              category: category as
                | 'PLUMBING'
                | 'ELECTRICAL'
                | 'STRUCTURAL'
                | 'COMMON_AREA'
                | 'OTHER',
              priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
              photo: photo ?? undefined,
            })
          }
        >
          {reportTicket.isPending ? 'Reporting…' : 'Report Ticket'}
        </Button>
      </div>

      <h2 className="text-sm font-semibold text-foreground mb-3">
        Your Tickets ({tickets?.length ?? 0})
      </h2>
      {isLoading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" aria-busy="true" />
      ) : !tickets || tickets.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center text-center">
          <Wrench className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No maintenance tickets reported yet.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          {tickets.map((ticket) => (
            <MaintenanceTicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </>
  );
}
