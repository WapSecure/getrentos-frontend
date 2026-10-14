import type { ReactNode } from 'react';
import { LandAvailabilityGate } from '@/components/land/availability/LandAvailabilityGate';

export default function BuyerLandLayout({ children }: { children: ReactNode }) {
  return <LandAvailabilityGate audience="marketplace">{children}</LandAvailabilityGate>;
}
