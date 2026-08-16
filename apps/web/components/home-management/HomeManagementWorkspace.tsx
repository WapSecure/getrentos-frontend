'use client';

import { useQuery } from '@tanstack/react-query';
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

const normalizeProperties = (properties: HomeManagementProperty[]): HomeManagementProperty[] =>
  properties.map((property) => ({
    id: property.id,
    name: property.name,
    title: property.title,
    city: property.city,
    state: property.state,
  }));

export function HomeManagementWorkspace({ role }: HomeManagementWorkspaceProps) {
  const propertiesQuery = useQuery({
    queryKey: homeManagementKeys.properties(role),
    queryFn: async (): Promise<HomeManagementProperty[]> => {
      if (role === 'owner') {
        return normalizeProperties(await unwrap(ownerService.listProperties()));
      }
      return normalizeProperties(await unwrap(landlordService.listProperties()));
    },
  });

  const assetsQuery = useQuery({
    queryKey: homeManagementKeys.assets(),
    queryFn: () => unwrap(homeManagementService.listAssets()),
  });

  const plansQuery = useQuery({
    queryKey: homeManagementKeys.plans,
    queryFn: () => unwrap(homeManagementService.listPlans()),
  });

  const workOrdersQuery = useQuery({
    queryKey: homeManagementKeys.workOrders,
    queryFn: () => unwrap(homeManagementService.listWorkOrders()),
  });

  const vendorsQuery = useQuery({
    enabled: role === 'landlord',
    queryKey: homeManagementKeys.vendors,
    queryFn: async (): Promise<HomeManagementVendor[]> =>
      (await unwrap(landlordService.listVendors())).map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        serviceType: vendor.serviceType,
        rating: vendor.rating,
        jobsCompleted: vendor.jobsCompleted,
      })),
  });

  const properties = propertiesQuery.data ?? [];
  const assets = assetsQuery.data ?? [];
  const plans = plansQuery.data ?? [];
  const workOrders = workOrdersQuery.data ?? [];
  const vendors = vendorsQuery.data ?? [];

  return (
    <div className="pb-10">
      <HomeManagementDashboard />

      <HomeManagementOperationsCommandCenter
        role={role}
        properties={properties}
        assets={assets}
        plans={plans}
        workOrders={workOrders}
        isLoading={
          propertiesQuery.isLoading ||
          assetsQuery.isLoading ||
          plansQuery.isLoading ||
          workOrdersQuery.isLoading
        }
      />

      <HomeManagementPortfolioAnalytics
        properties={properties}
        workOrders={workOrders}
        assets={assets}
        isLoading={propertiesQuery.isLoading || workOrdersQuery.isLoading || assetsQuery.isLoading}
      />

      {role === 'landlord' && (
        <HomeManagementVendorPerformance
          vendors={vendors}
          workOrders={workOrders}
          isLoading={vendorsQuery.isLoading}
        />
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
      />

      <PreventiveMaintenancePlans
        plans={plans}
        assets={assets}
        properties={properties}
        vendors={vendors}
        isLoading={plansQuery.isLoading || propertiesQuery.isLoading}
        error={plansQuery.error as Error | null}
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
        assets={assets}
        vendors={vendors}
        isLoading={workOrdersQuery.isLoading}
        isPropertiesLoading={propertiesQuery.isLoading}
        error={workOrdersQuery.error as Error | null}
      />

      <HomeManagementTimeline />

      <HomeManagementInspectionFeed />

      <HomeManagementRecordsPanel role={role} />
    </div>
  );
}
