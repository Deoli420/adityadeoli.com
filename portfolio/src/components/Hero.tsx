import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Mail, Activity, BookOpen, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const RECRUITER_TAGS = [
  '11M+ Users',
  '$10M+ Protected',
  'Web3',
  'Fintech',
  'ISTQB Certified',
];

export const Hero: React.FC = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      {/* Subtle accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-violet/50 to-transparent" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="container mx-auto px-4 py-20 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Shield icon — single, clean, no pulse */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="p-3 rounded-full border border-cyber-violet/30 bg-cyber-violet/5">
              <Shield className="w-8 h-8 text-cyber-violet" />
            </div>
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg md:text-xl font-mono tracking-widest uppercase text-cyber-cyan/80 mb-4"
          >
            Aditya Deoli
          </motion.h2>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            <span className="cyber-text">
              I build the safety net
            </span>
            <br />
            <span className="text-white">
              between your product and your{' '}
            </span>
            <span className="text-cyber-cyan animate-flicker">
              11 million users.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xl md:text-2xl font-semibold text-white/90 mb-3 tracking-wide"
          >
            Systems QA Engineer&ensp;&mdash;&ensp;Founding QA at 11M-User Web3 Platform
          </motion.p>

          {/* One-line differentiator */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-base md:text-lg text-white/50 font-mono mb-10 max-w-2xl mx-auto"
          >
            Built QA from zero. Protected $10M+ in token rewards. Zero critical escapes across 6,500+ campaigns.
          </motion.p>

          {/* Primary CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            className="flex flex-wrap justify-center gap-3 mb-6"
          >
            <a
              href="/resume.pdf"
              className="px-7 py-3 bg-cyber-violet text-white font-semibold rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Resume
            </a>

            <a
              href="#contact"
              className="px-7 py-3 bg-cyber-cyan text-cyber-black font-semibold rounded-md hover:bg-cyber-cyan/80 transition-colors cyber-glow flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact
            </a>
          </motion.div>

          {/* Secondary links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="flex justify-center gap-6 mb-16"
          >
            <Link
              to="/projects/sentinelai"
              className="text-sm font-mono text-cyber-violet/70 hover:text-cyber-violet transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              SentinelAI Project
            </Link>
            <Link
              to="/casestudies"
              className="text-sm font-mono text-cyber-cyan/60 hover:text-cyber-cyan transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Case Studies
            </Link>
          </motion.div>

          {/* Recruiter Quick-Scan Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="max-w-xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-cyber-violet/30" />
              <span className="text-xs font-mono uppercase tracking-widest text-white/30 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3" />
                Quick Scan
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-cyber-violet/30" />
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {RECRUITER_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-mono rounded-full border border-cyber-violet/20 text-white/50 bg-cyber-violet/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};
