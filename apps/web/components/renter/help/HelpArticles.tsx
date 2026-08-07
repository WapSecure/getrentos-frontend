'use client';

import { useState } from 'react';
import { FileText, Eye, ThumbsUp, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  views: number;
  helpful: number;
  updatedAt: string;
}

const mockArticles: Article[] = [
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
  const filteredArticles = mockArticles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (filteredArticles.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 p-8 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">No articles found</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1a2a2f] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-white/10">
        <h3 className="font-semibold text-gray-900 dark:text-white">Help Articles</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {filteredArticles.length} articles found
        </p>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-white/10">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {article.title}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {article.description}
                </p>
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
