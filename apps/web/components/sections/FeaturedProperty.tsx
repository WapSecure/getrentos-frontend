'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { MapPin, Bed, Bath, Square, Building2, TrendingUp } from 'lucide-react';
import { Button } from '../ui/Button';

export const FeaturedProperty = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.6]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);

  const property = {
    id: 'RNT-0412',
    title: '2 Bed Loft',
    price: '4.2M',
    location: 'Lekki Phase 1, Lagos',
    period: '/year',
    verified: true,
    badges: ['ID', 'DEED', 'ESCROW'],
    status: 'Active',
    beds: 2,
    baths: 2,
    size: 1200,
  };

  const floatingAnimation = {
    y: [0, -15, 0],
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  const pulseAnimation = {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  };

  return (
    <section ref={ref} className="py-20 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          style={{ opacity, scale }}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-[#1a2a2f] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl"
        >
          <div className="grid lg:grid-cols-2">
            {/* Content Side */}
            <motion.div
              className="p-8 md:p-12 flex flex-col justify-center"
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <motion.div
                className="flex items-center gap-3 mb-4"
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  PROPERTY · {property.id}
                </span>
                <motion.span className="trust-badge-verified text-xs" animate={pulseAnimation}>
                  Verified
                </motion.span>
              </motion.div>

              <motion.h2
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {property.title}
              </motion.h2>

              <motion.p
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2"
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: 'spring' }}
              >
                ₦{property.price}
                <span className="text-lg text-gray-500 dark:text-gray-400 font-normal ml-2">
                  {property.period}
                </span>
              </motion.p>

              <motion.div
                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-6"
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{property.location}</span>
              </motion.div>

              <motion.div
                className="flex items-center gap-6 mb-6 text-sm text-gray-600 dark:text-gray-300"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                  <Bed className="w-4 h-4" />
                  <span>{property.beds} beds</span>
                </motion.div>
                <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                  <Bath className="w-4 h-4" />
                  <span>{property.baths} baths</span>
                </motion.div>
                <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
                  <Square className="w-4 h-4" />
                  <span>{property.size} sqft</span>
                </motion.div>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-3 mb-6"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                {property.badges.map((badge, idx) => (
                  <motion.span
                    key={badge}
                    className="trust-badge cursor-pointer"
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(196, 167, 71, 0.2)' }}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                  >
                    {badge}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                className="flex items-center justify-between"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <div className="flex items-center gap-2">
                  <motion.span
                    className="status-dot status-dot-active"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {property.status}
                  </span>
                </div>
                <motion.div whileHover={{ x: 5 }}>
                  <Button variant="outline" size="sm" href={`/properties/${property.id}`}>
                    View Details <TrendingUp className="w-3 h-3 ml-1" />
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Image Side */}
            <motion.div
              className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#2a4a5a]/50 dark:to-[#0f2a38] min-h-[300px] flex items-center justify-center relative overflow-hidden"
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <motion.div animate={floatingAnimation} className="text-center relative z-10">
                <Building2 className="w-24 h-24 text-gray-400 dark:text-white/20 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-500">Premium Property Visualization</p>
              </motion.div>

              {/* Animated gradient overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-tr from-[#c4a747]/0 via-[#c4a747]/5 to-transparent"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
