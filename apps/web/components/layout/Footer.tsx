'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Heart, Twitter, Linkedin, Github, Mail, MapPin, Phone } from 'lucide-react';

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
      className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-background dark:to-muted border-t border-border"
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-l from-[#2e7d64]/5 to-transparent rounded-full blur-3xl" />
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

          {/* Quick Links */}
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { label: 'About Us', href: '#' },
                { label: 'Features', href: '#features' },
                { label: 'Home Management', href: '/home-management' },
                { label: 'Contact', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {['Help Center', 'Safety Center', 'Community Guidelines', 'Report Issue'].map(
                (item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary transition-colors duration-200"
                    >
                      {item}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div variants={itemVariants}>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Mail className="w-4 h-4 text-primary" />
                <span>support@getrentos.com</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                <Phone className="w-4 h-4 text-primary" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 text-primary mt-0.5" />
                <span>123 Property Street, Real Estate City, RE 12345</span>
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
              className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Cookie Policy
            </Link>
            <Link
              href="#"
              className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
            >
              GDPR Compliance
            </Link>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            Made with
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            </motion.span>
            by GetRentos
          </p>
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-6 pt-4 border-t border-border"
        >
          <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              SOC2 Certified
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              GDPR Compliant
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              256-bit Encryption
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              24/7 Support
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">
            © {currentYear} GetRentos. All rights reserved.
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};
