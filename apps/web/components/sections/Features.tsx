'use client';

import { Shield, Lock, FileCheck, Eye, Zap, BarChart3, Users2, Smartphone } from 'lucide-react';
import { SectionHeader } from '@getrentos/ui';
import { Card } from '@getrentos/ui';
import { ParticleBackground } from '@getrentos/ui';

const features = [
  {
    icon: Shield,
    title: 'Identity Verification',
    description: 'Every user verified with government ID and biometric checks.',
  },
  {
    icon: FileCheck,
    title: 'Property Verification',
    description: 'Title deeds, certificates, and ownership documentation.',
  },
  {
    icon: Lock,
    title: 'Escrow Protection',
    description: 'Bank-grade escrow securing every transaction.',
  },
  { icon: Eye, title: 'Fraud Monitoring', description: '24/7 AML and fraud detection systems.' },
  { icon: Zap, title: 'Instant Payouts', description: 'Fast settlements once conditions are met.' },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Real-time insights and performance metrics.',
  },
  {
    icon: Users2,
    title: 'Role-Based Access',
    description: 'Granular permissions for every user type.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Ready',
    description: 'Full functionality on web and mobile apps.',
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-20 px-4 relative overflow-hidden">
      <ParticleBackground count={30} color="#2c5583" className="z-0" />
      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          badge="PLATFORM FEATURES"
          title="Everything you need in one platform"
          description="Built on trust, powered by technology, designed for real estate professionals."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="p-6 text-center" delay={index * 0.05}>
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
