'use client';

import { motion } from 'framer-motion';
import { ArrowRight, FileText, Video, BookOpen } from 'lucide-react';
import { Card } from '../ui/Card';

const resources = [
  {
    type: 'Guide',
    icon: BookOpen,
    title: 'The Ultimate Guide to Property Investment',
    readTime: '10 min read',
  },
  {
    type: 'Video',
    icon: Video,
    title: 'How Escrow Protects Your Transactions',
    duration: '5 min watch',
  },
  {
    type: 'Case Study',
    icon: FileText,
    title: 'How We Helped 10,000+ Users Find Homes',
    readTime: '8 min read',
  },
];

export const Resources = () => {
  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-xs font-medium text-primary mb-4">
            RESOURCES
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Learn more about real estate
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Guides, tutorials, and insights to help you make informed decisions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 group cursor-pointer hover:border-primary/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                    <resource.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xs text-primary font-medium">{resource.type}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {resource.readTime || resource.duration}
                </p>
                <div className="flex items-center gap-1 text-sm text-primary group-hover:gap-2 transition-all">
                  Read more <ArrowRight className="w-3 h-3" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
