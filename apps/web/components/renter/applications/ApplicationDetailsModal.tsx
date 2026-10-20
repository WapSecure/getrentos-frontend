'use client';

import { useState } from 'react';
import {
  X,
  MapPin,
  Calendar,
  Mail,
  Phone,
  FileText,
  Clock,
  MessageCircle,
  Download,
  Trash2,
  Shield,
} from 'lucide-react';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Tabs,
  TabsList,
  TabsTrigger,
  type BadgeVariant,
} from '@getrentos/ui';
import { Application } from '@/types/renter';
import { pluralize } from '@/lib/format';
import { ApplicationTimeline } from './ApplicationTimeline';
import { CreditCheckCard } from './CreditCheckCard';
import { ApplicationNotes } from './ApplicationNotes';
import { ApplicationWithdrawModal } from './ApplicationWithdrawModal';

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onWithdraw?: (id: string, reason: string) => Promise<void>;
  onAddNote?: (applicationId: string, content: string) => Promise<boolean>;
  onDeleteNote?: (applicationId: string, noteId: string) => void;
  onEditNote?: (applicationId: string, noteId: string, content: string) => Promise<boolean>;
  notes?: Note[];
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export const ApplicationDetailsModal = ({
  isOpen,
  onClose,
  application,
  onWithdraw,
  onAddNote,
  onDeleteNote,
  onEditNote,
  notes = [],
}: ApplicationDetailsModalProps) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'notes'>('details');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number, period: string) => {
    const formatter = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(price)}/${period === 'month' ? 'mo' : period === 'year' ? 'yr' : 'wk'}`;
  };

  const getStatusConfig = (status: string): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', variant: 'warning' };
      case 'under_review':
        return { label: 'Under Review', variant: 'info' };
      case 'approved':
        return { label: 'Approved', variant: 'success' };
      case 'rejected':
        return { label: 'Rejected', variant: 'danger' };
      default:
        return { label: 'Unknown', variant: 'neutral' };
    }
  };

  const statusConfig = getStatusConfig(application.status);

  const getDocumentStatus = (uploaded: boolean) => {
    return uploaded
      ? { label: 'Uploaded', color: 'text-success' }
      : { label: 'Missing', color: 'text-destructive' };
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(next) => !next && onClose()}>
        <DialogContent
          size="xl"
          padded={false}
          showClose={false}
          className="flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-accent">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="font-semibold text-foreground truncate">
                  {application.title}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Applied {formatDate(application.applicationDate)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {application.status !== 'approved' &&
                application.status !== 'rejected' &&
                onWithdraw && (
                  <IconButton
                    label="Withdraw application"
                    icon={<Trash2 />}
                    variant="danger"
                    size="sm"
                    onClick={() => setShowWithdrawModal(true)}
                  />
                )}
              <IconButton label="Close" icon={<X />} size="sm" onClick={onClose} />
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'details' | 'timeline' | 'notes')}
            className="shrink-0 border-b border-border px-4 py-2"
          >
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex-1">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                Notes ({notes.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Property Info */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Property Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Address</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{application.address}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Rent</p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        {formatPrice(application.price, application.period)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Property Details</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-foreground">
                          {pluralize(application.bedrooms, 'bed')}
                        </span>
                        <span className="text-sm text-foreground">
                          {pluralize(application.bathrooms, 'bath')}
                        </span>
                        <span className="text-sm text-foreground">{application.size} sqm</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Lease Details</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          Move-in: {formatDate(application.moveInDate)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Term: {application.leaseTerm}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Landlord Info */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Landlord Information</h4>
                  <div className="p-3 rounded-lg bg-secondary">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                        {application.landlord.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{application.landlord.name}</p>
                          <Shield className="w-4 h-4 text-success" />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{application.landlord.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{application.landlord.phone}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{application.landlord.responseRate}% response rate</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Documents</h4>
                  <div className="space-y-2">
                    {application.documents.map((doc, index) => {
                      const docStatus = getDocumentStatus(doc.uploaded);
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-secondary"
                        >
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{doc.name}</span>
                            {doc.required && (
                              <span className="text-xs text-destructive">Required</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${docStatus.color}`}>{docStatus.label}</span>
                            {doc.uploaded ? (
                              doc.url && (
                                <Button
                                  variant="link"
                                  href={doc.url}
                                  target="_blank"
                                  className="text-xs font-normal"
                                  aria-label={`View ${doc.name}`}
                                >
                                  View
                                </Button>
                              )
                            ) : (
                              // Uploads live in the document library, where they can be reused.
                              <Button
                                variant="link"
                                href="/renter/home?tab=documents"
                                className="text-xs font-normal"
                                aria-label={`Upload ${doc.name}`}
                              >
                                Upload
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {(application.status === 'pending' || application.status === 'under_review') && (
                  <CreditCheckCard applicationId={application.id} />
                )}

                {/* Notes */}
                {application.applicationNotes && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Application Notes</h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-secondary">
                      {application.applicationNotes}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    variant="primary"
                    className="flex-1"
                    icon={<MessageCircle className="w-4 h-4" />}
                  >
                    Contact Landlord
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download Application
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <ApplicationTimeline
                timeline={application.timeline}
                currentStatus={application.status}
              />
            )}

            {activeTab === 'notes' && (
              <ApplicationNotes
                applicationId={application.id}
                notes={notes}
                onAddNote={(content) =>
                  onAddNote ? onAddNote(application.id, content) : Promise.resolve(false)
                }
                onDeleteNote={(noteId) => onDeleteNote && onDeleteNote(application.id, noteId)}
                onEditNote={(noteId, content) =>
                  onEditNote ? onEditNote(application.id, noteId, content) : Promise.resolve(false)
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      {showWithdrawModal && onWithdraw && (
        <ApplicationWithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          application={application}
          onWithdraw={onWithdraw}
        />
      )}
    </>
  );
};
