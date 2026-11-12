'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CircleAlert } from '@sureground/icons';
import { HomeAssetRegistry } from '@/components/home-management/HomeAssetRegistry';
import { HomeManagementDashboard } from '@/components/home-management/HomeManagementDashboard';
import { HomeManagementInspectionFeed } from '@/components/home-management/HomeManagementInspectionFeed';
import { HomeManagementOperationsCommandCenter } from '@/components/home-management/HomeManagementOperationsCommandCenter';
import { HomeManagementPortfolioAnalytics } from '@/components/home-management/HomeManagementPortfolioAnalytics';
import { HomeManagementRecordsPanel } from '@/components/home-management/HomeManagementRecordsPanel';
import { HomeManagementTimeline } from '@/components/home-management/HomeManagementTimeline';
import { HomeManagementVendorPerformance } from '@/components/home-management/HomeManagementVendorPerformance';
import { EmptyState, Skeleton } from '@sureground/ui';
import dynamic from 'next/dynamic';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import {
  homeManagementService,
  type HomeManagementProperty,
  type HomeManagementVendor,
} from '@/services/homeManagementService';
import { ownerService } from '@/services/ownerService';
import { propertyAuthorityService } from '@/services/propertyAuthorityService';

const sectionFallback = () => <Skeleton className="h-48 w-full rounded-xl" />;
const HomeManagementSlaPolicies = dynamic(
  () =>
    import('@/components/home-management/HomeManagementSlaPolicies').then(
      (m) => m.HomeManagementSlaPolicies
    ),
  { loading: sectionFallback }
);
const PreventiveMaintenancePlans = dynamic(
  () =>
    import('@/components/home-management/PreventiveMaintenancePlans').then(
      (m) => m.PreventiveMaintenancePlans
    ),
  { loading: sectionFallback }
);
const HomeManagementWorkOrderQueue = dynamic(
  () =>
    import('@/components/home-management/HomeManagementWorkOrderQueue').then(
      (m) => m.HomeManagementWorkOrderQueue
    ),
  { loading: sectionFallback }
);
const HomeManagementEscalationQueue = dynamic(
  () =>
    import('@/components/home-management/HomeManagementEscalationQueue').then(
      (m) => m.HomeManagementEscalationQueue
    ),
  { loading: sectionFallback }
);

export type HomeManagementWorkspaceRole = 'owner' | 'landlord' | 'manager';

interface HomeManagementWorkspaceProps {
  role: HomeManagementWorkspaceRole;
  /** Narrows everything to the client's property, so pickers, lists and history can't reach another client's home. */
  scopePropertyId?: string;
}

const ASSET_PAGE_SIZE = 12;
const PLAN_PAGE_SIZE = 10;
const WORK_ORDER_PAGE_SIZE = 10;

const normalizeProperties = (properties: HomeManagementProperty[]): HomeManagementProperty[] =>
  properties.map((property) => ({
    id: property.id,
    name: property.name,
    title: property.title,
    city: property.city,
    state: property.state,
  }));

