'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { HomeAssetRegistry } from '@/components/home-management/HomeAssetRegistry';
import { HomeManagementDashboard } from '@/components/home-management/HomeManagementDashboard';
import { HomeManagementEscalationQueue } from '@/components/home-management/HomeManagementEscalationQueue';
import { HomeManagementInspectionFeed } from '@/components/home-management/HomeManagementInspectionFeed';
import { HomeManagementOperationsCommandCenter } from '@/components/home-management/HomeManagementOperationsCommandCenter';
import { HomeManagementPortfolioAnalytics } from '@/components/home-management/HomeManagementPortfolioAnalytics';
import { HomeManagementRecordsPanel } from '@/components/home-management/HomeManagementRecordsPanel';
import { HomeManagementSlaPolicies } from '@/components/home-management/HomeManagementSlaPolicies';
import { HomeManagementTimeline } from '@/components/home-management/HomeManagementTimeline';
import { HomeManagementVendorPerformance } from '@/components/home-management/HomeManagementVendorPerformance';
import { HomeManagementWorkOrderQueue } from '@/components/home-management/HomeManagementWorkOrderQueue';
import { PreventiveMaintenancePlans } from '@/components/home-management/PreventiveMaintenancePlans';
import { EmptyState } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { homeManagementKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import {
  homeManagementService,
  type HomeManagementProperty,
  type HomeManagementVendor,
} from '@/services/homeManagementService';
import { ownerService } from '@/services/ownerService';

export type HomeManagementWorkspaceRole = 'owner' | 'landlord';

interface HomeManagementWorkspaceProps {
  role: HomeManagementWorkspaceRole;
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

export function HomeManagementWorkspace({ role }: HomeManagementWorkspaceProps) {
  const [assetPage, setAssetPage] = useState(1);
  const [assetPropertyId, setAssetPropertyId] = useState('');
  const [planPage, setPlanPage] = useState(1);
  const [workOrderPage, setWorkOrderPage] = useState(1);

  const propertiesQuery = useQuery({
    queryKey: homeManagementKeys.properties(role),
    queryFn: async (): Promise<HomeManagementProperty[]> => {
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
  });

  const plansQuery = useQuery({
    queryKey: [...homeManagementKeys.plans, { page: planPage, pageSize: PLAN_PAGE_SIZE }],
    queryFn: () =>
      unwrap(homeManagementService.listPlans({ page: planPage, pageSize: PLAN_PAGE_SIZE })),
  });

  const workOrdersQuery = useQuery({
    queryKey: [
      ...homeManagementKeys.workOrders,
      { page: workOrderPage, pageSize: WORK_ORDER_PAGE_SIZE },
    ],
    queryFn: () =>
      unwrap(
        homeManagementService.listWorkOrders({
          page: workOrderPage,
          pageSize: WORK_ORDER_PAGE_SIZE,
        })
      ),
  });

  const dashboardQuery = useQuery({
    queryKey: homeManagementKeys.dashboard,
    queryFn: () => unwrap(homeManagementService.getDashboard()),
  });

  const vendorsQuery = useQuery({
    enabled: role === 'landlord',
    queryKey: homeManagementKeys.vendors,
    queryFn: async (): Promise<HomeManagementVendor[]> => {
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

  const properties = propertiesQuery.data ?? [];
  const assets = assetsQuery.data?.items ?? [];
  const plans = plansQuery.data?.items ?? [];
  const workOrders = workOrdersQuery.data?.items ?? [];
  const vendors = vendorsQuery.data ?? [];

  return (
    <div className="pb-10">
      <HomeManagementDashboard />

      <HomeManagementOperationsCommandCenter
        role={role}
        summary={dashboardQuery.data}
        isLoading={dashboardQuery.isLoading}
      />

      <HomeManagementPortfolioAnalytics
        summary={dashboardQuery.data}
        isLoading={dashboardQuery.isLoading}
      />

      {role === 'landlord' && (
        <HomeManagementVendorPerformance vendors={vendors} isLoading={vendorsQuery.isLoading} />
      )}

      {propertiesQuery.isError && (
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
        role={role}
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
      />

      <HomeManagementTimeline />

      <HomeManagementInspectionFeed />

      <HomeManagementRecordsPanel role={role} />
    </div>
  );
}
