'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Wrench } from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  ListSkeleton,
  Select,
  Textarea,
} from '@getrentos/ui';
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

      <Card className="p-6 space-y-4 mb-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onValueChange={setCategory} options={categoryOptions} />
          </Field>
          <Field label="Priority">
            <Select value={priority} onValueChange={setPriority} options={priorityOptions} />
          </Field>
        </div>

        <Field label="Description" required>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What's wrong, and where…"
          />
        </Field>

        <Field label="Photo" optionalLabel="(optional)">
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          />
        </Field>

        <Button
          variant="primary"
          fullWidth
          disabled={!description.trim()}
          isLoading={reportTicket.isPending}
          loadingText="Reporting…"
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
          Report Ticket
        </Button>
      </Card>

      <h2 className="text-sm font-semibold text-foreground mb-3">
        Your Tickets ({tickets?.length ?? 0})
      </h2>
      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : !tickets || tickets.length === 0 ? (
        <EmptyState icon={Wrench} title="No maintenance tickets reported yet." />
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
