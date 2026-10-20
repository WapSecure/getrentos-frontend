'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MaintenanceHeader } from '@/components/renter/maintenance/MaintenanceHeader';
import { MaintenanceStats } from '@/components/renter/maintenance/MaintenanceStats';
import { MaintenanceList } from '@/components/renter/maintenance/MaintenanceList';
import { MaintenanceAnalytics } from '@/components/renter/maintenance/MaintenanceAnalytics';
import { QuickReport } from '@/components/renter/maintenance/QuickReport';
import { MaintenanceChecklist } from '@/components/renter/maintenance/MaintenanceChecklist';
import { ScheduledMaintenance } from '@/components/renter/maintenance/ScheduledMaintenance';
import { EmergencyContact } from '@/components/renter/maintenance/EmergencyContact';
import { MaintenanceAlerts } from '@/components/renter/maintenance/MaintenanceAlerts';
import { ReportMaintenanceModal } from '@/components/renter/maintenance/ReportMaintenanceModal';
import { ListSkeleton, PageErrorState, Pagination, useToast } from '@getrentos/ui';
import type { CreateMaintenanceRequestInput, MaintenanceRequest } from '@/types/maintenance';
import { renterService } from '@/services/renterService';

export default function MaintenancePage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [hasLoadedRequests, setHasLoadedRequests] = useState(false);
  const [requestsError, setRequestsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showReportModal, setShowReportModal] = useState(false);
  const toast = useToast();
  const [alerts, setAlerts] = useState<
    {
      id: string;
      type: 'status_update' | 'vendor_assigned';
      title: string;
      message: string;
      date: string;
      read: boolean;
    }[]
  >([]);
  const [emergencyContacts, setEmergencyContacts] = useState<
    {
      id: string;
      name: string;
      role: string;
      phone: string;
      email: string;
      availableHours: string;
    }[]
  >([]);

  useEffect(() => {
    const loadMaintenanceRequests = async () => {
      setIsLoadingRequests(true);
      setRequestsError(false);
      const res = await renterService.listMaintenanceRequests({ page, pageSize: PAGE_SIZE });
      if (res.success && res.data) {
        setRequests(res.data.items ?? []);
        setTotal(res.data.total ?? 0);
        setHasLoadedRequests(true);
      } else {
        setRequestsError(true);
        toast.error(res.message || 'Unable to load maintenance requests.');
      }
      setIsLoadingRequests(false);
    };
    loadMaintenanceRequests();

    const loadAlerts = async () => {
      const res = await renterService.listNotifications();
      if (res.success && res.data) {
        const maintenanceAlerts = (res.data.items ?? [])
          .filter((n) => n.type === 'maintenance')
          .map((n) => ({
            id: n.id,
            type: 'status_update' as const,
            title: n.title,
            message: n.message,
            date: n.createdAt,
            read: n.read,
          }));
        setAlerts(maintenanceAlerts);
      }
    };
    loadAlerts();

    const loadLandlordContact = async () => {
      const res = await renterService.getLease();
      if (res.success && res.data) {
        setEmergencyContacts([
          {
            id: 'landlord',
            name: res.data.landlord.name,
            role: 'Landlord',
            phone: res.data.landlord.phone,
            email: res.data.landlord.email,
            availableHours: 'Contact via message for fastest response',
          },
        ]);
      }
    };
    loadLandlordContact();
  }, [page, reloadKey, toast]);

  const handleReportIssue = async (
    data: CreateMaintenanceRequestInput,
    photos: File[] = []
  ): Promise<boolean> => {
    const res = await renterService.createMaintenanceRequest(data, photos);
    if (res.success && res.data) {
      const created = res.data;
      setRequests((prev) => [created, ...prev]);
      toast.success(
        data.isEmergency
          ? 'Emergency maintenance request submitted at urgent priority.'
          : 'Maintenance request submitted successfully.'
      );
      return true;
    }

    toast.error(res.message || 'Unable to submit your maintenance request.');
    return false;
  };

  const handleUpdateStatus = async (id: string, status: MaintenanceRequest['status']) => {
    if (status !== 'cancelled') return;
    const res = await renterService.cancelMaintenanceRequest(id);
    if (res.success && res.data) {
      const updated = res.data;
      setRequests((prev) => prev.map((req) => (req.id === id ? updated : req)));
      toast.info('Maintenance request cancelled.');
    } else {
      toast.error(res.message || 'Unable to cancel this maintenance request.');
    }
  };

  const handleRateVendor = async (id: string, rating: number) => {
    const res = await renterService.rateVendor(id, rating);
    if (res.success && res.data) {
      const updated = res.data;
      setRequests((prev) => prev.map((req) => (req.id === id ? updated : req)));
      toast.success('Thanks for rating the vendor.');
      return true;
    } else {
      toast.error(res.message || 'Unable to submit your vendor rating.');
      return false;
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = () => {
    // Keep the conversation on-platform (GetRentos messaging) rather than opening
    // the device's email client: in-app messaging is the channel the rest of the
    // product points tenants to, and it keeps a record against the tenancy.
    router.push('/renter/messages');
  };

  // Scheduled maintenance is derived from real requests that are still active
  // (submitted / assigned / in progress): no fabricated entries.
  const scheduledMaintenance = requests
    .filter((r) => r.scheduledFor && r.status !== 'resolved' && r.status !== 'cancelled')
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      scheduledDate: r.scheduledFor as string,
      estimatedDuration: r.slaResponseTime
        ? `${Math.max(1, Math.round(r.slaResponseTime / 60))} hour(s)`
        : 'As scheduled',
      assignedVendor: r.assignedVendorName || 'To be assigned',
      status:
        r.status === 'in_progress'
          ? ('in_progress' as const)
          : r.status === 'assigned'
            ? ('scheduled' as const)
            : ('scheduled' as const),
      type: 'routine' as const,
    }));

  return (
    <>
      <div className="mb-6">
        <MaintenanceHeader
          onReport={() => setShowReportModal(true)}
          extraAction={
            <MaintenanceAlerts
              alerts={alerts}
              onMarkAsRead={(id) => {
                setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
                renterService.markNotificationAsRead(id);
              }}
              onClearAll={() => {
                setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
                renterService.markAllNotificationsAsRead();
              }}
            />
          }
        />
      </div>

      {hasLoadedRequests && <MaintenanceStats requests={requests} />}

      {isLoadingRequests && !hasLoadedRequests ? (
        <ListSkeleton className="mt-6" />
      ) : requestsError && !hasLoadedRequests ? (
        <PageErrorState
          title="Maintenance requests are unavailable"
          description="We could not load your reported issues. No request has been changed."
          onRetry={() => setReloadKey((value) => value + 1)}
          isRetrying={isLoadingRequests}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <MaintenanceList
              requests={requests}
              onUpdateStatus={handleUpdateStatus}
              onRateVendor={handleRateVendor}
            />
          </div>
          <div className="space-y-6">
            <QuickReport onQuickReport={handleReportIssue} />
            <MaintenanceAnalytics requests={requests} />
            <MaintenanceChecklist />
            <ScheduledMaintenance
              schedules={scheduledMaintenance}
              onSchedule={() => setShowReportModal(true)}
            />
            <EmergencyContact
              contacts={emergencyContacts}
              onCall={handleCall}
              onMessage={handleMessage}
            />
          </div>
        </div>
      )}

      <ReportMaintenanceModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportIssue}
      />

      {total > 0 && (
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
          className="mt-6"
        />
      )}
    </>
  );
}
