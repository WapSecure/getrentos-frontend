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
    <nav
      aria-label="Document categories"
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="border-b border-border/70 p-4">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Categories</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{categoryList.length} categories</p>
      </div>

      <div className="max-h-96 space-y-1 overflow-y-auto p-2">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          aria-current={selectedCategory === 'all' ? 'true' : undefined}
          className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
            selectedCategory === 'all'
              ? 'bg-primary/10 text-primary ring-1 ring-primary/10'
              : 'hover:bg-secondary text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span>All Documents</span>
          </div>
          <span className="text-xs text-muted-foreground">{total}</span>
        </button>

        {categoryList.map((category) => {
          const Icon = categoryIcons[category] || FileText;
          const color = categoryColors[category] || 'text-gray-600';

          return (
            <button
              key={category}
              type="button"
              onClick={() => onSelectCategory(category)}
              aria-current={selectedCategory === category ? 'true' : undefined}
              className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15 ${
                selectedCategory === category
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/10'
                  : 'hover:bg-secondary text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span>{category}</span>
              </div>
              <span className="text-xs text-muted-foreground">{categories[category]}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
