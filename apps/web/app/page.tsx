'use client';

import { Navigation } from '@/components/layout/Navigation';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/sections/Hero';
import { FeaturedProperty } from '@/components/sections/FeaturedProperty';
import { Features } from '@/components/sections/Features';
import { Roles } from '@/components/sections/Roles';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { Stats } from '@/components/sections/Stats';
import { Testimonials } from '@/components/sections/Testimonials';
import { TrustSecurity } from '@/components/sections/TrustSecurity';
import { Resources } from '@/components/sections/Resources';
import { CTA } from '@/components/sections/CTA';
import { DownloadApp } from '@/components/sections/DownloadApp';

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-[#0a1a1f] transition-colors duration-300">
      <Navigation />
      <Hero />
      <Stats />
      <FeaturedProperty />
      <Features />
      <Roles />
      <HowItWorks />
      <Testimonials />
      <TrustSecurity />
      <Resources />
      <CTA />
      <DownloadApp />
      <Footer />
    </main>
  );
}
