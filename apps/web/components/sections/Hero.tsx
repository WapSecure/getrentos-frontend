'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { ArrowRight, Shield, Lock, FileCheck, Eye, Sparkles } from 'lucide-react';

export const Hero = () => {
  const [mounted, setMounted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [particles, setParticles] = useState<
    Array<{ x: number; y: number; duration: number; delay: number }>
  >([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    const width = window.innerWidth;
    const height = window.innerHeight;

    const newParticles = Array.from({ length: 20 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      duration: Math.random() * 5 + 3,
      delay: Math.random() * 5,
    }));

    setDimensions({ width, height });
    setParticles(newParticles);

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const trustItems = [
    { icon: Shield, text: 'BVN + NIN IDENTITY CHECK' },
    { icon: Lock, text: 'BANK-GRADE ESCROW' },
    { icon: FileCheck, text: 'TITLE DEED VERIFICATION' },
    { icon: Eye, text: 'AML & FRAUD MONITORING' },
  ];

  if (!mounted) {
    return (
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2e7d64]/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Trust-Driven Platform</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            The trust-driven
            <span className="block text-primary">property operating system.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            One workspace for renters, landlords, owners, buyers, realtors and agents. Verified
            identities, verified properties, escrow-secured payments — from first search to final
            signature.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button href="/signup" size="lg" className="group">
              Get early access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button href="#features" variant="secondary" size="lg">
              Watch demo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-border">
            {trustItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-gray-400 dark:border-gray-500 flex justify-center">
            <div className="w-1 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0 bg-background">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#2e7d64]/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      {particles.length > 0 && dimensions.width > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              initial={{
                x: particle.x,
                y: particle.y,
                opacity: 0,
              }}
              animate={{
                y: [null, -100, -200],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Trust-Driven Platform</span>
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground mb-6">
            The trust-driven
            <span className="block text-primary">property operating system.</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            One workspace for renters, landlords, owners, buyers, realtors and agents. Verified
            identities, verified properties, escrow-secured payments — from first search to final
            signature.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button href="/signup" size="lg" className="group">
              Get early access
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button href="#features" variant="secondary" size="lg">
              Watch demo
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 pt-8 border-t border-border">
            {trustItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-2"
              >
                <item.icon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-gray-400 dark:border-gray-500 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>
    </section>
  );
};
