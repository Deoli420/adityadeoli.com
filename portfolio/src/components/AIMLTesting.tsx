import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BrainCircuit, ShieldCheck, LifeBuoy, BarChart3, ArrowRight } from 'lucide-react';

const capabilities = [
  {
    icon: BrainCircuit,
    title: 'LLM Output Validation',
    color: 'cyber-violet',
    body: 'Built prompt engineering that produces calibrated severity scores (0\u2013100) and confidence intervals. Validated LLM output parsing with defensive try/except for malformed responses.',
  },
  {
    icon: ShieldCheck,
    title: 'Hallucination Prevention',
    color: 'cyber-cyan',
    body: 'Implemented \u201Cnever hallucinate anomalies\u201D guardrails in prompt templates. When the AI isn\u2019t sure, it says so \u2014 confidence scores below 0.4 trigger explicit uncertainty labels.',
  },
  {
    icon: LifeBuoy,
    title: 'Fallback & Reliability',
    color: 'cyber-pink',
    body: 'What happens when GPT is down? Built a deterministic rule-based fallback that produces analysis even without LLM access. Users never see \u201Cno analysis yet.\u201D',
  },
  {
    icon: BarChart3,
    title: 'Regression & Drift',
    color: 'cyber-violet',
    body: 'Schema drift detection catches when APIs change silently. Performance regression tracking identifies latency spikes before users notice. All automated, all monitored.',
  },
];

export const AIMLTesting: React.FC = () => {
  return (
    <section id="ai-ml-testing" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/80 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-4 cyber-text animate-flicker">
            AI & LLM Testing
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
            I built SentinelAI &mdash; a full-stack AI monitoring platform &mdash; to prove this isn&apos;t theoretical.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {capabilities.map((cap, index) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                whileHover={{ y: -4 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg bg-${cap.color}/10 border border-${cap.color}/20`}>
                    <Icon className={`w-5 h-5 text-${cap.color}`} />
                  </div>
                  <h3 className={`text-lg font-bold text-${cap.color}`}>
                    {cap.title}
                  </h3>
                </div>

                <p className="text-gray-400 text-sm leading-relaxed">
                  {cap.body}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA to SentinelAI project page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="max-w-5xl mx-auto mt-10 text-center"
        >
          <Link
            to="/projects/sentinelai"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow text-sm font-medium"
          >
            See how I built SentinelAI
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
