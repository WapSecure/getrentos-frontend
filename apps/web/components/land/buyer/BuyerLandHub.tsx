'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Button, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from '@sureground/ui';
import { LayoutGrid, Gavel, ScanSearch, UsersRound, Video } from 'lucide-react';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { PurchasesList } from './PurchasesList';
import { ReservationsList } from './ReservationsList';

type HubTab = 'purchases' | 'reservations';

export const BuyerLandHub = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab: HubTab = searchParams.get('tab') === 'reservations' ? 'reservations' : 'purchases';

  return (
    <div className="space-y-6">
      <PageHeader
        title="My land"
        description="Plots you are holding and the estate plots you are paying for."
        actions={
          <>
            <Button href="/buyer/land/tours" variant="ghost" icon={<Video className="h-4 w-4" />}>
              Video tours
            </Button>
            <Button
              href="/buyer/land/inspections"
              variant="ghost"
              icon={<ScanSearch className="h-4 w-4" />}
            >
              Inspections
            </Button>
            <Button
              href="/buyer/land/representatives"
              variant="ghost"
              icon={<UsersRound className="h-4 w-4" />}
            >
              Representatives
            </Button>
            <Button href="/land/disputes" variant="ghost" icon={<Gavel className="h-4 w-4" />}>
              Disputes
            </Button>
            <Button
              href={LAND_BUYER_ROUTES.LAYOUTS}
              variant="outline"
              icon={<LayoutGrid className="h-4 w-4" />}
            >
              Browse estates
            </Button>
          </>
        }
      />

      <Tabs
        value={tab}
        onValueChange={(value) =>
          router.replace(
            value === 'reservations' ? LAND_BUYER_ROUTES.HUB_RESERVATIONS : LAND_BUYER_ROUTES.HUB,
            { scroll: false }
          )
        }
      >
        <TabsList>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="reservations">Reservations</TabsTrigger>
        </TabsList>
        <TabsContent value="purchases" className="mt-5">
          <PurchasesList />
        </TabsContent>
        <TabsContent value="reservations" className="mt-5">
          <ReservationsList />
        </TabsContent>
      </Tabs>
    </div>
  );
};
