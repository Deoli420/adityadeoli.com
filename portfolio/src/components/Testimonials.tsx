import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

/**
 * Best 6 testimonials selected for hiring conversion:
 * - CEO, CTO, CMO from Intract (decision-makers at 11M user platform)
 * - Ex-VP Goldman Sachs (enterprise credibility)
 * - Director at IVP (finance domain)
 * - Tech Lead at Intract (peer validation)
 */
const testimonials = [
  {
    quote:
      "Aditya isn't just our founding QA — he's our quality compass. From airdrop logic to API security, he's the one who keeps us honest. He breaks things like a hacker but fixes them like a builder.",
    author: 'Abhishek Anita',
    role: 'CTO, Intract',
    highlight: 'breaks things like a hacker, fixes them like a builder',
  },
  {
    quote:
      "If you want bulletproof Web3 products, Aditya is your guy. He's guarded our biggest drops, built trust with our partners, and proved that QA can be a growth engine.",
    author: 'Sambhav Jain',
    role: 'CEO, Intract',
    highlight: 'QA can be a growth engine',
  },
  {
    quote:
      "Aditya has product intuition most QA folks only dream of. He not only finds bugs — he surfaces design flaws, logic gaps, and misuse vectors no spec can catch. Pure signal.",
    author: 'Kushagra',
    role: 'Head of Product, Intract / Ex-VP, Goldman Sachs',
    highlight: 'product intuition most QA folks only dream of',
  },
  {
    quote:
      "Behind every successful user campaign at Intract, there's Aditya stress-testing the system weeks in advance. He understands product, users, and timing — a rare combo in QA.",
    author: 'Apurv Kaushal',
    role: 'CMO, Intract',
    highlight: 'understands product, users, and timing',
  },
  {
    quote:
      "Working with Aditya at IVP, I was constantly impressed by how quickly he mastered enterprise-scale QA. His automation saved hours of regression time — and his security test coverage was on par with senior architects.",
    author: 'Neeraj Singh',
    role: 'Director, Indus Valley Partners',
    highlight: 'security test coverage on par with senior architects',
  },
  {
    quote:
      "Aditya is the first person I ping before releasing anything. Doesn't matter if it's frontend, contract logic, or API — he's already tested it, broken it, and written a plan to prevent future failure.",
    author: 'Kartik Ahuja',
    role: 'Tech Lead, Intract',
    highlight: 'first person I ping before releasing anything',
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-14 cyber-text"
        >
          What CTOs & Leaders Say
        </motion.h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, index) => (
            <motion.div
              key={t.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="bg-cyber-black/50 backdrop-blur rounded-lg p-6 cyber-border relative group hover:border-cyber-violet/60 transition-colors duration-300"
            >
              <Quote className="w-6 h-6 text-cyber-violet/40 mb-3" />

              {/* Pull-quote highlight for scanners */}
              <p className="text-cyber-cyan/80 text-xs font-mono uppercase tracking-wide mb-3">
                &ldquo;{t.highlight}&rdquo;
              </p>

              <blockquote className="text-gray-300 text-sm leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="border-t border-cyber-violet/15 pt-4 mt-auto">
                <div className="font-semibold text-cyber-cyan text-sm">
                  {t.author}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {t.role}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
