import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Monitor,
  Crosshair,
  Send,
  Lightbulb,
} from 'lucide-react';

interface SimulationItem {
  icon: React.ReactNode;
  title: string;
  demonstrates: string;
  triggerHint: string;
  insight: string;
}

const simulations: SimulationItem[] = [
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Production Incident Simulation',
    demonstrates:
      'Incident response UX, cascading failure visualization, and recovery protocol design. Click the red "PRODUCTION DOWN" button to experience a simulated P0 incident \u2014 complete with log streaming, error propagation, and system recovery.',
    triggerHint: 'Click the red button in the bottom-right corner',
    insight:
      "Real incidents don't show clean error messages. I built this to demonstrate how I think about failure cascading and user communication during outages.",
  },
  {
    icon: <Monitor className="w-5 h-5" />,
    title: 'DevTools Detection System',
    demonstrates:
      'Runtime environment detection, security monitoring, and anti-tamper awareness. Open your browser DevTools to trigger it.',
    triggerHint: 'Press F12 or Cmd+Opt+I',
    insight:
      "In Web3, users inspecting your frontend is a threat model. This simulates how I think about client-side security boundaries.",
  },
  {
    icon: <Crosshair className="w-5 h-5" />,
    title: 'Bug Spawning Physics',
    demonstrates:
      'Physics-based particle systems, performance budgeting (50 max entities), and graceful degradation. Click anywhere on the page.',
    triggerHint: 'Click any empty space on the page',
    insight:
      'Every interactive system needs performance limits. This demonstrates entity pooling, frame-rate aware animation, and automatic cleanup \u2014 the same patterns I use when load testing distributed systems.',
  },
  {
    icon: <Send className="w-5 h-5" />,
    title: 'Transmission Integrity Analyzer',
    demonstrates:
      'Real-time input validation, quality scoring algorithms, and user feedback systems. Try the contact form to see it in action.',
    triggerHint: 'Scroll to the contact form and start typing',
    insight:
      'I built this as a demo of quality-gate thinking. Just like I gate releases on test quality, this form gates submissions on message quality \u2014 with real-time scoring and clear thresholds.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export const SystemSimulations: React.FC = () => {
  return (
    <section id="simulations" className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/95 to-cyber-black" />
      <div className="absolute inset-0 cyber-grid opacity-10" />

      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-violet/40 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 cyber-text">
            Interactive System Simulations
          </h2>
          <p className="text-base md:text-lg text-gray-400 font-mono max-w-2xl mx-auto">
            These aren&rsquo;t Easter eggs &mdash; they&rsquo;re demonstrations of how I
            think about failure modes.
          </p>
        </motion.div>

        {/* Simulation cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="max-w-4xl mx-auto grid gap-6 md:gap-8"
        >
          {simulations.map((sim) => (
            <motion.div
              key={sim.title}
              variants={itemVariants}
              className="group bg-cyber-black/60 backdrop-blur rounded-lg border border-cyber-violet/20 hover:border-cyber-violet/50 transition-colors p-6 md:p-8"
            >
              {/* Header row: icon + title */}
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 rounded-md border border-cyber-violet/30 bg-cyber-violet/5 text-cyber-cyan shrink-0 mt-0.5">
                  {sim.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-cyber-cyan mb-1">
                    {sim.title}
                  </h3>
                  <span className="inline-block text-xs font-mono text-cyber-violet/80 bg-cyber-violet/10 border border-cyber-violet/20 rounded px-2 py-0.5">
                    {sim.triggerHint}
                  </span>
                </div>
              </div>

              {/* What it demonstrates */}
              <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-4 pl-0 md:pl-14">
                <span className="text-white/60 font-semibold text-xs uppercase tracking-wider block mb-1">
                  What it demonstrates
                </span>
                {sim.demonstrates}
              </p>

              {/* Engineering insight */}
              <div className="pl-0 md:pl-14 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-cyber-violet/60 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-500 italic leading-relaxed">
                  {sim.insight}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent" />
    </section>
  );
};
