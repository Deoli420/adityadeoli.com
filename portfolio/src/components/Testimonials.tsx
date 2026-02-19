import React from 'react';
import { motion } from 'framer-motion';
import { Quote, Radio } from 'lucide-react';
import { testimonials } from '../data';

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
        >
          Signal from the Network
        </motion.h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-cyber-black/50 backdrop-blur rounded-lg p-6 cyber-border relative"
            >
              {/* Signal indicator */}
              <div className="absolute top-4 right-4">
                <Radio className="w-5 h-5 text-cyber-violet animate-pulse" />
              </div>

              {/* Quote icon */}
              <Quote className="w-8 h-8 text-cyber-cyan mb-4 opacity-60" />
              
              {/* Quote text */}
              <blockquote className="text-gray-300 mb-6 leading-relaxed italic">
                "{testimonial.quote}"
              </blockquote>
              
              {/* Author info */}
              <div className="border-t border-cyber-violet/20 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-cyber-violet rounded-full animate-pulse" />
                  <div>
                    <div className="font-semibold text-cyber-cyan">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Glitch border effect */}
              <div className="absolute inset-0 rounded-lg border border-cyber-violet/30 pointer-events-none animate-pulse" />
            </motion.div>
          ))}
        </div>

        {/* Network visualization */}
        <div className="mt-16 text-center">
          <div className="flex justify-center items-center gap-2 text-cyber-violet">
            <div className="w-2 h-2 bg-cyber-violet rounded-full animate-pulse" />
            <div className="w-1 h-1 bg-cyber-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-cyber-violet rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            <span className="text-sm font-mono text-gray-400 mx-4">
              Network Status: TRUSTED
            </span>
            <div className="w-2 h-2 bg-cyber-violet rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
            <div className="w-1 h-1 bg-cyber-cyan rounded-full animate-pulse" style={{ animationDelay: '0.8s' }} />
            <div className="w-2 h-2 bg-cyber-violet rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>
      </div>
    </section>
  );
};