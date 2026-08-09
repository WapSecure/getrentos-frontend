'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RenterNavbar } from '@/components/renter/navigation/RenterNavbar';
import { RenterSidebar } from '@/components/renter/dashboard/RenterSidebar';
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
import { ROUTES, isAuthenticated, STORAGE_KEYS } from '@/lib/constants/auth';
import type {
  MaintenanceRequest,
  MaintenanceCategory,
  MaintenancePriority,
} from '@/types/maintenance';

interface ReportData {
  title: string;
  category: string;
  priority: string;
  description: string;
}

export default function MaintenancePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);

  const loadMaintenanceRequests = () => {
    const mockRequests: MaintenanceRequest[] = [
      {
        id: 'maint_001',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        title: 'Leaking Faucet in Kitchen',
        category: 'plumbing',
        description: 'The kitchen faucet has been leaking continuously for 2 days.',
        priority: 'medium',
        status: 'assigned',
        images: [],
        assignedVendorId: 'vendor_001',
        assignedVendorName: 'Quick Plumbing Services',
        createdAt: '2024-06-07T10:30:00',
        updatedAt: '2024-06-08T14:20:00',
        slaResponseTime: 4,
      },
      {
        id: 'maint_002',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        title: 'AC Not Cooling Properly',
        category: 'appliances',
        description: 'The AC unit is blowing warm air.',
        priority: 'urgent',
        status: 'in_progress',
        images: [],
        assignedVendorId: 'vendor_002',
        assignedVendorName: 'CoolTech AC Services',
        createdAt: '2024-06-05T09:15:00',
        updatedAt: '2024-06-06T16:00:00',
        slaResponseTime: 2,
      },
      {
        id: 'maint_003',
        propertyId: 'prop_001',
        propertyName: 'Modern Downtown Loft',
        title: 'Internet Connection Intermittent',
        category: 'internet',
        description: 'WiFi keeps disconnecting every 10-15 minutes.',
        priority: 'high',
        status: 'submitted',
        images: [],
        createdAt: '2024-06-10T08:45:00',
        updatedAt: '2024-06-10T08:45:00',
      },
    ];
    setRequests(mockRequests);
  };

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      loadMaintenanceRequests();
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleReportIssue = (data: ReportData) => {
    const newRequest: MaintenanceRequest = {
      id: `maint_${Date.now()}`,
      propertyId: 'prop_001',
      propertyName: 'Modern Downtown Loft',
      title: data.title,
      category: data.category as MaintenanceCategory,
      priority: data.priority as MaintenancePriority,
      description: data.description,
      status: 'submitted',
      images: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRequests([newRequest, ...requests]);
  };

  const handleUpdateStatus = (id: string, status: MaintenanceRequest['status']) => {
    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status, updatedAt: new Date().toISOString() } : req
      )
    );
  };

  const handleRateVendor = (id: string, rating: number) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, vendorRating: rating } : req))
    );
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <RenterNavbar user={user} />

      <div className="flex">
        <RenterSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
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
          </div>
        </main>
      </div>

      <ReportMaintenanceModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportIssue}
      />
    </div>
  );
}
