'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye } from 'lucide-react';
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  EmptyState,
  FilePreviewDialog,
  IconButton,
  SearchInput,
} from '@getrentos/ui';

interface Receipt {
  id: string;
  paymentId: string;
  propertyName: string;
  amount: number;
  date: string;
  fileName: string;
  url: string;
}

interface PaymentReceiptsGalleryProps {
  receipts: Receipt[];
  onDownload: (receiptId: string) => void;
}

export const PaymentReceiptsGallery = ({ receipts, onDownload }: PaymentReceiptsGalleryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredReceipts = receipts.filter(
    (receipt) =>
      receipt.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.fileName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowPreview(true);
  };

  return (
    <>
      <Card>
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-foreground">Receipts Gallery</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {receipts.length} receipts available
              </p>
            </div>

            <SearchInput
              value={searchTerm}
              onValueChange={setSearchTerm}
              placeholder="Search receipts..."
              label="Search receipts"
              className="w-full sm:w-56"
            />
          </div>
        </div>

        {filteredReceipts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
            {filteredReceipts.map((receipt, index) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="group relative rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
              >
                <button
                  type="button"
                  onClick={() => handleView(receipt)}
                  className="flex w-full items-start gap-3 rounded-lg p-3 pr-20 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="p-2 rounded-lg bg-secondary">
                    <FileText className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">
                      {receipt.fileName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {receipt.propertyName}
                    </span>
                    <span className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-primary">
                        {formatCurrency(receipt.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground" aria-hidden="true">
                        •
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(receipt.date)}
                      </span>
                    </span>
                  </span>
                </button>

                <div className="absolute top-2 right-2 flex gap-1 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                  <IconButton
                    size="sm"
                    label={`Download ${receipt.fileName}`}
                    icon={<Download aria-hidden="true" />}
                    onClick={() => onDownload(receipt.id)}
                  />
                  <IconButton
                    size="sm"
                    label={`View ${receipt.fileName}`}
                    icon={<Eye aria-hidden="true" />}
                    onClick={() => handleView(receipt)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredReceipts.length === 0 && (
          <EmptyState icon={FileText} title="No receipts found" size="compact" bare />
        )}
      </Card>

      {/* Receipt details remain visible alongside the reusable file viewer. */}
      <Dialog
        open={showPreview && Boolean(selectedReceipt) && !selectedReceipt?.url}
        onOpenChange={(open) => !open && setShowPreview(false)}
      >
        {selectedReceipt && (
          <DialogContent className="p-0 sm:p-0">
            <div className="p-4 pr-12 border-b border-border">
              <DialogTitle className="font-semibold text-foreground">Receipt Preview</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {selectedReceipt.fileName}
              </DialogDescription>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-secondary border border-border">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-primary mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm font-medium text-foreground">
                    {selectedReceipt.propertyName}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(selectedReceipt.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(selectedReceipt.date)}
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                fullWidth
                icon={<Download className="w-4 h-4" />}
                onClick={() => onDownload(selectedReceipt.id)}
              >
                Download Receipt
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      <FilePreviewDialog
        open={showPreview && Boolean(selectedReceipt?.url)}
        onOpenChange={(open) => !open && setShowPreview(false)}
        file={
          selectedReceipt?.url
            ? {
                url: selectedReceipt.url,
                name: selectedReceipt.fileName,
                mimeType: 'application/pdf',
              }
            : null
        }
      />
    </>
  );
};
