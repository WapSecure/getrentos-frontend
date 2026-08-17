'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Toast, type ToastVariant } from '@getrentos/ui';
import type { CreateMaintenanceRequestInput, MaintenanceRequest } from '@/types/maintenance';
import { renterService } from '@/services/renterService';

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
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

  const showToast = useCallback((message: string, variant: ToastVariant) => {
    setToast({ message, variant });
    window.setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const loadMaintenanceRequests = async () => {
      const res = await renterService.listMaintenanceRequests();
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        showToast(res.message || 'Unable to load maintenance requests.', 'error');
      }
    };
    loadMaintenanceRequests();

    const loadAlerts = async () => {
      const res = await renterService.listNotifications();
      if (res.success && res.data) {
        const maintenanceAlerts = res.data
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
  }, [showToast]);

  const handleReportIssue = async (data: CreateMaintenanceRequestInput): Promise<boolean> => {
    const res = await renterService.createMaintenanceRequest(data);
    if (res.success && res.data) {
      const created = res.data;
      setRequests((prev) => [created, ...prev]);
      showToast(
        data.isEmergency
          ? 'Emergency maintenance request submitted at urgent priority.'
          : 'Maintenance request submitted successfully.',
        'success'
      );
      return true;
    }

    showToast(res.message || 'Unable to submit your maintenance request.', 'error');
    return false;
  };

  const handleUpdateStatus = async (id: string, status: MaintenanceRequest['status']) => {
    if (status !== 'cancelled') return;
    const res = await renterService.cancelMaintenanceRequest(id);
    if (res.success && res.data) {
      const updated = res.data;
      setRequests((prev) => prev.map((req) => (req.id === id ? updated : req)));
      showToast('Maintenance request cancelled.', 'info');
    } else {
      showToast(res.message || 'Unable to cancel this maintenance request.', 'error');
    }
  };

  const handleRateVendor = async (id: string, rating: number) => {
    const res = await renterService.rateVendor(id, rating);
    if (res.success && res.data) {
      const updated = res.data;
      setRequests((prev) => prev.map((req) => (req.id === id ? updated : req)));
      showToast('Thanks for rating the vendor.', 'success');
    } else {
      showToast(res.message || 'Unable to submit your vendor rating.', 'error');
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Scheduled maintenance is derived from real requests that are still active
  // (submitted / assigned / in progress) — no fabricated entries.
  const scheduledMaintenance = requests
    .filter((r) => r.status !== 'resolved' && r.status !== 'cancelled')
    .map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      scheduledDate: r.updatedAt,
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
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}

      <div className="flex items-center justify-between mb-6">
        <MaintenanceHeader onReport={() => setShowReportModal(true)} />
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
      </div>

      <MaintenanceStats requests={requests} />

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

      <ReportMaintenanceModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportIssue}
      />
    </>
  );
}
