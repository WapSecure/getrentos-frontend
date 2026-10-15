'use client';

import { PortfolioImportView } from '@/components/agency/PortfolioImportView';
import { TenancyImportCard } from '@/components/agency/TenancyImportCard';

export default function AgencyImportPage() {
  return (
    <>
      <PortfolioImportView />
      <TenancyImportCard />
    </>
  );
}
