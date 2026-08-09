'use client';

import { useState, useEffect } from 'react';
import { Search, ShieldAlert } from 'lucide-react';
import { FraudAlertCard } from '@/components/admin/fraud/FraudAlertCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';
import { adminService } from '@/services/adminService';
import type { FraudAlert, FraudAlertSeverity, FraudAlertStatus } from '@/types/admin';

type StatusFilter = 'all' | FraudAlertStatus;
type SeverityFilter = 'all' | FraudAlertSeverity;

export default function AdminFraudPage() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      const response = await adminService.listFraudAlerts();
      if (response.success && response.data) {
        setAlerts(response.data);
      }
      setIsLoading(false);
    };

    fetchAlerts();
  }, []);

  const updateStatus = async (id: string, status: FraudAlertStatus) => {
    if (status === 'flagged') return;
    const response = await adminService.updateFraudAlertStatus(id, status);
    if (response.success) {
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSearch =
      a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.relatedEntity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesSeverity = severityFilter === 'all' || a.severity === severityFilter;
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'cleared', label: 'Cleared' },
    { value: 'confirmed', label: 'Confirmed' },
  ];

  const severityOptions: { value: SeverityFilter; label: string }[] = [
    { value: 'all', label: 'All Severities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Fraud &amp; Risk Review</h1>
        <p className="text-muted-foreground mt-1">
          {alerts.filter((a) => a.status === 'flagged').length} alert
          {alerts.filter((a) => a.status === 'flagged').length === 1 ? '' : 's'} awaiting triage
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject or entity..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
          className="px-3 py-2 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary w-fit"
        >
          {severityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 p-1 bg-secondary rounded-lg w-fit overflow-x-auto mb-6">
        {statusOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setStatusFilter(option.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
              statusFilter === option.value
                ? 'bg-card text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No alerts match your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlerts.map((alert, index) => (
            <FraudAlertCard
              key={alert.id}
              alert={alert}
              delay={index * 0.05}
              onInvestigate={() => updateStatus(alert.id, 'investigating')}
              onClear={() => updateStatus(alert.id, 'cleared')}
              onConfirm={() => updateStatus(alert.id, 'confirmed')}
            />
          ))}
        </div>
      )}
    </>
  );
}
