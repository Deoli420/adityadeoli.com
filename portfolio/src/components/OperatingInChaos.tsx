import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, ShieldCheck, Layers, TrendingUp } from 'lucide-react';

const cards = [
  {
    icon: Wrench,
    title: 'No Process? I\'ll Build One.',
    color: 'cyber-cyan',
    body: 'Joined Intract as employee #1 in QA. No test plans, no frameworks, no CI/CD. Built the entire QA infrastructure from scratch \u2014 from test strategy to automated pipelines to release criteria. Within 6 months, production bug escapes dropped by 95%.',
  },
  {
    icon: ShieldCheck,
    title: 'Ship/No-Ship Calls on $1M+ Launches',
    color: 'cyber-violet',
    body: 'Owned quality decisions for Linea DeFi Voyage, Trust Wallet, and 20+ ecosystem campaigns. When the CEO asks \u201Ccan we ship?\u201D \u2014 I\u2019m the one with the data to answer. And the courage to say no when the data says no.',
  },
  {
    icon: Layers,
    title: 'Full-Stack QA Ownership',
    color: 'cyber-pink',
    body: 'At a startup, QA means DevOps, security, performance, API testing, mobile testing, and sometimes product. I set up CI/CD, configured load testing infrastructure, wrote API automation, and built internal dashboards \u2014 all in the same sprint.',
  },
  {
    icon: TrendingUp,
    title: 'From Zero to 11M Users',
    color: 'cyber-cyan',
    body: 'I was there when Intract had 100 users. I was there when it hit 11 million. I\u2019ve seen the bugs that appear at 1K users, 100K users, and 1M users. Each scale brings failure modes no one predicted \u2014 and I tested for all of them.',
  },
];

export const OperatingInChaos: React.FC = () => {
  return (
    <section id="operating-in-chaos" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 cyber-text"
        >
          Built for Startup Speed
        </motion.h2>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                whileHover={{ y: -4 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-${card.color}/10 border border-${card.color}/20`}>
                    <Icon className={`w-5 h-5 text-${card.color}`} />
                  </div>
                  <h3 className={`text-lg font-bold text-${card.color}`}>
                    {card.title}
                  </h3>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {card.body}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
