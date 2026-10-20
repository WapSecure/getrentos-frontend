'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { CalendarClock } from 'lucide-react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogTitle,
  Field,
  Textarea,
  TimePicker,
} from '@getrentos/ui';
import type { RealtorLead, ViewingAppointment } from '@/types/realtor';
import { PaginatedSelect } from '@/components/ui/PaginatedSelect';
import { unwrap } from '@/lib/apiHelpers';
import { realtorKeys } from '@/lib/queryKeys';
import { mapRealtorLead, realtorService, type RealtorLeadApi } from '@/services/realtorService';

export type CreateViewingInput = Omit<ViewingAppointment, 'id' | 'status'> & { leadId: string };

interface ScheduleViewingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLeadId?: string;
  onSubmit: (appointment: CreateViewingInput) => Promise<boolean>;
  isSubmitting?: boolean;
}

const LEAD_SELECTOR_PAGE_SIZE = 10;

export const ScheduleViewingModal = ({
  isOpen,
  onClose,
  defaultLeadId,
  onSubmit,
  isSubmitting = false,
}: ScheduleViewingModalProps) => {
  const [leadId, setLeadId] = useState(defaultLeadId || '');
  const [leadSearch, setLeadSearch] = useState('');
  const [leadPage, setLeadPage] = useState(1);
  const [selectedLeadState, setSelectedLeadState] = useState<RealtorLeadApi | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const { data: leadsPage, isLoading: isLeadsLoading } = useQuery({
    queryKey: [
      ...realtorKeys.leads,
      {
        hasListing: true,
        search: leadSearch.trim() || undefined,
        page: leadPage,
        pageSize: LEAD_SELECTOR_PAGE_SIZE,
      },
    ],
    queryFn: () =>
      unwrap(
        realtorService.listLeads({
          hasListing: true,
          search: leadSearch.trim() || undefined,
          page: leadPage,
          pageSize: LEAD_SELECTOR_PAGE_SIZE,
        })
      ),
    enabled: isOpen,
    placeholderData: keepPreviousData,
  });
  const { data: defaultLead } = useQuery({
    queryKey: [...realtorKeys.leads, 'detail', defaultLeadId],
    queryFn: () => unwrap(realtorService.getLead(defaultLeadId as string)),
    enabled: isOpen && !!defaultLeadId,
  });
  const leads = leadsPage?.items ?? [];
  const selectedLeadApi =
    (selectedLeadState?.id === leadId ? selectedLeadState : null) ??
    leads.find((lead) => lead.id === leadId) ??
    (defaultLead?.id === leadId ? defaultLead : null);
  const selectedLead: RealtorLead | undefined = selectedLeadApi
    ? mapRealtorLead(selectedLeadApi)
    : undefined;

  const handleClose = () => {
    setLeadId(defaultLeadId || '');
    setLeadSearch('');
    setLeadPage(1);
    setSelectedLeadState(null);
    setDate('');
    setTime('');
    setNotes('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedLead?.listingId) return;
    const scheduled = await onSubmit({
      leadId,
      leadName: selectedLead.leadName,
      listingId: selectedLead.listingId,
      listingTitle: selectedLead.listingTitle,
      scheduledDate: date,
      scheduledTime: time,
      notes: notes || undefined,
    });
    if (scheduled) handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="p-0 sm:max-w-sm sm:p-0">
        <div className="p-4 pr-12 border-b border-border">
          <DialogTitle className="font-semibold text-foreground">Schedule Viewing</DialogTitle>
        </div>

        <div className="p-4 space-y-4">
          <Field label="Lead" required>
            <PaginatedSelect
              value={leadId}
              onValueChange={(value) => {
                setLeadId(value);
                setSelectedLeadState(leads.find((lead) => lead.id === value) ?? null);
              }}
              items={leads}
              selectedItem={selectedLeadApi}
              getItemValue={(lead) => lead.id}
              getItemLabel={(lead) =>
                `${lead.fullName}: ${lead.listing?.listingTitle || 'Untitled listing'}`
              }
              search={leadSearch}
              onSearchChange={(value) => {
                setLeadSearch(value);
                setLeadPage(1);
              }}
              searchPlaceholder="Search leads with listings"
              page={leadPage}
              pageSize={LEAD_SELECTOR_PAGE_SIZE}
              total={leadsPage?.total ?? 0}
              onPageChange={setLeadPage}
              placeholder="Select a lead"
              emptyMessage="No leads with listings match this search."
              isLoading={isLeadsLoading}
              ariaLabel="lead"
            />
          </Field>

          <Field label="Date" required>
            <DatePicker value={date} onChange={setDate} />
          </Field>

          <Field label="Time" required>
            <TimePicker value={time} onChange={setTime} />
          </Field>

          <Field label="Notes" optionalLabel="(optional)">
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </Field>
        </div>

        <div className="p-4 border-t border-border flex gap-3">
          <Button variant="ghost" onClick={handleClose} className="flex-1" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            icon={<CalendarClock className="w-4 h-4" />}
            onClick={() => void handleSubmit()}
            isLoading={isSubmitting}
            loadingText="Scheduling…"
            disabled={!selectedLead?.listingId || !date || !time}
          >
            Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
