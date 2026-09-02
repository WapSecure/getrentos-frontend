'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@getrentos/ui';
import { ArrowRight, Shield, Lock, FileCheck, Eye, Sparkles } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

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

    const newParticles = Array.from({ length: 12 }).map(() => ({
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
            <Button href={ROUTES.SIGNUP} size="lg" className="group">
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
      <div className="absolute inset-0 overflow-hidden">
        {/* Soft radial halos for an airy, premium glow. */}
        <div className="absolute inset-0 bg-[radial-gradient(85%_60%_at_50%_-10%,rgba(0,113,227,0.14),transparent_62%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(45%_38%_at_85%_25%,rgba(0,113,227,0.09),transparent_62%)]" />
        <div className="absolute bottom-0 left-1/2 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        {/* Faint dot grid for subtle texture. */}
        <div className="hero-dots absolute inset-0 opacity-40" />
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
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-accent/80 px-4 py-1.5 shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-foreground">
              Trust-driven platform
            </span>
          </motion.div>

          <h1 className="mb-6 text-4xl font-bold tracking-[-0.03em] text-foreground sm:text-6xl lg:text-7xl">
            The trust-driven
            <span className="block bg-linear-to-r from-[#0071e3] via-[#0a84ff] to-[#5aa2ff] bg-clip-text text-transparent">
              property operating system.
            </span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            One workspace for renters, landlords, owners, buyers, realtors and agents. Verified
            identities, verified properties, escrow-secured payments — from first search to final
            signature.
          </p>
          <div className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href={ROUTES.SIGNUP} size="lg" className="group">
              Get early access
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button href="#features" variant="secondary" size="lg">
              Explore the platform
            </Button>
          </div>

          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2.5 border-t border-border/70 pt-8">
            {trustItems.map((item, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur"
              >
                <item.icon className="h-3.5 w-3.5 text-primary" />
                {item.text}
              </motion.span>
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
