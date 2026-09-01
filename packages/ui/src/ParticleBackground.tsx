'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

/** Upper bound so marketing pages never spawn hundreds of animated nodes. */
const MAX_PARTICLES = 30;

export const ParticleBackground = ({ count = 20, color = '#2c5583', className = '' }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const initialized = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const particleCount = Math.min(count, MAX_PARTICLES);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Use a ref to prevent multiple initializations
    if (dimensions.width > 0 && dimensions.height > 0 && !initialized.current) {
      initialized.current = true;

      // Use requestAnimationFrame to defer state update
      requestAnimationFrame(() => {
        const newParticles = Array.from({ length: particleCount }).map(() => ({
          x: Math.random() * dimensions.width,
          y: Math.random() * dimensions.height,
          size: Math.random() * 4 + 1,
          duration: Math.random() * 15 + 8,
          delay: Math.random() * 10,
          opacity: Math.random() * 0.3 + 0.1,
        }));
        setParticles(newParticles);
      });
    }
  }, [dimensions, count]);

  if (prefersReducedMotion || particles.length === 0) return null;

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: particle.x,
            top: particle.y,
            backgroundColor: color,
            opacity: particle.opacity,
          }}
          animate={{
            y: [particle.y, particle.y - 100, particle.y - 200],
            opacity: [particle.opacity, particle.opacity * 1.5, 0],
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
