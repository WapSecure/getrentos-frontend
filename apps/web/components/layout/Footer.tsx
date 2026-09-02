'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Twitter, Linkedin, Github, Mail, MapPin } from 'lucide-react';
import { ROUTES } from '@/lib/constants/auth';

export const Footer = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        duration: 0.5,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
      className="relative overflow-hidden border-t border-border bg-linear-to-br from-white to-secondary/50 dark:from-card dark:to-muted"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-linear-to-r from-primary/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-linear-to-l from-primary/5 to-transparent blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Logo and Description */}
          <motion.div variants={itemVariants} className="space-y-4">
            <Logo size="md" />
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              The trust-driven property operating system. One workspace for renters, landlords,
              owners, buyers, realtors and agents.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <motion.a
                whileHover={{ scale: 1.1, rotate: 5 }}
                href="#"
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-all"
              >
                <Twitter className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, rotate: 5 }}
                href="#"
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-all"
              >
                <Linkedin className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.1, rotate: 5 }}
                href="#"
                className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-primary hover:text-white transition-all"
              >
                <Github className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Product */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Product
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Shortlet stays', href: ROUTES.SHORTLET_MARKETPLACE },
                { label: 'Buy land', href: ROUTES.LAND_MARKETPLACE },
                { label: 'Home management', href: ROUTES.HOME_MANAGEMENT },
                { label: 'How it works', href: '#how-it-works' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Get started */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Get started
            </h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href={ROUTES.SIGNUP}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  Create an account
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.LOGIN}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  href={ROUTES.ROLE_SELECTION}
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-foreground"
                >
                  Browse roles
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={itemVariants}>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a
                  href="mailto:support@getrentos.com"
                  className="transition-colors duration-200 hover:text-foreground"
                >
                  support@getrentos.com
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span>Lagos, Nigeria</span>
              </li>
              <li>
                <a
                  href="mailto:support@getrentos.com?subject=Help%20request"
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  Get support
                </a>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Divider */}
        <motion.div variants={itemVariants} className="border-t border-border my-8" />

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Cookie Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              GDPR Compliance
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            © {currentYear} GetRentos. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};
