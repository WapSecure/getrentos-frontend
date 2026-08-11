'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Fingerprint, FileCheck, Eye, Building2 } from 'lucide-react';

const trustFeatures = [
  {
    icon: Shield,
    title: 'Bank-Grade Security',
    description: '256-bit encryption and secure data centers',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Funds held securely until conditions are met',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Verification',
    description: 'Identity verification with liveness detection',
  },
  {
    icon: FileCheck,
    title: 'Document Verification',
    description: 'AI-powered document authentication',
  },
  { icon: Eye, title: '24/7 Monitoring', description: 'Real-time fraud detection and prevention' },
  {
    icon: Building2,
    title: 'Regulated Partner',
    description: 'Licensed and compliant with regulations',
  },
];

export const TrustSecurity = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-xs font-medium text-primary mb-4">
            TRUST & SECURITY
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Your security is our priority
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Enterprise-grade security features to protect your transactions and data
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
              <div className="relative p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
