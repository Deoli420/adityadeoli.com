import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, TrendingUp, Shield, Lightbulb } from 'lucide-react';

interface HiringCard {
  icon: React.ElementType;
  title: string;
  body: string;
}

const cards: HiringCard[] = [
  {
    icon: GitBranch,
    title: 'Systems Thinking',
    body: "I don't test features \u2014 I test systems. When a $1M reward distribution failed silently, I traced it to a race condition between the payment queue and the fraud detection layer. I think in dependencies, failure modes, and blast radius.",
  },
  {
    icon: TrendingUp,
    title: 'Scale Experience',
    body: "11M+ users. 500K+ concurrent during peak campaigns. $10M+ in distributed rewards. I've tested at the scale where bugs don't just annoy users \u2014 they make headlines.",
  },
  {
    icon: Shield,
    title: 'Ownership',
    body: "As founding QA at Intract, I didn't wait for specs. I wrote the test strategy, built the frameworks, defined release criteria, and held the \u2018ship/no-ship\u2019 call on $1M+ campaigns. Zero critical escapes.",
  },
  {
    icon: Lightbulb,
    title: 'Product Mindset',
    body: "I file bugs that change roadmaps. I surfaced a UX flaw in our verification flow that cut mobile drop-off by 15% and unlocked a stalled campaign launch. QA isn't my function \u2014 it's my product lever.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: i * 0.15,
      ease: 'easeOut',
    },
  }),
};

export const WhyHireMe: React.FC = () => {
  return (
    <section id="why-hire-me" className="py-20 relative overflow-hidden">
      {/* Background treatment matching other sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/95 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-14 cyber-text"
        >
          Why Hire Me
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                className="group relative rounded-lg p-6 md:p-8
                  bg-cyber-black/60 backdrop-blur
                  border border-cyber-violet/40
                  transition-all duration-300
                  hover:border-cyber-violet/80
                  hover:shadow-[0_0_24px_-4px_rgba(142,68,236,0.25)]"
              >
                {/* Icon + title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-cyber-violet/10 border border-cyber-violet/30 group-hover:border-cyber-violet/60 transition-colors duration-300">
                    <Icon className="w-5 h-5 text-cyber-cyan" />
                  </div>
                  <h3 className="text-xl font-semibold text-cyber-cyan">
                    {card.title}
                  </h3>
                </div>

                {/* Body text */}
                <p className="text-[15px] leading-relaxed text-gray-300">
                  {card.body}
                </p>

                {/* Subtle bottom accent line on hover */}
                <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-cyber-violet/0 to-transparent group-hover:via-cyber-violet/50 transition-all duration-500" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
