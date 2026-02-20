import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, FileText, Mail, X, ChevronRight } from 'lucide-react';

const achievements = [
  'Founding QA \u2192 0 to 11M users',
  '$10M+ in rewards protected',
  '5,000+ automated tests',
  'ISTQB + Security certified',
  'Built AI monitoring platform',
];

export const RecruiterShortcut: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* ---- Desktop: fixed left-side pill + expandable panel ---- */}
      <div className="hidden md:block fixed left-0 top-1/2 -translate-y-1/2 z-50">
        <AnimatePresence mode="wait">
          {!isOpen ? (
            /* Collapsed pill */
            <motion.button
              key="pill"
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => setIsOpen(true)}
              aria-label="Open recruiter quick scan"
              className="group flex items-center gap-2 pl-4 pr-5 py-3 bg-cyber-black/90 border border-cyber-violet/40 border-l-0 rounded-r-full backdrop-blur-sm hover:border-cyber-violet/70 hover:bg-cyber-violet/10 transition-colors cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-cyber-cyan" />
              <span className="text-sm font-mono text-gray-300 group-hover:text-white transition-colors whitespace-nowrap">
                Quick Scan
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-cyber-violet/60 group-hover:text-cyber-violet transition-colors" />
            </motion.button>
          ) : (
            /* Expanded panel */
            <motion.div
              key="panel"
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="bg-cyber-black/95 border border-cyber-violet/30 border-l-0 rounded-r-xl backdrop-blur-md shadow-xl shadow-cyber-violet/5 p-5 w-72"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-sm font-mono font-semibold text-cyber-cyan">
                    Quick Scan
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close quick scan panel"
                  className="p-1 rounded hover:bg-cyber-violet/10 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-cyber-violet/30 to-transparent mb-4" />

              {/* Achievements */}
              <ul className="space-y-2.5 mb-5">
                {achievements.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 * i, duration: 0.3 }}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="text-cyber-violet mt-0.5 shrink-0">
                      &#9656;
                    </span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-cyber-violet/20 to-transparent mb-4" />

              {/* Action buttons */}
              <div className="flex gap-2">
                <a
                  href="/resume.pdf"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono rounded border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Resume
                </a>
                <a
                  href="mailto:adityadeoli@gmail.com"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono rounded bg-cyber-violet/20 border border-cyber-violet/40 text-cyber-violet hover:bg-cyber-violet/30 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Mobile: sticky bottom bar ---- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AnimatePresence>
          {!isOpen ? (
            /* Collapsed mobile bar */
            <motion.button
              key="mobile-pill"
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={() => setIsOpen(true)}
              aria-label="Open recruiter quick scan"
              className="w-full flex items-center justify-center gap-2 py-3 bg-cyber-black/95 border-t border-cyber-violet/30 backdrop-blur-md"
            >
              <ClipboardList className="w-4 h-4 text-cyber-cyan" />
              <span className="text-sm font-mono text-gray-300">
                Quick Scan
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-cyber-violet/60 rotate-[-90deg]" />
            </motion.button>
          ) : (
            /* Expanded mobile panel */
            <motion.div
              key="mobile-panel"
              initial={{ y: 400, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 400, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="bg-cyber-black/98 border-t border-cyber-violet/30 backdrop-blur-md p-5 pb-8 rounded-t-xl shadow-2xl shadow-cyber-violet/10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-cyber-cyan" />
                  <span className="text-sm font-mono font-semibold text-cyber-cyan">
                    Quick Scan
                  </span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close quick scan panel"
                  className="p-1.5 rounded hover:bg-cyber-violet/10 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-cyber-violet/30 via-cyber-violet/10 to-transparent mb-4" />

              {/* Achievements - compact 2-column on mobile */}
              <ul className="grid grid-cols-1 gap-2 mb-5">
                {achievements.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="text-cyber-violet mt-0.5 shrink-0">
                      &#9656;
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* Action buttons */}
              <div className="flex gap-3">
                <a
                  href="/resume.pdf"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-mono rounded border border-cyber-cyan/40 text-cyber-cyan hover:bg-cyber-cyan/10 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Resume
                </a>
                <a
                  href="mailto:adityadeoli@gmail.com"
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-mono rounded bg-cyber-violet/20 border border-cyber-violet/40 text-cyber-violet hover:bg-cyber-violet/30 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
