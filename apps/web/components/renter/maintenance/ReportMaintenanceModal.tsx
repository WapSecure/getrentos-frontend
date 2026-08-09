'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Camera, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ReportData {
  title: string;
  category: string;
  priority: string;
  description: string;
}

interface ReportMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReportData) => void;
}

const categories = [
  { value: 'plumbing', label: 'Plumbing', icon: '💧' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'internet', label: 'Internet', icon: '🌐' },
  { value: 'security', label: 'Security', icon: '🔒' },
  { value: 'appliances', label: 'Appliances', icon: '🔧' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const priorities = [
  { value: 'low', label: 'Low', description: 'Non-urgent, cosmetic issues' },
  { value: 'medium', label: 'Medium', description: 'Affects daily comfort but not critical' },
  { value: 'high', label: 'High', description: 'Significant inconvenience' },
  { value: 'urgent', label: 'Urgent', description: 'Emergency, requires immediate attention' },
];

export const ReportMaintenanceModal = ({
  isOpen,
  onClose,
  onSubmit,
}: ReportMaintenanceModalProps) => {
  const [formData, setFormData] = useState<ReportData>({
    title: '',
    category: '',
    priority: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ReportData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.description) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit(formData);
      setIsSubmitting(false);
      onClose();
      setFormData({ title: '', category: '', priority: '', description: '' });
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-card z-10">
              <div>
                <h3 className="font-semibold text-foreground">Report Maintenance Issue</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Provide details about the issue you&apos;re experiencing
                </p>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Issue Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="Brief description of the issue"
                  className={`w-full px-3 py-2 rounded-lg border ${errors.title ? 'border-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
              </div>

              {/* Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.category ? 'border-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-500 mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${errors.priority ? 'border-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                  >
                    <option value="">Select priority</option>
                    {priorities.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label} - {p.description}
                      </option>
                    ))}
                  </select>
                  {errors.priority && (
                    <p className="text-xs text-red-500 mt-1">{errors.priority}</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Detailed description of the issue..."
                  rows={4}
                  className={`w-full px-3 py-2 rounded-lg border ${errors.description ? 'border-red-500' : 'border-border'} bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                {errors.description && (
                  <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Photos (Optional)
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click or drag to upload photos</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                </div>
              </div>

              {/* Urgent Note */}
              {formData.priority === 'urgent' && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700 dark:text-red-300">
                      <span className="font-medium">Urgent Request:</span> A vendor will be assigned
                      within 2 hours. For life-threatening emergencies, please call your landlord
                      immediately.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                >
                  <FileText className="w-4 h-4" />
                  Submit Request
                </Button>
                <Button variant="ghost" fullWidth onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
