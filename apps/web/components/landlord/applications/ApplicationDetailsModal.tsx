'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  Briefcase,
  Banknote,
  FileCheck,
  FileX,
  ShieldCheck,
  Check,
  MessageSquareText,
  Users,
} from 'lucide-react';
import { Button } from '@getrentos/ui';
import { formatCurrency, formatDate, getInitials } from '@/lib/format';
import type { RentalApplication } from '@/types/landlord';

interface ApplicationDetailsModalProps {
  application: RentalApplication | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRequestInfo: (id: string) => void;
}

export const ApplicationDetailsModal = ({
  application,
  onClose,
  onApprove,
  onReject,
  onRequestInfo,
}: ApplicationDetailsModalProps) => {
  const isDecided = application?.status === 'approved' || application?.status === 'rejected';

  return (
    <AnimatePresence>
      {application && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="p-4 border-b border-border flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {getInitials(application.applicantName)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{application.applicantName}</h3>
                  <p className="text-xs text-muted-foreground">
                    Applied for {application.propertyName} • {application.unitName}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto flex-1">
              <div className="p-3 rounded-lg bg-accent border border-primary/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Platform Trust Score</span>
                </div>
                <span className="text-lg font-bold text-primary">{application.trustScore}</span>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Personal Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {application.applicantEmail}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {application.applicantPhone}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Financial Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Banknote className="w-4 h-4 text-gray-400" />
                    {formatCurrency(application.monthlyIncome)} / month
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    {application.employmentStatus}
                  </div>
                </div>
              </div>

              {(application.references.length > 0 || application.nextOfKinName) && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    References &amp; Next of Kin
                  </h4>
                  <div className="space-y-1.5">
                    {application.nextOfKinName && (
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-sm">
                        <p className="text-foreground font-medium">
                          {application.nextOfKinName}{' '}
                          <span className="text-xs text-muted-foreground font-normal">
                            ({application.nextOfKinRelationship || 'Next of kin'})
                          </span>
                        </p>
                        {application.nextOfKinPhone && (
                          <p className="text-xs text-muted-foreground">
                            {application.nextOfKinPhone}
                          </p>
                        )}
                      </div>
                    )}
                    {application.references.map((reference) => (
                      <div
                        key={reference.phone}
                        className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-sm"
                      >
                        <p className="text-foreground font-medium">
                          {reference.name}{' '}
                          <span className="text-xs text-muted-foreground font-normal">
                            ({reference.relationship})
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{reference.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Documents
                </h4>
                <div className="space-y-1.5">
                  {application.documents.map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-white/5"
                    >
                      <span className="text-sm text-foreground">{doc.name}</span>
                      {doc.uploaded ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <FileCheck className="w-3.5 h-3.5" /> Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <FileX className="w-3.5 h-3.5" /> Missing
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Submitted {formatDate(application.applicationDate, 'long')}
              </p>
            </div>

            {!isDecided && (
              <div className="p-4 border-t border-border flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="gap-1.5"
                  onClick={() => onRequestInfo(application.id)}
                >
                  <MessageSquareText className="w-3.5 h-3.5" />
                  Request Info
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => onReject(application.id)}
                >
                  Reject
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  className="gap-1.5"
                  onClick={() => onApprove(application.id)}
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
