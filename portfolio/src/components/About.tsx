import React from 'react';
import { motion } from 'framer-motion';
import { Bug, Shield, Cpu, Target } from 'lucide-react';
import { stats } from '../data';

export const About: React.FC = () => {
  return (
    <section id="about" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl font-bold mb-6 cyber-text animate-flicker">
            I Don't Just Test — I Protect User Trust
          </h2>
          
          <p className="text-lg text-gray-300 leading-relaxed">
            My QA journey began when I caught a critical bug that would have affected thousands of users' financial transactions. That moment revealed my superpower: an uncanny ability to think like both a user and a chaos engineer. Today, I channel that same intensity into every test I write, every system I monitor, and every product I protect. Because in the end, it's not just about finding bugs — it's about being the last line of defense for user trust.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 text-center cyber-border"
          >
            <Bug className="w-8 h-8 text-cyber-violet mx-auto mb-4 animate-pulse" />
            <h3 className="text-3xl font-bold text-cyber-violet mb-2 animate-flicker">
              {stats.bugsUncovered}+
            </h3>
            <p className="text-gray-400">Bugs Uncovered</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 text-center cyber-border"
          >
            <Shield className="w-8 h-8 text-cyber-cyan mx-auto mb-4 animate-pulse" />
            <h3 className="text-3xl font-bold text-cyber-cyan mb-2 animate-flicker">
              {stats.uptime}%
            </h3>
            <p className="text-gray-400">Uptime Monitored</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 text-center cyber-border"
          >
            <Cpu className="w-8 h-8 text-cyber-purple mx-auto mb-4 animate-pulse" />
            <h3 className="text-3xl font-bold text-cyber-purple mb-2 animate-flicker">
              {stats.automatedTests}+
            </h3>
            <p className="text-gray-400">Automated Test Cases</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 text-center cyber-border"
          >
            <Target className="w-8 h-8 text-cyber-pink mx-auto mb-4 animate-pulse" />
            <h3 className="text-3xl font-bold text-cyber-pink mb-2 animate-flicker">
              {stats.majorReleases}+
            </h3>
            <p className="text-gray-400">Major Releases Safeguarded</p>
          </motion.div>
        </div>

        <div className="text-center">
          <p className="text-gray-400 text-lg">
            Platforms tested: Web, Mobile, APIs, Web3
          </p>
        </div>
      </div>
    </section>
  );
};