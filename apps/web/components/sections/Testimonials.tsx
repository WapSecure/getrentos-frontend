'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card } from '@getrentos/ui';

const testimonials = [
  {
    name: 'John Doe',
    role: 'Property Buyer',
    content: 'The escrow system gave me complete peace of mind. Best decision ever!',
    rating: 5,
    avatar: 'JD',
  },
  {
    name: 'Sarah Johnson',
    role: 'Landlord',
    content: 'Managing my 12 properties has never been easier. Rent collection is seamless.',
    rating: 5,
    avatar: 'SJ',
  },
  {
    name: 'Michael Adeyemi',
    role: 'Renter',
    content: 'Found my dream apartment in 3 days. The verification process is top-notch.',
    rating: 5,
    avatar: 'MA',
  },
];

export const Testimonials = () => {
  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-xs font-medium text-primary mb-4">
            TESTIMONIALS
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            What our users say
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Join thousands of satisfied users who trust GetRentos
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-4 italic">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                  <div className="flex gap-0.5 ml-auto">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
