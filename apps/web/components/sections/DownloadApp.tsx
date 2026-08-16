'use client';

import { motion } from 'framer-motion';
import { Smartphone, QrCode, Apple, Download } from 'lucide-react';
import { Button } from '@getrentos/ui';

export const DownloadApp = () => {
  return (
    <section id="download" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-secondary rounded-2xl p-8 md:p-12 border border-border"
        >
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-xs font-medium text-primary mb-4">
                MOBILE APP
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Get the full experience on your phone
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Download the GetRentos mobile app to manage properties, track transactions, and stay
                connected on the go. Available on iOS and Android.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="gap-3">
                  <Apple className="w-5 h-5" />
                  App Store
                </Button>
                <Button variant="secondary" className="gap-3">
                  <Download className="w-5 h-5" />
                  Google Play
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-center"
              >
                <div className="w-48 h-48 bg-white dark:bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-border shadow-sm">
                  <Smartphone className="w-16 h-16 text-primary mb-3" />
                  <QrCode className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">Scan to download</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
