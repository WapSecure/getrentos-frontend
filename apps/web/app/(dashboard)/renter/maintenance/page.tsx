'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { renterService } from '@/services/renterService';
import { unwrap } from '@/lib/apiHelpers';
import { renterKeys } from '@/lib/queryKeys';
import type { MaintenanceRequest } from '@/types/maintenance';

interface ReportData {
  title: string;
  category: string;
  priority: string;
  description: string;
}

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: renterKeys.maintenanceRequests,
    queryFn: () => unwrap(renterService.listMaintenanceRequests()),
  });
  const [showReportModal, setShowReportModal] = useState(false);

  const invalidateRequests = () =>
    queryClient.invalidateQueries({ queryKey: renterKeys.maintenanceRequests });

  const createMutation = useMutation({
    mutationFn: (data: ReportData) => unwrap(renterService.createMaintenanceRequest(data)),
    onSuccess: invalidateRequests,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => unwrap(renterService.cancelMaintenanceRequest(id)),
    onSuccess: invalidateRequests,
  });

  const rateVendorMutation = useMutation({
    mutationFn: ({ id, rating }: { id: string; rating: number }) =>
      unwrap(renterService.rateVendor(id, rating)),
    onSuccess: invalidateRequests,
  });

  const handleReportIssue = (data: ReportData) => createMutation.mutate(data);

  const handleUpdateStatus = (id: string, status: MaintenanceRequest['status']) => {
    if (status !== 'cancelled') return;
    cancelMutation.mutate(id);
  };

  const handleRateVendor = (id: string, rating: number) =>
    rateVendorMutation.mutate({ id, rating });

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleMessage = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const scheduledMaintenance = [
    {
      id: 'sched_001',
      title: 'AC Maintenance',
      description: 'Routine AC servicing and filter replacement',
      scheduledDate: '2024-07-15',
      estimatedDuration: '2 hours',
      assignedVendor: 'CoolTech AC Services',
      status: 'scheduled' as const,
      type: 'routine' as const,
    },
    {
      id: 'sched_002',
      title: 'Pest Control',
      description: 'Quarterly pest control treatment',
      scheduledDate: '2024-07-20',
      estimatedDuration: '1.5 hours',
      assignedVendor: 'PestControl Pro',
      status: 'scheduled' as const,
      type: 'routine' as const,
    },
  ];

  const emergencyContacts = [
    {
      id: 'ec_001',
      name: 'Jane Smith',
      role: 'Property Manager',
      phone: '+1 234 567 8900',
      email: 'jane.smith@email.com',
      availableHours: '24/7',
    },
    {
      id: 'ec_002',
      name: 'John Doe',
      role: 'Maintenance Coordinator',
      phone: '+1 234 567 8901',
      email: 'john.doe@email.com',
      availableHours: '8am - 6pm',
    },
  ];

  const initialAlerts = [
    {
      id: 'alert_001',
      type: 'status_update' as const,
      title: 'Status Update',
      message: 'Your maintenance request has been assigned to a vendor',
      date: '2024-06-08T14:20:00',
      read: false,
    },
    {
      id: 'alert_002',
      type: 'vendor_assigned' as const,
      title: 'Vendor Assigned',
      message: 'Quick Plumbing Services has been assigned to your request',
      date: '2024-06-08T14:25:00',
      read: false,
    },
  ];
  const [alerts, setAlerts] = useState(initialAlerts);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <MaintenanceHeader onReport={() => setShowReportModal(true)} />
        <MaintenanceAlerts
          alerts={alerts}
          onMarkAsRead={(id) =>
            setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)))
          }
          onClearAll={() => setAlerts((prev) => prev.map((a) => ({ ...a, read: true })))}
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
          <ScheduledMaintenance schedules={scheduledMaintenance} />
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
