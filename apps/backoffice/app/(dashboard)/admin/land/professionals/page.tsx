'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, CircleAlert, ClipboardCheck } from 'lucide-react';
import { Badge, EmptyState, ListSkeleton, Select, PageHeader } from '@sureground/ui';
import { formatDate, unwrap } from '@sureground/shared';
import { useAdminUser } from '../../layout';
import { hasAdminPermission } from '@/lib/adminAccess';
import {
  adminLandProfessionalService,
  landProfessionalKeys,
} from '@/services/adminLandProfessionalService';
import {
  LAND_PROFESSIONAL_ROLE_LABELS,
  LAND_PROFESSIONAL_STATUS_LABELS,
  LAND_PROFESSIONAL_STATUS_VARIANT,
  type LandProfessionalRole,
  type LandProfessionalStatus,
} from '@/types/landProfessional';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Every status' },
  ...Object.entries(LAND_PROFESSIONAL_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];
const ROLE_OPTIONS = [
  { value: 'all', label: 'Every role' },
  ...Object.entries(LAND_PROFESSIONAL_ROLE_LABELS).map(([value, label]) => ({ value, label })),
];

export default function AdminLandProfessionalsPage() {
  const user = useAdminUser();
  const canView = hasAdminPermission(user?.roles, 'verifications.review');
  const [status, setStatus] = useState<string>('APPLIED');
  const [role, setRole] = useState<string>('all');
  const query = useQuery({
    queryKey: landProfessionalKeys.list(status, role),
    queryFn: () =>
      unwrap(
        adminLandProfessionalService.list({
          status: status === 'all' ? undefined : (status as LandProfessionalStatus),
          role: role === 'all' ? undefined : (role as LandProfessionalRole),
        })
      ),
    enabled: canView,
  });

  if (!canView) {
    return (
      <EmptyState
        icon={CircleAlert}
        title="You do not have access to land professionals"
        description="This needs the verifications review permission."
      />
    );
  }
  const items = query.data ?? [];
  return (
    <>
      <PageHeader
        title="Land professionals"
        description="Surveyors, lawyers, valuers and inspectors. Check each licence against the regulator's register before accrediting; only accredited professionals covering a parcel's state can be engaged on it."
        actions={
          <Link
            href="/admin/land/professionals/audits"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden /> Review audits
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-48">
          <Select
            value={status}
            onValueChange={setStatus}
            ariaLabel="Status"
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="w-48">
          <Select value={role} onValueChange={setRole} ariaLabel="Role" options={ROLE_OPTIONS} />
        </div>
      </div>
      {query.isLoading ? (
        <ListSkeleton rows={5} label="Loading professionals" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No one here"
          description="No professionals match these filters."
        />
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/admin/land/professionals/${encodeURIComponent(item.id)}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.name} · {LAND_PROFESSIONAL_ROLE_LABELS[item.role]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.regulator} {item.licenceNumber} · {item.practiceStates.join(', ')} ·
                    applied {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  {item.appealPending && <Badge variant="warning">appeal</Badge>}
                  <Badge variant={LAND_PROFESSIONAL_STATUS_VARIANT[item.status]}>
                    {LAND_PROFESSIONAL_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
