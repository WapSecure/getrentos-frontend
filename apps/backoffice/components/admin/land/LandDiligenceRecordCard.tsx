'use client';

import { motion } from 'framer-motion';
import { FileLock2, MapPin, Ruler, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatDate } from '@getrentos/shared';
import type { LandDiligenceRecord } from '@/types/land';
import { LandDiligenceStatusBadge } from './LandDiligenceStatusBadge';

interface LandDiligenceRecordCardProps {
  record: LandDiligenceRecord;
  onReview: () => void;
  delay?: number;
}

const titleCase = (value: string | null | undefined) =>
  value
    ? value
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
    : null;

export const LandDiligenceRecordCard = ({
  record,
  onReview,
  delay = 0,
}: LandDiligenceRecordCardProps) => {
  const location = [record.city, record.state].filter(Boolean).join(', ');
  const parcelLabel = [
    record.parcel.plotNumber && `Plot ${record.parcel.plotNumber}`,
    record.parcel.estateName,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="type-heading truncate text-base">{record.propertyTitle}</p>
          {parcelLabel && (
            <p className="mt-1 truncate text-sm text-muted-foreground">{parcelLabel}</p>
          )}
        </div>
        <LandDiligenceStatusBadge status={record.diligence.status} />
      </div>

      <div className="mt-4 space-y-2.5 text-sm text-muted-foreground">
        {location && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}
        <p className="flex items-center gap-2">
          <Ruler className="h-4 w-4 shrink-0" />
          <span>
            {record.parcel.areaValue.toLocaleString()} {titleCase(record.parcel.areaUnit) ?? 'area'}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <UserRound className="h-4 w-4 shrink-0" />
          <span className="truncate">{record.ownerName}</span>
        </p>
        <p className="flex items-center gap-2">
          <FileLock2 className="h-4 w-4 shrink-0" />
          <span>
            {record.ownershipProofCount} ownership proof
            {record.ownershipProofCount === 1 ? '' : 's'} securely on file
          </span>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-secondary/55 px-3 py-2.5 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Property verification: {titleCase(record.propertyVerificationStatus) ?? 'Pending'}
        </span>
        <span className="shrink-0 text-muted-foreground">{formatDate(record.createdAt)}</span>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <Button variant="outline" size="sm" fullWidth onClick={onReview}>
          Review diligence
        </Button>
      </div>
    </motion.article>
  );
};
