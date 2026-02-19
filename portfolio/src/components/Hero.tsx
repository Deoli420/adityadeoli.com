import React from 'react';
import { motion } from 'framer-motion';
import { Bug, Cpu, Shield, FileText, Mail, Terminal, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Hero: React.FC = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg')] bg-cover bg-center opacity-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-black/80 to-cyber-black" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 py-16 relative z-10"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center gap-4 mb-8"
          >
            <Bug className="w-8 h-8 text-cyber-violet animate-pulse" />
            <Cpu className="w-8 h-8 text-cyber-cyan animate-pulse" />
            <Shield className="w-8 h-8 text-cyber-purple animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 cyber-text animate-flicker"
          >
            I break things so your users don't.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              Aditya Deoli
            </h2>
            <p className="text-xl text-cyber-cyan">
              QA Engineer | Automation Jedi | Web3 Platform Specialist
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <a
              href="/resume.pdf"
              className="px-6 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Resume
            </a>
            <a
              href="#contact"
              className="px-6 py-3 bg-cyber-cyan text-cyber-black rounded-md hover:bg-cyber-cyan/80 transition-colors cyber-glow flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact Me
            </a>
            <a
              href="/projects/sentinelai"
              className="px-6 py-3 bg-gradient-to-r from-cyber-violet to-cyber-purple text-white rounded-md hover:from-cyber-purple hover:to-cyber-violet transition-all cyber-glow flex items-center gap-2"
            >
              <Activity className="w-5 h-5" />
              SentinelAI
            </a>
            <Link
              to="/casestudies"
              className="px-6 py-3 border-2 border-cyber-violet text-cyber-violet rounded-md hover:bg-cyber-violet hover:text-white transition-colors cyber-glow flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Case Studies
            </Link>
            <Link
              to="/logs"
              className="px-6 py-3 border-2 border-cyber-cyan text-cyber-cyan rounded-md hover:bg-cyber-cyan hover:text-cyber-black transition-colors cyber-glow flex items-center gap-2"
            >
              <Terminal className="w-5 h-5" />
              Access Logs
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};