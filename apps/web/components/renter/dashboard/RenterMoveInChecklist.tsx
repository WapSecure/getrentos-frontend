'use client';

import { LegacyInput } from '@getrentos/ui';

import { motion } from 'framer-motion';
import { Camera, FileText } from 'lucide-react';
import { Button } from '@getrentos/ui';
import { Checkbox } from '@getrentos/ui';
import { useToast } from '@getrentos/ui';
import { useEffect, useRef, useState } from 'react';
import { renterService, type MoveInChecklistItem } from '@/services/renterService';
import { printHtml, escapeHtml } from '@/lib/export';

export const RenterMoveInChecklist = () => {
  const [items, setItems] = useState<MoveInChecklistItem[]>([]);
  const toast = useToast();
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
    const flip = (prev: MoveInChecklistItem[]) =>
      prev.map((item) => (item.key === key ? { ...item, completed: !item.completed } : item));
    setItems(flip);
    const res = await renterService.toggleMoveInChecklistItem(key).catch(() => null);
    if (res?.success && res.data) {
      const updated = res.data;
      setItems((prev) => prev.map((item) => (item.key === key ? updated : item)));
    } else {
      setItems(flip);
      toast.error('That change did not save. Please try again.');
    }
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const existing = items.find((item) => item.key === 'document_condition');
      if (existing && !existing.completed) {
        await toggleItem('document_condition');
      }
      toast.success('Photo uploaded');
    }
    e.target.value = '';
  };

  const handleGenerateReport = () => {
    const date = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const rows = items
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.description)}</td><td>${
            item.completed ? 'Done' : 'Pending'
          }</td></tr>`
      )
      .join('');
    printHtml(
      'Move-In Report',
      `<h1>Move-In Report</h1>
       <p class="meta">Generated ${date} · ${completedCount}/${items.length} items completed</p>
       <h2>Checklist Status</h2>
       <table><thead><tr><th>Item</th><th>Description</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`
    );
  };

  return (
    <>
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
          <div className="flex justify-between items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Move-In Checklist</h2>
              <p className="text-sm text-muted-foreground">Complete these steps before moving in</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-primary">
                {completedCount}/{totalCount}
              </span>
              <div className="w-20 h-1 bg-secondary rounded-full mt-1 overflow-hidden">
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
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Checkbox
                className="min-w-0 flex-1"
                checked={item.completed}
                onCheckedChange={() => void toggleItem(item.key)}
                label={
                  <span className="flex flex-wrap items-center gap-2">
                    <span
                      className={
                        item.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                      }
                    >
                      {item.title}
                    </span>
                    {item.required && (
                      <span className="text-xs font-normal text-destructive">Required</span>
                    )}
                  </span>
                }
                description={item.description}
              />
              {item.key === 'document_condition' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1"
                  onClick={() => fileInputRef.current?.click()}
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
          <p className="text-xs text-muted-foreground text-center mt-2">
            This report will be shared with your landlord
          </p>
        </div>
      </motion.div>
    </>
  );
};
