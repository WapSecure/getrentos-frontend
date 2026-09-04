'use client';

import { Folder, FolderOpen, FileText, Receipt, ClipboardCheck, Shield } from 'lucide-react';

interface DocumentCategoriesProps {
  categories: Record<string, number>;
  total: number;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

const categoryIcons: Record<string, React.ElementType> = {
  'Lease Agreements': FileText,
  Receipts: Receipt,
  'Inspection Reports': ClipboardCheck,
  Insurance: Shield,
  Miscellaneous: FileText,
};

const categoryColors: Record<string, string> = {
  'Lease Agreements': 'text-blue-600 dark:text-blue-400',
  Receipts: 'text-green-600 dark:text-green-400',
  'Inspection Reports': 'text-purple-600 dark:text-purple-400',
  Insurance: 'text-orange-600 dark:text-orange-400',
  Miscellaneous: 'text-muted-foreground',
};

export const DocumentCategories = ({
  categories,
  total,
  selectedCategory,
  onSelectCategory,
}: DocumentCategoriesProps) => {
  const categoryList = Object.keys(categories).sort();

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Categories</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{categoryList.length} categories</p>
      </div>

      <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
            selectedCategory === 'all'
              ? 'bg-accent text-primary'
              : 'hover:bg-secondary text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span>All Documents</span>
          </div>
          <span className="text-xs text-gray-500">{total}</span>
        </button>

        {categoryList.map((category) => {
          const Icon = categoryIcons[category] || FileText;
          const color = categoryColors[category] || 'text-gray-600';

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-accent text-primary'
                  : 'hover:bg-secondary text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{category}</span>
              </div>
              <span className="text-xs text-gray-500">{categories[category]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
