'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileSpreadsheet, Check } from 'lucide-react';
import { LandlordNavbar } from '@/components/landlord/navigation/LandlordNavbar';
import { LandlordSidebar } from '@/components/landlord/dashboard/LandlordSidebar';
import { FinancialStats } from '@/components/landlord/financials/FinancialStats';
import { FinancialChart } from '@/components/landlord/financials/FinancialChart';
import { Button } from '@/components/ui/Button';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';

type ReportPeriod = 'monthly' | 'quarterly' | 'yearly';

const periodOptions: { value: ReportPeriod; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

export default function LandlordFinancialsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [exportedFormat, setExportedFormat] = useState<'csv' | 'pdf' | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      if (!authenticated) {
        router.replace(ROUTES.LOGIN);
        return;
      }
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.role && parsedUser.role !== 'landlord') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleExport = (format: 'csv' | 'pdf') => {
    setExportedFormat(format);
    window.setTimeout(() => setExportedFormat(null), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mock values scale slightly with the selected reporting period for realism
  const periodMultiplier = period === 'monthly' ? 1 : period === 'quarterly' ? 3 : 12;
  const rentalIncome = 3_750_000 * periodMultiplier;
  const outstandingRent = 380_000;
  const maintenanceCosts = 705_000 * periodMultiplier;
  const netProfit = rentalIncome - maintenanceCosts;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <LandlordNavbar user={user} />

      <div className="flex">
        <LandlordSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financials</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track income, expenses, and profitability
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleExport('csv')}
                >
                  {exportedFormat === 'csv' ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  {exportedFormat === 'csv' ? 'Exported' : 'Export CSV'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleExport('pdf')}
                >
                  {exportedFormat === 'pdf' ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {exportedFormat === 'pdf' ? 'Downloaded' : 'Download PDF'}
                </Button>
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/10 rounded-lg w-fit mb-6">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    period === option.value
                      ? 'bg-white dark:bg-[#1a2a2f] text-[#c4a747] shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <FinancialStats
              rentalIncome={rentalIncome}
              outstandingRent={outstandingRent}
              maintenanceCosts={maintenanceCosts}
              netProfit={netProfit}
            />

            <FinancialChart />
          </div>
        </main>
      </div>
    </div>
  );
}
