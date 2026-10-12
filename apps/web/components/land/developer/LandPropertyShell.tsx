'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PageErrorState } from '@getrentos/ui';
import { ArrowLeft, MapPin } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { landKeys } from '@/lib/queryKeys';
import { LAND_DEVELOPER_ROUTES } from '@/lib/constants/landDeveloperRoutes';
import { landService } from '@/services/landService';
import type { OwnerLandRecord } from '@/types/land';
import { LandDiligenceBadge } from '../LandDiligenceBadge';
import { LandPropertyNav, type LandPropertySection } from './LandPropertyNav';

interface LandPropertyShellProps {
  propertyId: string;
  section: LandPropertySection;
  children: (record: OwnerLandRecord) => ReactNode;
}

/** The header, back link and section navigation around one land property's pages. */
export const LandPropertyShell = ({ propertyId, section, children }: LandPropertyShellProps) => {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: landKeys.ownerDetail(propertyId),
    queryFn: () => unwrap(landService.getOwnerLand(propertyId)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-16 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-10 w-80 max-w-full animate-pulse rounded-xl bg-secondary" />
        <div className="h-96 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <PageErrorState
        title="We could not open this land property"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
      />
    );
  }

  return (
    <>
      <div className="mb-5">
        <Link
          href={LAND_DEVELOPER_ROUTES.portfolio()}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Land portfolio
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-[-0.03em] text-foreground">
              {data.property.title || 'Land parcel'}
            </h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {[data.property.city, data.property.state].filter(Boolean).join(', ')}
            </p>
          </div>
          <LandDiligenceBadge status={data.diligence?.status} />
        </div>
      </div>
      <LandPropertyNav propertyId={propertyId} active={section} className="mb-6" />
      {children(data)}
    </>
  );
};
