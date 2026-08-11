'use client';

import { motion } from 'framer-motion';
import { SectionHeader } from '../ui/SectionHeader';
import {
  UserPlus,
  ShieldCheck,
  LayoutDashboard,
  ShoppingCart,
  FileSignature,
  Coins,
  CheckCircle,
  Star,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { ParticleBackground } from '../ui/ParticleBackground';

const steps = [
  {
    number: '01',
    title: 'Onboarding',
    icon: UserPlus,
    description: 'Sign up with email, phone, or OAuth.',
  },
  {
    number: '02',
    title: 'Verification',
    icon: ShieldCheck,
    description: 'Identity and property documentation checks.',
  },
  {
    number: '03',
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Personalized workspace for your role.',
  },
  {
    number: '04',
    title: 'Actions',
    icon: ShoppingCart,
    description: 'List, search, apply, or make offers.',
  },
  {
    number: '05',
    title: 'Transaction',
    icon: FileSignature,
    description: 'Digital signing of agreements.',
  },
  {
    number: '06',
    title: 'Escrow',
    icon: Coins,
    description: 'Funds held securely until conditions met.',
  },
  {
    number: '07',
    title: 'Completion',
    icon: CheckCircle,
    description: 'Move-in or ownership transfer.',
  },
  { number: '08', title: 'Review', icon: Star, description: 'Rate and build your reputation.' },
];

export const HowItWorks = () => {
  return (
    <section id="flow" className="py-20 px-4 relative overflow-hidden">
      <ParticleBackground count={25} color="#2c5583" className="z-0" />
      <div className="max-w-7xl mx-auto relative z-10">
        <SectionHeader
          badge="END-TO-END FLOW"
          title="From search to signature, one continuous loop."
          description="Every transaction passes through eight stages — trust built at every handoff."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <Card className="p-6" delay={index * 0.05}>
                <div className="text-4xl font-bold text-gray-200 dark:text-white/10 mb-3">
                  {step.number}
                </div>
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
