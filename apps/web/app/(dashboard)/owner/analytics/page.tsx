'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, RefreshCcw, BarChart3, X } from 'lucide-react';
import { OwnerNavbar } from '@/components/owner/navigation/OwnerNavbar';
import { OwnerSidebar } from '@/components/owner/dashboard/OwnerSidebar';
import { InvestmentStatsCards } from '@/components/owner/analytics/InvestmentStatsCards';
import { ROIComparisonChart } from '@/components/owner/analytics/ROIComparisonChart';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { ROUTES, isAuthenticated, STORAGE_KEYS, getDashboardRoute } from '@/lib/constants/auth';
import type { InvestmentMetrics } from '@/types/owner';

const mockMetrics: InvestmentMetrics[] = [
  {
    propertyId: 'oprop_001',
    propertyName: 'Ocean View Towers',
    purchasePrice: 118_000_000,
    currentValue: 145_000_000,
    appreciationRate: 22.9,
    rentalYield: undefined,
    roiPercentage: 22.9,
  },
  {
    propertyId: 'oprop_002',
    propertyName: 'Palm Court Villa',
    purchasePrice: 76_000_000,
    currentValue: 92_000_000,
    appreciationRate: 21.1,
    rentalYield: undefined,
    roiPercentage: 21.1,
  },
  {
    propertyId: 'oprop_003',
    propertyName: 'Lekki Waterfront Duplex',
    purchasePrice: 71_500_000,
    currentValue: 71_500_000,
    appreciationRate: 0,
    rentalYield: undefined,
    roiPercentage: 0,
  },
  {
    propertyId: 'oprop_004',
    propertyName: 'Ikoyi Heritage House',
    purchasePrice: 175_000_000,
    currentValue: 210_000_000,
    appreciationRate: 20,
    rentalYield: 6.4,
    roiPercentage: 26.4,
  },
];

export default function OwnerAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ fullName: string; email: string; role?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<InvestmentMetrics[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [convertingProperty, setConvertingProperty] = useState<InvestmentMetrics | null>(null);

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
        if (parsedUser.role && parsedUser.role !== 'owner') {
          router.replace(getDashboardRoute(parsedUser.role));
          return;
        }
      }
      setMetrics(mockMetrics);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const toggleCompare = (propertyId: string) => {
    setCompareIds((prev) =>
      prev.includes(propertyId) ? prev.filter((id) => id !== propertyId) : [...prev, propertyId]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#c4a747] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalInvested = metrics.reduce((sum, m) => sum + m.purchasePrice, 0);
  const totalCurrentValue = metrics.reduce((sum, m) => sum + m.currentValue, 0);
  const avgAppreciationRate = metrics.length
    ? metrics.reduce((sum, m) => sum + m.appreciationRate, 0) / metrics.length
    : 0;
  const avgRoiPercentage = metrics.length
    ? metrics.reduce((sum, m) => sum + m.roiPercentage, 0) / metrics.length
    : 0;

  const compareMetrics = metrics.filter((m) => compareIds.includes(m.propertyId));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a1a1f]">
      <OwnerNavbar user={user} />

      <div className="flex">
        <OwnerSidebar />

        <main className="flex-1 lg:ml-64 mt-16 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Investment Analytics
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Performance and ROI across your property portfolio
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={isComparing ? 'primary' : 'outline'}
                  className="gap-2"
                  onClick={() => setIsComparing((v) => !v)}
                >
                  <BarChart3 className="w-4 h-4" />
                  Compare
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>

            <InvestmentStatsCards
              totalInvested={totalInvested}
              totalCurrentValue={totalCurrentValue}
              avgAppreciationRate={avgAppreciationRate}
              avgRoiPercentage={avgRoiPercentage}
            />

            <div className="mb-6">
              <ROIComparisonChart metrics={metrics} />
            </div>

            {isComparing && compareMetrics.length > 0 && (
              <div className="mb-6 bg-[#c4a747]/5 border border-[#c4a747]/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Comparing {compareMetrics.length} propert
                    {compareMetrics.length === 1 ? 'y' : 'ies'}
                  </h3>
                  <button
                    onClick={() => setCompareIds([])}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {compareMetrics.map((m) => (
                    <div
                      key={m.propertyId}
                      className="bg-white dark:bg-[#1a2a2f] rounded-xl p-3 border border-gray-200 dark:border-white/10"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {m.propertyName}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Purchase: {formatCurrency(m.purchasePrice, { compact: true })}
                      </p>
                      <p className="text-xs text-gray-400">
                        Current: {formatCurrency(m.currentValue, { compact: true })}
                      </p>
                      <p className="text-sm font-bold text-[#c4a747] mt-1">
                        {m.roiPercentage.toFixed(1)}% ROI
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-[#1a2a2f] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 text-left text-xs text-gray-500 dark:text-gray-400">
                      {isComparing && <th className="p-4 font-medium w-10"></th>}
                      <th className="p-4 font-medium">Property</th>
                      <th className="p-4 font-medium">Purchase Price</th>
                      <th className="p-4 font-medium">Current Value</th>
                      <th className="p-4 font-medium">Appreciation</th>
                      <th className="p-4 font-medium">Rental Yield</th>
                      <th className="p-4 font-medium">ROI</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {metrics.map((m) => (
                      <tr
                        key={m.propertyId}
                        className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        {isComparing && (
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={compareIds.includes(m.propertyId)}
                              onChange={() => toggleCompare(m.propertyId)}
                              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#c4a747] focus:ring-[#c4a747]"
                            />
                          </td>
                        )}
                        <td className="p-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {m.propertyName}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatCurrency(m.purchasePrice, { compact: true })}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {formatCurrency(m.currentValue, { compact: true })}
                        </td>
                        <td
                          className={`p-4 font-medium whitespace-nowrap ${m.appreciationRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                        >
                          {m.appreciationRate >= 0 ? '+' : ''}
                          {m.appreciationRate.toFixed(1)}%
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {m.rentalYield !== undefined ? `${m.rentalYield.toFixed(1)}%` : '—'}
                        </td>
                        <td className="p-4 font-bold text-[#c4a747] whitespace-nowrap">
                          {m.roiPercentage.toFixed(1)}%
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-gray-500"
                            onClick={() => setConvertingProperty(m)}
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                            Convert to Rental
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {convertingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-sm w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900 dark:text-white">Convert to Rental</h3>
              <button
                onClick={() => setConvertingProperty(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Convert <strong>{convertingProperty.propertyName}</strong> into a rental listing?
                This will make the property available to manage under your Landlord workspace,
                alongside any active sale listing.
              </p>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-white/10 flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setConvertingProperty(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => setConvertingProperty(null)}
              >
                Convert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