export function HomeManagementWorkspace({ role, scopePropertyId }: HomeManagementWorkspaceProps) {
  const [assetPage, setAssetPage] = useState(1);
  const [chosenAssetPropertyId, setAssetPropertyId] = useState('');
  const assetPropertyId = scopePropertyId ?? chosenAssetPropertyId;
  const [planPage, setPlanPage] = useState(1);
  const [workOrderPage, setWorkOrderPage] = useState(1);

  const propertiesQuery = useQuery({
    queryKey: homeManagementKeys.properties(role),
    queryFn: async (): Promise<HomeManagementProperty[]> => {
      if (role === 'manager') {
        const managed = await unwrap(propertyAuthorityService.managed());
        return managed
          .filter((property) => property.canManage && !property.archived)
          .map((property) => ({
            id: property.propertyId,
            title: property.title,
            city: property.city,
            state: property.state,
          }));
      }
      if (role === 'owner') {
        const res = await unwrap(ownerService.listProperties({ page: 1, pageSize: 100 }));
        return normalizeProperties(res.items);
      }
      const res = await unwrap(landlordService.listProperties({ page: 1, pageSize: 100 }));
      return normalizeProperties(res.items);
    },
  });

  const assetsQuery = useQuery({
    queryKey: [
      ...homeManagementKeys.assets(assetPropertyId || undefined),
      { page: assetPage, pageSize: ASSET_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listAssets({
          propertyId: assetPropertyId || undefined,
          page: assetPage,
          pageSize: ASSET_PAGE_SIZE,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const plansQuery = useQuery({
    queryKey: [
      ...homeManagementKeys.plans,
      { page: planPage, pageSize: PLAN_PAGE_SIZE, propertyId: scopePropertyId },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listPlans({
          page: planPage,
          pageSize: PLAN_PAGE_SIZE,
          propertyId: scopePropertyId,
        })
      ),
    placeholderData: keepPreviousData,
  });

  const workOrdersQuery = useQuery({
    queryKey: [
      ...homeManagementKeys.workOrders,
      { page: workOrderPage, pageSize: WORK_ORDER_PAGE_SIZE, propertyId: scopePropertyId },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listWorkOrders({
          page: workOrderPage,
          pageSize: WORK_ORDER_PAGE_SIZE,
          propertyId: scopePropertyId,
        })
      ),
    placeholderData: keepPreviousData,
  });

  // The health summary counts every property the caller holds, so it is hidden while narrowed to one client.
  const dashboardQuery = useQuery({
    queryKey: homeManagementKeys.dashboard,
    enabled: !scopePropertyId,
    queryFn: () => unwrap(homeManagementService.getDashboard()),
  });

  // A manager's assignable vendors are the owners' directories for the properties they control; assignment is still validated against each owner at write time.
  const vendorsQuery = useQuery({
    queryKey: [...homeManagementKeys.vendors, role],
    queryFn: async (): Promise<HomeManagementVendor[]> => {
      if (role === 'manager') {
        return unwrap(homeManagementService.listAssignableVendors());
      }
      const res = await unwrap(landlordService.listVendors({ page: 1, pageSize: 100 }));
      return res.items.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        serviceType: vendor.serviceType,
        rating: vendor.rating,
        jobsCompleted: vendor.jobsCompleted,
      }));
    },
  });

  const allProperties = propertiesQuery.data ?? [];
  const properties = scopePropertyId
    ? allProperties.filter((property) => property.id === scopePropertyId)
    : allProperties;
  const assets = assetsQuery.data?.items ?? [];
  const plans = plansQuery.data?.items ?? [];
  const workOrders = workOrdersQuery.data?.items ?? [];
  const vendors = vendorsQuery.data ?? [];

  return (
    <div className="pb-10">
      <HomeManagementDashboard />

      {!scopePropertyId && (
        <>
          <HomeManagementOperationsCommandCenter
            role={role}
            summary={dashboardQuery.data}
            isLoading={dashboardQuery.isLoading}
          />

          <HomeManagementPortfolioAnalytics
            summary={dashboardQuery.data}
            isLoading={dashboardQuery.isLoading}
          />
        </>
      )}

      {role === 'landlord' && (
        <HomeManagementVendorPerformance vendors={vendors} isLoading={vendorsQuery.isLoading} />
      )}

      {propertiesQuery.isError && !propertiesQuery.data && (
        <div className="mt-8">
          <EmptyState
            icon={CircleAlert}
            title="Your properties could not be loaded"
            description="Home Management needs your property portfolio before new assets or care plans can be created. Refresh the page to try again."
          />
        </div>
      )}

      <HomeAssetRegistry
        assets={assets}
        properties={properties}
        isLoading={assetsQuery.isLoading || propertiesQuery.isLoading}
        error={assetsQuery.error as Error | null}
        page={assetPage}
        pageSize={ASSET_PAGE_SIZE}
        total={assetsQuery.data?.total ?? 0}
        selectedPropertyId={assetPropertyId}
        onPageChange={setAssetPage}
        onSelectedPropertyChange={(propertyId) => {
          setAssetPropertyId(propertyId);
          setAssetPage(1);
        }}
      />

      <PreventiveMaintenancePlans
        plans={plans}
        properties={properties}
        vendors={vendors}
        isLoading={plansQuery.isLoading || propertiesQuery.isLoading}
        error={plansQuery.error as Error | null}
        page={planPage}
        pageSize={PLAN_PAGE_SIZE}
        total={plansQuery.data?.total ?? 0}
        onPageChange={setPlanPage}
      />

      <HomeManagementSlaPolicies
        properties={properties}
        isPropertiesLoading={propertiesQuery.isLoading}
      />

      <HomeManagementEscalationQueue
        properties={properties}
        isPropertiesLoading={propertiesQuery.isLoading}
      />

      <HomeManagementWorkOrderQueue
        workOrders={workOrders}
        properties={properties}
        vendors={vendors}
        isLoading={workOrdersQuery.isLoading}
        isPropertiesLoading={propertiesQuery.isLoading}
        error={workOrdersQuery.error as Error | null}
        page={workOrderPage}
        pageSize={WORK_ORDER_PAGE_SIZE}
        total={workOrdersQuery.data?.total ?? 0}
        onPageChange={setWorkOrderPage}
        viewerRole={role}
      />

      <HomeManagementTimeline propertyId={scopePropertyId} />

      <HomeManagementInspectionFeed propertyId={scopePropertyId} />

      {/* The records panel links to owner/landlord routes the agency portal lacks, so managers don't get it. */}
      {role !== 'manager' && <HomeManagementRecordsPanel role={role} />}
    </div>
  );
}
