import React from 'react';
import { motion } from 'framer-motion';
import { Scale, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const sections = [
  {
    icon: Scale,
    title: 'Tradeoffs I\'ve Made',
    color: 'cyber-violet',
    items: [
      'Chose multi-step verification over single-click auth, accepting 30% mobile drop-off for security guarantees \u2014 because protecting $10M in airdrops was worth the UX cost',
      'Invested 2 weeks building reusable test frameworks instead of shipping manual tests fast \u2014 the framework now covers 6,500+ campaigns in minutes',
      'Prioritized platform stability over feature velocity during peak campaigns \u2014 500K concurrent users don\'t care about new features if the app is down',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Failure Scenarios I Test For',
    color: 'cyber-cyan',
    items: [
      'What happens when the LLM returns malformed JSON mid-analysis? \u2192 Built rule-based fallback with exponential backoff retry',
      'What if 500K users claim rewards simultaneously? \u2192 Load tested payment queues, identified race conditions before launch',
      'What if a sybil farm creates 10K wallets in 1 hour? \u2192 Stress-tested fraud detection at 10x expected load, achieved <1% false positives',
      'What if the API returns 200 OK but the data is wrong? \u2192 Built schema drift detection that catches silent failures',
    ],
  },
  {
    icon: Lightbulb,
    title: 'System-Level Insights',
    color: 'cyber-pink',
    items: [
      'A $1M airdrop nearly failed because everyone tested the code but nobody tested the assumption that wallet nonces were sequential. I test the assumptions first.',
      'Our reward queue passed all 200+ test cases, but silently double-paid under concurrent load. I build monitoring for what testing alone can\'t catch.',
      'Before writing a test plan, I map the blast radius: if this fails, who loses money? How many users? That map drives my priority order.',
    ],
  },
];

export const EngineeringThinking: React.FC = () => {
  return (
    <section id="engineering-thinking" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/80 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 cyber-text"
        >
          How I Think About Systems
        </motion.h2>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {sections.map((section, sectionIndex) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: sectionIndex * 0.15 }}
                className="bg-cyber-black/60 backdrop-blur rounded-lg p-6 cyber-border"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Icon className={`w-5 h-5 text-${section.color} flex-shrink-0`} />
                  <h3 className={`text-lg font-bold text-${section.color}`}>
                    {section.title}
                  </h3>
                </div>

                <motion.ul
                  variants={listContainerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  {section.items.map((item, itemIndex) => (
                    <motion.li
                      key={itemIndex}
                      variants={listItemVariants}
                      className="flex items-start gap-2"
                    >
                      <ChevronRight className={`w-4 h-4 mt-1 text-${section.color}/60 flex-shrink-0`} />
                      <span className="text-gray-400 text-sm leading-relaxed font-mono">
                        {item}
                      </span>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
