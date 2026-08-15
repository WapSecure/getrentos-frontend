'use client';
import { useQuery } from '@tanstack/react-query';
import { Boxes, CalendarClock, ClipboardList, ShieldCheck, TriangleAlert } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { homeManagementService } from '@/services/homeManagementService';
const cards = [
  { key: 'assets', label: 'Active Assets', icon: Boxes },
  { key: 'plansDue', label: 'Care Plans Due', icon: CalendarClock },
  { key: 'openWorkOrders', label: 'Open Work Orders', icon: ClipboardList },
  { key: 'approvalQueue', label: 'Awaiting Approval', icon: ShieldCheck },
  { key: 'overdue', label: 'Overdue', icon: TriangleAlert },
];
export function HomeManagementDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: homeManagementKeys.dashboard,
    queryFn: () => unwrap(homeManagementService.getDashboard()),
  });
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-primary">GetRentos Home Management</p>
        <h1 className="mt-1 text-3xl font-semibold text-foreground">
          Operate every home with confidence.
        </h1>
        <p className="mt-2 text-muted-foreground">
          Assets, preventive care, work orders, vendors, approvals, and property health in one
          operating view.
        </p>
      </div>
      {error && <p className="mb-4 text-sm text-red-600">Unable to load Home Management data.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-2xl border border-border bg-card p-5">
            <Icon className="mb-3 h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">
              {isLoading ? '—' : (data?.[key as keyof typeof data] ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
