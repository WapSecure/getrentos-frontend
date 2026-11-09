'use client';

import { SegmentedBar, StatGroup } from '@sureground/ui';
import { useMonetaryVisibility } from '@/hooks/useMonetaryVisibility';
import { formatCurrency } from '@/lib/format';
import { ROUTES } from '@/lib/constants/auth';

interface LandlordStatsCardsProps {
  totalProperties: number;
  occupiedUnits: number;
  reservedUnits: number;
  vacantUnits: number;
  annualRentRoll: number;
  outstandingPayments: number;
  outstandingAmount: number;
  activeMaintenanceRequests: number;
}

const HIDDEN = '••••••';

export const LandlordStatsCards = ({
  totalProperties,
  occupiedUnits,
  reservedUnits,
  vacantUnits,
  annualRentRoll,
  outstandingPayments,
  outstandingAmount,
  activeMaintenanceRequests,
}: LandlordStatsCardsProps) => {
  const { visible: moneyVisible } = useMonetaryVisibility();
  const totalUnits = occupiedUnits + reservedUnits + vacantUnits;

  return (
    <div className="mb-8 space-y-4">
      <StatGroup
        title="Rent and operations"
        items={[
          {
            label: 'Annual rent roll',
            // Rent is contracted and paid yearly, so this is an annual figure, not monthly revenue.
            value: moneyVisible ? formatCurrency(annualRentRoll, { compact: true }) : HIDDEN,
            subtitle: 'Contracted across let units, per year',
            href: ROUTES.LANDLORD_FINANCIALS,
          },
          {
            label: 'Outstanding rent',
            value: moneyVisible ? formatCurrency(outstandingAmount, { compact: true }) : HIDDEN,
            subtitle:
              outstandingPayments === 1
                ? 'Across 1 unpaid charge'
                : `Across ${outstandingPayments} unpaid charges`,
            attention: outstandingPayments > 0,
            href: ROUTES.LANDLORD_PAYMENTS,
          },
          {
            label: 'Active maintenance',
            value: activeMaintenanceRequests,
            subtitle: activeMaintenanceRequests === 1 ? 'Open ticket' : 'Open tickets',
            attention: activeMaintenanceRequests > 0,
            href: ROUTES.LANDLORD_MAINTENANCE,
          },
        ]}
      />
      <StatGroup
        title="Portfolio"
        items={[
          {
            label: 'Properties',
            value: totalProperties,
            subtitle: `${totalUnits} ${totalUnits === 1 ? 'unit' : 'units'} in total`,
            href: ROUTES.LANDLORD_PROPERTIES,
          },
          { label: 'Occupied', value: occupiedUnits, subtitle: 'Signed and let' },
          {
            label: 'Reserved',
            value: reservedUnits,
            // Off the market but not let (awaiting signature or first payment), so not counted as rented.
            subtitle: 'Awaiting signature or payment',
          },
          {
            label: 'Vacant',
            value: vacantUnits,
            subtitle: 'Available now',
            href: ROUTES.LANDLORD_UNITS,
          },
        ]}
        footer={
          totalUnits > 0 ? (
            <SegmentedBar
              label="Units by status"
              segments={[
                { label: 'Occupied', value: occupiedUnits, tone: 'success' },
                { label: 'Reserved', value: reservedUnits, tone: 'warning' },
                { label: 'Vacant', value: vacantUnits, tone: 'neutral' },
              ]}
            />
          ) : undefined
        }
      />
    </div>
  );
};
