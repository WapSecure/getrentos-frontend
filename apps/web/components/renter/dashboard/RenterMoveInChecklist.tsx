'use client';

import { LegacyInput } from '@getrentos/ui';

import { motion } from 'framer-motion';
import { CheckCircle, Circle, Camera, FileText } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Toast, ToastVariant } from '@getrentos/ui';
import { useEffect, useRef, useState } from 'react';
import { renterService, type MoveInChecklistItem } from '@/services/renterService';

export const RenterMoveInChecklist = () => {
  const [items, setItems] = useState<MoveInChecklistItem[]>([]);
  const [toast, setToast] = useState<{ message: string; variant: ToastVariant } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length || 1;

  useEffect(() => {
    const load = async () => {
      const res = await renterService.getMoveInChecklist();
      if (res.success && res.data) setItems(res.data);
    };
    load();
  }, []);

  if (items.length === 0) return null;

  const toggleItem = async (key: string) => {
    const res = await renterService.toggleMoveInChecklistItem(key);
    if (res.success && res.data) {
      const updated = res.data;
      setItems((prev) => prev.map((item) => (item.key === key ? updated : item)));
    }
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const existing = items.find((item) => item.key === 'document_condition');
      if (existing && !existing.completed) {
        await toggleItem('document_condition');
      }
      setToast({ message: 'Photo uploaded', variant: 'success' });
    }
    e.target.value = '';
  };

  const handleGenerateReport = () => {
    setToast({ message: 'Move-in report generated and sent to your landlord', variant: 'success' });
  };

  return (
    <>
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onClose={() => setToast(null)} />
      )}
      <LegacyInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handlePhotoSelected}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="bg-card rounded-xl border border-border overflow-hidden"
      >
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Move-In Checklist</h2>
              <p className="text-sm text-muted-foreground">Complete these steps before moving in</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-primary">
                {completedCount}/{totalCount}
              </span>
              <div className="w-20 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {items.map((item, index) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.05, duration: 0.3 }}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
              onClick={() => toggleItem(item.key)}
            >
              <button className="mt-0.5">
                {item.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-sm font-medium ${item.completed ? 'text-gray-500 line-through' : 'text-foreground'}`}
                  >
                    {item.title}
                  </p>
                  {item.required && <span className="text-xs text-red-500">Required</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
              {item.key === 'document_condition' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Camera className="w-3 h-3" />
                  Upload
                </Button>
              )}
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-border">
          <Button variant="primary" fullWidth className="gap-2" onClick={handleGenerateReport}>
            <FileText className="w-4 h-4" />
            Generate Move-In Report
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            This report will be shared with your landlord
          </p>
        </div>
      </motion.div>
    </>
  );
};
