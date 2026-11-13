'use client';

import { formatLocation } from '@sureground/shared';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageErrorState, PageHeader, Skeleton } from '@sureground/ui';
import { MapPin } from '@sureground/icons';
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

export const LandPropertyShell = ({ propertyId, section, children }: LandPropertyShellProps) => {
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: landKeys.ownerDetail(propertyId),
    queryFn: () => unwrap(landService.getOwnerLand(propertyId)),
  });

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-10 w-80 max-w-full rounded-xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
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
        <PageHeader
          breadcrumbs={[
            { label: 'Land portfolio', href: LAND_DEVELOPER_ROUTES.portfolio() },
            { label: data.property.title || 'Land parcel' },
          ]}
          title={data.property.title || 'Land parcel'}
          description={
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {formatLocation(data.property.city, data.property.state)}
            </span>
          }
          actions={<LandDiligenceBadge status={data.diligence?.status} />}
        />
      </div>
      <LandPropertyNav propertyId={propertyId} active={section} className="mb-6" />
      {children(data)}
    </>
  );
};
