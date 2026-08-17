'use client';

import { FileText, Eye, ThumbsUp, ChevronRight } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  views: number;
  helpful: number;
  updatedAt: string;
}

const helpArticles: Article[] = [
  {
    id: '1',
    title: 'How to apply for a rental property',
    description: 'Step-by-step guide on submitting rental applications',
    category: 'getting-started',
    views: 1245,
    helpful: 89,
    updatedAt: '2024-06-10',
  },
  {
    id: '2',
    title: 'Understanding escrow payments',
    description: 'Learn how escrow protects your transactions',
    category: 'payments',
    views: 876,
    helpful: 92,
    updatedAt: '2024-06-08',
  },
  {
    id: '3',
    title: 'How to report maintenance issues',
    description: 'Report and track maintenance requests',
    category: 'maintenance',
    views: 654,
    helpful: 85,
    updatedAt: '2024-06-05',
  },
];

interface HelpArticlesProps {
  searchQuery: string;
  selectedCategory: string;
}

export const HelpArticles = ({ searchQuery, selectedCategory }: HelpArticlesProps) => {
  const filteredArticles = helpArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (filteredArticles.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-muted-foreground">No articles found</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Help Articles</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {filteredArticles.length} articles found
        </p>
      </div>

      <div className="divide-y divide-border">
        {filteredArticles.map((article) => (
          <div key={article.id} className="p-4 hover:bg-secondary transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">{article.title}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{article.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {article.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {article.helpful}% helpful
                  </span>
                  <span>Updated {new Date(article.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
