import React from 'react';
import { motion } from 'framer-motion';
import { Mail, FileText, Linkedin } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient background: violet to purple at low opacity */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyber-violet/[0.06] via-cyber-purple/[0.04] to-cyber-violet/[0.06]" />
      <div className="absolute inset-0 bg-cyber-black/80" />

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 cyber-grid opacity-5" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-violet/40 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Heading */}
          <h2 className="text-3xl md:text-5xl font-bold mb-4 cyber-text">
            Let&rsquo;s Build Reliable Systems
          </h2>

          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-400 mb-12 max-w-xl mx-auto">
            I bring the systems thinking, scale experience, and security mindset
            that turns QA from a bottleneck into a competitive advantage.
          </p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            {/* Primary: Email */}
            <a
              href="mailto:adityadeoli@gmail.com"
              className="group px-8 py-3.5 bg-cyber-violet text-white font-semibold rounded-md hover:bg-cyber-purple transition-all cyber-glow flex items-center gap-2.5 text-base shadow-lg shadow-cyber-violet/20 hover:shadow-cyber-violet/40"
            >
              <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
              adityadeoli@gmail.com
            </a>

            {/* Secondary: Resume */}
            <a
              href="/resume.pdf"
              className="px-7 py-3.5 bg-cyber-black/60 border border-cyber-cyan text-cyber-cyan font-semibold rounded-md hover:bg-cyber-cyan/10 transition-colors flex items-center gap-2.5 text-base"
            >
              <FileText className="w-5 h-5" />
              Resume
            </a>

            {/* Outline: LinkedIn */}
            <a
              href="https://linkedin.com/in/adityadeoli"
              target="_blank"
              rel="noopener noreferrer"
              className="px-7 py-3.5 border border-cyber-violet/50 text-cyber-violet font-semibold rounded-md hover:bg-cyber-violet/10 hover:border-cyber-violet transition-colors flex items-center gap-2.5 text-base"
            >
              <Linkedin className="w-5 h-5" />
              LinkedIn
            </a>
          </motion.div>

          {/* Subtle availability line */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-sm text-gray-500 font-mono"
          >
            Currently open to Senior QA / Staff QA / QA Lead roles in fintech,
            Web3, and AI products.
          </motion.p>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent" />
    </section>
  );
};
