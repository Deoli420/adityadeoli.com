import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, ShieldAlert, Terminal } from 'lucide-react';

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

const exploitThinking = [
  'Simulated sybil attacks: 10K fake wallets in 1 hour \u2192 validated <1% false positive detection',
  'Tested credential replay attacks on Proof of Humanity verification flows',
  'Validated cross-chain wallet mapping integrity under adversarial conditions',
  'Performed SQL injection, XSS, and buffer overflow testing on financial platforms',
];

const protectAgainst = [
  'Airdrop farming: Tested fraud detection protecting $10M+ in token distributions',
  'Wallet spoofing: Validated WalletConnect + on-chain verification at 2.4M user scale',
  'Privacy leaks: Tested zk-KYC flows ensuring zero raw identity exposure',
  'Race conditions: Found and prevented a reward double-claim bug before $1M launch',
];

const tools = [
  'Burp Suite',
  'OWASP ZAP',
  'wagmi',
  'WalletConnect',
  'Ether.js',
  'zk-KYC',
  'Hardhat',
];

export const Web3Security: React.FC = () => {
  return (
    <section id="web3-security" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/80 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-16 cyber-text"
        >
          Web3 & Security Testing
        </motion.h2>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Left column: Exploit Thinking */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
          >
            <div className="flex items-center gap-3 mb-6">
              <Crosshair className="w-5 h-5 text-cyber-pink" />
              <h3 className="text-lg font-bold text-cyber-pink">Exploit Thinking</h3>
            </div>

            <motion.ul
              variants={listContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {exploitThinking.map((item, index) => (
                <motion.li
                  key={index}
                  variants={listItemVariants}
                  className="flex items-start gap-3"
                >
                  <Terminal className="w-4 h-4 mt-1 text-cyber-pink/60 flex-shrink-0" />
                  <span className="text-gray-400 text-sm leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right column: What I Protect Against */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
          >
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="w-5 h-5 text-cyber-cyan" />
              <h3 className="text-lg font-bold text-cyber-cyan">What I Protect Against</h3>
            </div>

            <motion.ul
              variants={listContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-4"
            >
              {protectAgainst.map((item, index) => (
                <motion.li
                  key={index}
                  variants={listItemVariants}
                  className="flex items-start gap-3"
                >
                  <Terminal className="w-4 h-4 mt-1 text-cyber-cyan/60 flex-shrink-0" />
                  <span className="text-gray-400 text-sm leading-relaxed">{item}</span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </div>

        {/* Tools / Badge Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-5xl mx-auto mt-8 flex flex-wrap justify-center gap-3"
        >
          {tools.map((tool) => (
            <span
              key={tool}
              className="px-4 py-1.5 bg-cyber-black/40 text-cyber-cyan border border-cyber-violet/30 rounded-md text-sm font-mono"
            >
              {tool}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
