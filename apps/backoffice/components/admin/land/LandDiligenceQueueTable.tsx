'use client';

import Link from 'next/link';
import { AlertTriangle, ShieldAlert, UserRound, UsersRound } from 'lucide-react';
import { Badge, DataTable, type Column } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { LandDiligenceRecord } from '@/types/land';
import { describeSla, riskBadgeVariant, riskBandFor } from '@/lib/landDiligence';
import { LandDiligenceStatusBadge } from './LandDiligenceStatusBadge';

export const landCaseHref = (propertyId: string) =>
  `/admin/land/diligence/${encodeURIComponent(propertyId)}`;

const slaClass = {
  overdue: 'font-semibold text-destructive',
  soon: 'font-medium text-warning',
  ok: 'text-foreground',
  none: 'text-muted-foreground',
} as const;

const columns: Column<LandDiligenceRecord>[] = [
  {
    key: 'parcel',
    header: 'Parcel',
    render: (record) => {
      const parcelLabel = [
        record.parcel.plotNumber && `Plot ${record.parcel.plotNumber}`,
        record.parcel.estateName,
        [record.city, record.state].filter(Boolean).join(', '),
      ]
        .filter(Boolean)
        .join(' · ');
      return (
        <div className="min-w-[14rem]">
          <Link
            href={landCaseHref(record.propertyId)}
            className="font-medium text-foreground hover:text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            {record.propertyTitle}
          </Link>
          {parcelLabel && <p className="mt-0.5 text-xs text-muted-foreground">{parcelLabel}</p>}
          <p className="mt-0.5 text-xs text-muted-foreground">Owner: {record.ownerName}</p>
        </div>
      );
    },
  },
  {
    key: 'status',
    header: 'Status',
    render: (record) => (
      <div className="flex flex-col items-start gap-1">
        <LandDiligenceStatusBadge status={record.diligence.status} />
        {record.diligence.awaitingSecondApproval && (
          <Badge variant="info" icon={<UsersRound className="h-3 w-3" />}>
            Needs 2nd approval
          </Badge>
        )}
      </div>
    ),
  },
  {
    key: 'sla',
    header: 'SLA due',
    render: (record) => {
      const sla = describeSla(record.diligence.slaDueAt, record.diligence.overdue);
      return (
        <div className="whitespace-nowrap">
          <p className={`text-sm ${slaClass[sla.tone]}`}>
            {sla.tone === 'overdue' && <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}
            {sla.label}
          </p>
          {record.diligence.slaDueAt && (
            <p className="text-xs text-muted-foreground">{formatDate(record.diligence.slaDueAt)}</p>
          )}
        </div>
      );
    },
  },
  {
    key: 'assignee',
    header: 'Assignee',
    render: (record) =>
      record.diligence.assignedToName ? (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-sm">
          <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
          {record.diligence.assignedToName}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Unassigned</span>
      ),
  },
  {
    key: 'conflicts',
    header: 'Conflicts',
    render: (record) => {
      const count = record.blockingConflicts ?? 0;
      return count > 0 ? (
        <Badge variant="danger" icon={<ShieldAlert className="h-3 w-3" />}>
          {count}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">0</span>
      );
    },
  },
  {
    key: 'risk',
    header: 'Risk',
    render: (record) => {
      const score = record.diligence.riskScore;
      const band = riskBandFor(score);
      return band ? (
        <Badge variant={riskBadgeVariant(band)}>
          {score} · {band.toLowerCase()}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">Not scored</span>
      );
    },
  },
  {
    key: 'submitted',
    header: 'Submitted',
    render: (record) => (
      <span className="whitespace-nowrap text-sm text-muted-foreground">
        {formatDate(record.diligence.submittedAt ?? record.createdAt)}
      </span>
    ),
  },
];

interface LandDiligenceQueueTableProps {
  records: LandDiligenceRecord[];
  onOpen: (record: LandDiligenceRecord) => void;
  isLoading?: boolean;
  footer?: React.ReactNode;
}

/** The diligence work queue: one row per case, opened into the full case page. */
export const LandDiligenceQueueTable = ({
  records,
  onOpen,
  isLoading,
  footer,
}: LandDiligenceQueueTableProps) => (
  <DataTable
    columns={columns}
    data={records}
    getRowKey={(record) => record.propertyId}
    onRowClick={onOpen}
    getRowClassName={(record) =>
      record.diligence.overdue ? 'bg-destructive/5 hover:bg-destructive/10' : undefined
    }
    isLoading={isLoading}
    footer={footer}
  />
);
