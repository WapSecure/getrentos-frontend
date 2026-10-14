import type { ReactNode } from 'react';
import { LandAvailabilityGate } from '@/components/land/availability/LandAvailabilityGate';

export default function OwnerLandLayout({ children }: { children: ReactNode }) {
  return <LandAvailabilityGate audience="owners">{children}</LandAvailabilityGate>;
}
