'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Hourglass, Landmark, LayoutGrid } from 'lucide-react';
import { unwrap } from '@/lib/apiHelpers';
import { LAND_BUYER_ROUTES } from '@/lib/constants/landBuyerRoutes';
import { buyerLandKeys } from '@/lib/landSalesQueryKeys';
import { landBuyerService } from '@/services/landBuyerService';
import { useNow } from './useNow';

const LIVE_PURCHASE_PAGE = { page: 1, pageSize: 1 };

/**
 * Shortcuts above the buyer's land marketplace: estates selling plots, and
 * the buyer's own holds and purchases (counts load quietly; a failure just
 * hides the number).
 */
export const BuyerLandSummaryBanner = () => {
  const now = useNow(60_000);
  const reservations = useQuery({
    queryKey: buyerLandKeys.reservations,
    queryFn: () => unwrap(landBuyerService.listReservations()),
  });
  const purchases = useQuery({
    queryKey: buyerLandKeys.purchaseList(LIVE_PURCHASE_PAGE),
    queryFn: () => unwrap(landBuyerService.listPurchases(LIVE_PURCHASE_PAGE)),
  });
  const holding = (reservations.data ?? []).filter(
    (r) => r.status === 'ACTIVE' && new Date(r.expiresAt).getTime() > now
  ).length;
  const purchaseCount = purchases.data?.total;

  const tiles = [
    {
      href: LAND_BUYER_ROUTES.LAYOUTS,
      icon: LayoutGrid,
      title: 'Estates selling plots',
      body: 'Reserve a plot and pay on a plan',
    },
    {
      href: LAND_BUYER_ROUTES.HUB_RESERVATIONS,
      icon: Hourglass,
      title: 'My reservations',
      body: reservations.data
        ? `${holding} plot${holding === 1 ? '' : 's'} on hold`
        : 'Plots you are holding',
    },
    {
      href: LAND_BUYER_ROUTES.HUB,
      icon: Landmark,
      title: 'My plot purchases',
      body:
        purchaseCount !== undefined
          ? `${purchaseCount} purchase${purchaseCount === 1 ? '' : 's'}`
          : 'Installments, statements and documents',
    },
  ];

  return (
    <nav aria-label="Estate plots" className="mb-8 grid gap-3 sm:grid-cols-3">
      {tiles.map(({ href, icon: Icon, title, body }) => (
        <Link
          key={title}
          href={href}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-foreground">{title}</span>
            <span className="block truncate text-xs text-muted-foreground">{body}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </Link>
      ))}
    </nav>
  );
};
