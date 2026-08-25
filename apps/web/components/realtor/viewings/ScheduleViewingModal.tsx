'use client';

import { Textarea } from '@getrentos/ui';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CalendarClock } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { DatePicker } from '@getrentos/ui';
import { TimePicker } from '@getrentos/ui';
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
  onSubmit: (appointment: CreateViewingInput) => void;
}

const LEAD_SELECTOR_PAGE_SIZE = 10;

export const ScheduleViewingModal = ({
  isOpen,
  onClose,
  defaultLeadId,
  onSubmit,
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

  const handleSubmit = () => {
    if (!selectedLead?.listingId) return;
    onSubmit({
      leadId,
      leadName: selectedLead.leadName,
      listingId: selectedLead.listingId,
      listingTitle: selectedLead.listingTitle,
      scheduledDate: date,
      scheduledTime: time,
      notes: notes || undefined,
    });
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-sm w-full overflow-hidden"
          >
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-foreground">Schedule Viewing</h3>
              <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Lead <span className="text-red-500">*</span>
                </label>
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
                    `${lead.fullName} — ${lead.listing?.listingTitle || 'Untitled listing'}`
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
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Date</label>
                <DatePicker value={date} onChange={setDate} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Time</label>
                <TimePicker value={time} onChange={setTime} />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border flex gap-3">
              <Button variant="ghost" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 gap-1.5"
                onClick={handleSubmit}
                disabled={!selectedLead?.listingId || !date || !time}
              >
                <CalendarClock className="w-4 h-4" />
                Schedule
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
