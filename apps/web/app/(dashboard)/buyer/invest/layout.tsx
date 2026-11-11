import type { ReactNode } from 'react';
import { DiasporaGate } from '@/components/diaspora/DiasporaGate';

export default function BuyerInvestLayout({ children }: { children: ReactNode }) {
  return <DiasporaGate portal="buyer">{children}</DiasporaGate>;
}
