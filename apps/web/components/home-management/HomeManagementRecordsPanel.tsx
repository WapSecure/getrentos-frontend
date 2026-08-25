'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, CircleAlert, FileText, FolderOpen, Wrench } from 'lucide-react';
import { Badge } from '@getrentos/ui';
import { Button } from '@getrentos/ui';
import { EmptyState } from '@getrentos/ui';
import { unwrap } from '@/lib/apiHelpers';
import { formatDate } from '@/lib/format';
import { homeManagementKeys } from '@/lib/queryKeys';
import { landlordService } from '@/services/landlordService';
import { ownerService } from '@/services/ownerService';
import { ROUTES } from '@/lib/constants/auth';

type HomeRecordsRole = 'owner' | 'landlord';

type HomeRecord = {
  id: string;
  name: string;
  category: string;
  propertyName: string;
  uploadedAt: string;
  sizeLabel?: string;
};

interface HomeManagementRecordsPanelProps {
  role: HomeRecordsRole;
}

const MAX_VISIBLE_RECORDS = 4;

const recordCategoryLabel = (category: string) =>
  category
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const hasLinkedProperty = (propertyName: string) =>
  Boolean(propertyName) && propertyName !== '—' && propertyName !== 'Unassigned';

export function HomeManagementRecordsPanel({ role }: HomeManagementRecordsPanelProps) {
  const documentsPath = role === 'owner' ? ROUTES.OWNER_DOCUMENTS : ROUTES.LANDLORD_DOCUMENTS;
  const {
    data: records = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: homeManagementKeys.documents(role),
    queryFn: async (): Promise<HomeRecord[]> => {
      if (role === 'owner') {
        const documents = await unwrap(ownerService.listDocuments({ page: 1, pageSize: 100 }));
        return documents.items
          .filter((document) => hasLinkedProperty(document.propertyName))
          .map((document) => ({
            id: document.id,
            name: document.name,
            category: document.category,
            propertyName: document.propertyName,
            uploadedAt: document.uploadedAt,
            sizeLabel: document.sizeLabel,
          }));
      }

      const documents = (await unwrap(landlordService.listDocuments({ page: 1, pageSize: 100 })))
        .items;
      return documents
        .filter((document) => hasLinkedProperty(document.propertyName))
        .map((document) => ({
          id: document.id,
          name: document.name,
          category: document.category,
          propertyName: document.propertyName,
          uploadedAt: document.uploadedAt,
          sizeLabel: document.sizeLabel,
        }));
    },
  });

  const visibleRecords = records.slice(0, MAX_VISIBLE_RECORDS);

  return (
    <section aria-labelledby="home-records-heading" className="mt-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Home records</p>
          <h2
            id="home-records-heading"
            className="mt-1 text-2xl font-semibold tracking-[-0.02em] text-foreground"
          >
            Documents that keep operations accountable.
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Recent property-linked records, available from your secure document workspace.
          </p>
        </div>
        <Button
          href={documentsPath}
          size="sm"
          variant="outline"
          rounded="md"
          icon={<FolderOpen className="h-4 w-4" />}
          iconPosition="right"
        >
          All documents
        </Button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        {isLoading ? (
          <RecordsLoadingState />
        ) : error ? (
          <div className="p-4">
            <EmptyState
              icon={CircleAlert}
              title="Home records could not be loaded"
              description="Open Documents to try again."
              action={
                <Button href={documentsPath} size="sm" rounded="md">
                  Open documents
                </Button>
              }
              className="border-0 bg-transparent p-6 shadow-none"
            />
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={FileText}
              title="No property-linked records yet"
              description="Documents linked to your properties will appear here."
              action={
                <Button href={documentsPath} size="sm" rounded="md">
                  Open documents
                </Button>
              }
              className="border-0 bg-transparent p-6 shadow-none"
            />
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleRecords.map((record) => (
              <article key={record.id} className="flex items-center gap-3 px-5 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{record.name}</h3>
                    <Badge variant="neutral">{recordCategoryLabel(record.category)}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {record.propertyName}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-xs text-muted-foreground">
                    Added {formatDate(record.uploadedAt)}
                  </p>
                  {record.sizeLabel && (
                    <p className="mt-1 text-xs text-muted-foreground">{record.sizeLabel}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {role === 'landlord' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-1 text-muted-foreground">Continue operations:</span>
          <Button
            href={ROUTES.LANDLORD_MAINTENANCE}
            size="xs"
            variant="ghost"
            rounded="md"
            icon={<Wrench className="h-3.5 w-3.5" />}
          >
            Maintenance
          </Button>
          <Button
            href={ROUTES.LANDLORD_VENDORS}
            size="xs"
            variant="ghost"
            rounded="md"
            icon={<ArrowUpRight className="h-3.5 w-3.5" />}
            iconPosition="right"
          >
            Vendor directory
          </Button>
        </div>
      )}
    </section>
  );
}

function RecordsLoadingState() {
  return (
    <div>
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-[73px] animate-pulse border-b border-border last:border-b-0"
        />
      ))}
    </div>
  );
}
