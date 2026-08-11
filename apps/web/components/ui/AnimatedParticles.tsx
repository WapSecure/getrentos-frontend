/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  duration: number;
  delay: number;
}

export const AnimatedParticles = ({ count = 30, color = 'rgba(44, 85, 131, 0.2)' }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const newParticles = Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      duration: Math.random() * 5 + 3,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, [count]);

  if (!mounted || particles.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: color,
            left: particle.x,
            top: particle.y,
          }}
          initial={{ opacity: 0 }}
          animate={{
            y: [particle.y, particle.y - 100, particle.y - 200],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};
