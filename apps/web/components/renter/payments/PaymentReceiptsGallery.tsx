'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Search, Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  onView: (receiptId: string) => void;
}

export const PaymentReceiptsGallery = ({
  receipts,
  onDownload,
  onView,
}: PaymentReceiptsGalleryProps) => {
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
      <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Receipts Gallery</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {receipts.length} receipts available
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search receipts..."
                className="pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2a2f] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#c4a747] w-full sm:w-48"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
          {filteredReceipts.map((receipt, index) => (
            <motion.div
              key={receipt.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="group relative p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#c4a747] hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleView(receipt)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10">
                  <FileText className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {receipt.fileName}
                  </p>
                  <p className="text-xs text-gray-500">{receipt.propertyName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-[#c4a747]">
                      {formatCurrency(receipt.amount)}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{formatDate(receipt.date)}</span>
                  </div>
                </div>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(receipt.id);
                  }}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleView(receipt);
                  }}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredReceipts.length === 0 && (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No receipts found</p>
          </div>
        )}
      </div>

      {/* Receipt Preview Modal */}
      {showPreview && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-[#1a2a2f] rounded-xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Receipt Preview</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedReceipt.fileName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDownload(selectedReceipt.id)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-[#c4a747] mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedReceipt.propertyName}
                  </p>
                  <p className="text-2xl font-bold text-[#c4a747]">
                    {formatCurrency(selectedReceipt.amount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(selectedReceipt.date)}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => onDownload(selectedReceipt.id)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Receipt
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
