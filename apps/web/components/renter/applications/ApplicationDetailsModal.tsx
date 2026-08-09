'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Bed,
  Bath,
  Square,
  Calendar,
  Home,
  User,
  Mail,
  Phone,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Download,
  Trash2,
  Building2,
  DollarSign,
  Shield,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Application } from '@/types/renter';
import { ApplicationTimeline } from './ApplicationTimeline';
import { ApplicationNotes } from './ApplicationNotes';
import { ApplicationWithdrawModal } from './ApplicationWithdrawModal';

interface ApplicationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application;
  onWithdraw?: (id: string) => void;
  onAddNote?: (applicationId: string, content: string) => void;
  onDeleteNote?: (applicationId: string, noteId: string) => void;
  onEditNote?: (applicationId: string, noteId: string, content: string) => void;
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pending',
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        };
      case 'under_review':
        return {
          label: 'Under Review',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        };
      case 'approved':
        return {
          label: 'Approved',
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        };
      case 'rejected':
        return {
          label: 'Rejected',
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const statusConfig = getStatusConfig(application.status);

  const getDocumentStatus = (uploaded: boolean) => {
    return uploaded
      ? { label: 'Uploaded', color: 'text-green-600' }
      : { label: 'Missing', color: 'text-red-500' };
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card rounded-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-accent">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{application.title}</h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                      >
                        {statusConfig.label}
                      </span>
                      <span className="text-xs text-gray-500">
                        Applied {formatDate(application.applicationDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {application.status !== 'approved' &&
                    application.status !== 'rejected' &&
                    onWithdraw && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowWithdrawModal(true)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border shrink-0">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'timeline'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Timeline
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'notes'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Notes ({notes.length})
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Property Info */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">Property Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                          <p className="text-xs text-gray-500">Address</p>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-foreground">{application.address}</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                          <p className="text-xs text-gray-500">Rent</p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            {formatPrice(application.price, application.period)}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                          <p className="text-xs text-gray-500">Property Details</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-foreground">
                              {application.bedrooms} beds
                            </span>
                            <span className="text-sm text-foreground">
                              {application.bathrooms} baths
                            </span>
                            <span className="text-sm text-foreground">{application.size} sqft</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                          <p className="text-xs text-gray-500">Lease Details</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-foreground">
                              Move-in: {formatDate(application.moveInDate)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Term: {application.leaseTerm}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Landlord Info */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3">
                        Landlord Information
                      </h4>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                            {application.landlord.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">
                                {application.landlord.name}
                              </p>
                              <Shield className="w-4 h-4 text-green-500" />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
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
                              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-foreground">{doc.name}</span>
                                {doc.required && (
                                  <span className="text-xs text-red-500">Required</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${docStatus.color}`}>
                                  {docStatus.label}
                                </span>
                                {doc.uploaded ? (
                                  <button className="text-xs text-primary hover:underline">
                                    View
                                  </button>
                                ) : (
                                  <button className="text-xs text-blue-500 hover:underline">
                                    Upload
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    {application.applicationNotes && (
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">
                          Application Notes
                        </h4>
                        <p className="text-sm text-muted-foreground p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                          {application.applicationNotes}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <Button variant="primary" className="flex-1 gap-2">
                        <MessageCircle className="w-4 h-4" />
                        Contact Landlord
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2">
                        <Download className="w-4 h-4" />
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
                    onAddNote={(content) => onAddNote && onAddNote(application.id, content)}
                    onDeleteNote={(noteId) => onDeleteNote && onDeleteNote(application.id, noteId)}
                    onEditNote={(noteId, content) =>
                      onEditNote && onEditNote(application.id, noteId, content)
                    }
                  />
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
