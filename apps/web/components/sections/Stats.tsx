'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Users, Building2, DollarSign, Shield, TrendingUp, Clock } from 'lucide-react';
import { ParticleBackground } from '@getrentos/ui';

const stats = [
  { icon: Users, value: 50000, label: 'Active Users', suffix: '+', prefix: '' },
  { icon: Building2, value: 10000, label: 'Properties', suffix: '+', prefix: '' },
  { icon: DollarSign, value: 500, label: 'Transaction Volume', suffix: 'M+', prefix: '$' },
  { icon: Shield, value: 99.9, label: 'Secure Transactions', suffix: '%', prefix: '' },
  { icon: TrendingUp, value: 150, label: 'Cities Covered', suffix: '+', prefix: '' },
  { icon: Clock, value: 24, label: 'Support', suffix: '/7', prefix: '' },
];

const CountUp = ({
  value,
  suffix = '',
  prefix = '',
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export const Stats = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <section
      ref={ref}
      className="py-20 px-4 bg-gray-50 dark:bg-background relative overflow-hidden"
    >
      <ParticleBackground count={40} color="#2c5583" className="z-0" />
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-xs font-medium text-primary mb-4">
            PLATFORM METRICS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Trusted by thousands
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join a growing community of satisfied users and successful transactions
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="relative group"
            >
              <div className="relative bg-card rounded-2xl p-6 text-center border border-border group-hover:border-primary/30 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-4xl font-bold text-foreground mb-2">
                  <CountUp value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </div>
                <p className="text-gray-600 dark:text-gray-400">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
