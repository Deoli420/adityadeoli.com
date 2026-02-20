import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, AlertTriangle, Target, TrendingUp, Shield, Zap } from 'lucide-react';

interface ImpactProject {
  title: string;
  org: string;
  period: string;
  problem: string;
  scale: string;
  actions: string[];
  impact: string[];
  risk: string;
  tools: string[];
}

const projects: ImpactProject[] = [
  {
    title: 'Founding QA — Quest & Reward Engine',
    org: 'Intract',
    period: '2022–2024',
    problem:
      'A Web3 quest platform distributing $10M+ in token rewards had no QA. Campaigns launched untested. One double-claim bug could drain entire reward pools.',
    scale: '11M+ users · 6,500+ campaigns · $10M+ distributed · 500K peak concurrent',
    actions: [
      'Built the entire QA function from zero: test strategy, frameworks, release criteria, ship/no-ship calls',
      'Stress-tested $1M+ reward distributions under peak load — wallet connections, on-chain tasks, NFT mints',
      'Validated fraud detection protecting $10M+ in airdrops with <1% false positive rate',
      'QA\'d 6,535 campaigns across Linea, zkSync, Mode, TON ecosystems',
      'Achieved 98%+ CSAT from ecosystem partners through rigorous pre-launch testing',
    ],
    impact: [
      'Zero critical bugs in production across 2+ years',
      '$10M+ in rewards distributed without a single exploit',
      '< 1 day to 1 week time-to-launch for new campaigns',
      '150K+ DAU stability maintained across complex multi-quest flows',
    ],
    risk: 'Without testing, a single re-entrancy or double-claim bug on a $1M airdrop would drain the pool, destroy partner trust, and make headlines in CT.',
    tools: ['Selenium', 'Postman', 'JMeter', 'Redis', 'wagmi', 'Ether.js', 'Burp Suite', 'TestRail'],
  },
  {
    title: 'Anti-Sybil Identity Infrastructure',
    org: 'Authena (FairDAO)',
    period: 'Dec 2024–Feb 2025',
    problem:
      'Airdrops worth millions were being farmed by sybil networks. Traditional KYC was too slow and leaked PII. Needed privacy-preserving verification at scale.',
    scale: '2.4M+ users verified · 6.5M+ credentials issued · 20+ project integrations · $1M+ revenue',
    actions: [
      'Stress-tested multi-credential verification under <5min SLA for 6.5M+ credentials',
      'Validated privacy-preserving zk-KYC flows — zero raw identity exposure',
      'Simulated 10K fake wallet sybil attacks, validated <1% false positive detection',
      'Load tested custom trust threshold logic across 20+ project integrations',
      'Tested credential replay attacks on Proof of Humanity verification flows',
    ],
    impact: [
      'Production-grade identity infra generating $1M+ revenue',
      'Large-scale airdrops distributed safely without KYC friction',
      'Real-time verification maintained during high-stakes launches',
      'Millions in airdrop value protected from sybil farming',
    ],
    risk: 'A false-negative in sybil detection means one attacker farms 10K wallets. A false-positive means a real user gets blocked from a $50K airdrop. Both are catastrophic.',
    tools: ['Appium', 'Postman', 'TestComplete', 'GitHub API', 'WalletConnect', 'zk-KYC', 'Biometric APIs'],
  },
  {
    title: 'Enterprise Financial Systems QA',
    org: 'Indus Valley Partners',
    period: 'Jul 2021–Dec 2023',
    problem:
      'Hedge funds and asset managers ran mission-critical systems (Polaris, Cash Master, EDM) with manual testing. One calculation error in an ETL pipeline could misreport millions.',
    scale: '25 of top 50 hedge funds · 1000+ business rules · Multi-screen financial workflows',
    actions: [
      'Reduced testing effort ~80% by building automation frameworks (Selenium, Appium, Playwright)',
      'Automated 900+ mobile test cases in one month — iOS and Android',
      'Built JMeter performance suites for rule engines with 1000+ business rules',
      'Conducted security testing: SQL injection, XSS, buffer overflow on financial platforms',
      'Designed a React + .NET Core analytics dashboard for real-time ETL monitoring',
    ],
    impact: [
      'Zero critical production defects in financial calculation workflows',
      '80% reduction in regression testing effort',
      '900+ mobile test cases automated in 30 days',
      'API test coverage for ETL platforms used by top hedge funds',
    ],
    risk: 'A rounding error in an ETL pipeline silently misreports $10M in AUM to a hedge fund. They make allocation decisions on bad data. By the time it\'s caught, the damage is regulatory.',
    tools: ['Selenium', 'Java', 'Appium', 'Playwright', 'Cypress', 'JMeter', 'Automation Anywhere', 'Azure DevOps'],
  },
  {
    title: 'Social Intelligence Pipeline',
    org: 'Bantr',
    period: 'Feb 2025–Present',
    problem:
      'Web3 campaigns measured "growth" by impressions. No one knew which Twitter followers actually held tokens. Needed Twitter-to-EVM attribution that could scale.',
    scale: '60K+ users · 2.6M+ accounts indexed · 1.5M daily indexing · $160K+ revenue',
    actions: [
      'QA\'d 1.5M+ daily social account indexing pipelines for real-time discovery',
      'Stress-tested Twitter-to-EVM wallet mapping across 20K+ campaign participants',
      'Validated mindshare ranking algorithms surfacing ~2.5K relevant voices per campaign',
      'Load tested social-to-on-chain attribution systems under 10K+ DAU traffic',
    ],
    impact: [
      'Campaigns for Ethena, ApeCoin, Morph, Bitget Wallet launched with confidence',
      'Growth measurement shifted from impressions to verifiable on-chain impact',
      '60K+ users served with platform stability',
      '$160K+ revenue enabled through rigorous QA',
    ],
    risk: 'A misattribution in wallet mapping means campaign rewards go to bots instead of real users. Partners lose trust, and the entire attribution model collapses.',
    tools: ['React', 'Jest', 'Twitter API', 'LambdaTest', 'Postman', 'EVM APIs'],
  },
];

export const Projects: React.FC = () => {
  const [expandedRisk, setExpandedRisk] = useState<number | null>(null);

  return (
    <section id="projects" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-14 cyber-text"
        >
          What I've Built & Protected
        </motion.h2>

        <div className="max-w-5xl mx-auto space-y-10">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              className="bg-cyber-black/50 backdrop-blur rounded-xl overflow-hidden cyber-border"
            >
              <div className="p-6 md:p-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                  <h3 className="text-xl md:text-2xl font-bold text-cyber-cyan">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-400 shrink-0">
                    <span className="text-cyber-violet font-mono">{project.org}</span>
                    <span className="hidden md:inline text-gray-600">·</span>
                    <span>{project.period}</span>
                  </div>
                </div>

                {/* Scale badge */}
                <div className="mb-5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-cyber-cyan/70 bg-cyber-cyan/5 border border-cyber-cyan/20 rounded px-2.5 py-1">
                    <TrendingUp className="w-3 h-3" />
                    {project.scale}
                  </span>
                </div>

                {/* Problem */}
                <div className="mb-6">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-cyber-pink uppercase tracking-wider mb-2">
                    <Target className="w-4 h-4" />
                    Problem
                  </h4>
                  <p className="text-gray-300 leading-relaxed">{project.problem}</p>
                </div>

                {/* Actions + Impact side by side */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-cyber-violet uppercase tracking-wider mb-3">
                      <Zap className="w-4 h-4" />
                      What I Did
                    </h4>
                    <ul className="space-y-2.5">
                      {project.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                          <span className="text-cyber-violet mt-0.5 shrink-0">▸</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-cyber-cyan uppercase tracking-wider mb-3">
                      <Shield className="w-4 h-4" />
                      Impact
                    </h4>
                    <ul className="space-y-2.5">
                      {project.impact.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300 font-medium">
                          <span className="text-cyber-cyan mt-0.5 shrink-0">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* What could go wrong — expandable */}
                <button
                  onClick={() => setExpandedRisk(expandedRisk === index ? null : index)}
                  className="flex items-center gap-2 text-sm text-cyber-pink/70 hover:text-cyber-pink transition-colors group mb-3"
                  aria-expanded={expandedRisk === index}
                  aria-controls={`risk-panel-${index}`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="font-mono">What could go wrong?</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      expandedRisk === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedRisk === index && (
                    <motion.div
                      id={`risk-panel-${index}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-cyber-pink/5 border border-cyber-pink/20 rounded-lg p-4 text-sm text-gray-400 leading-relaxed">
                        {project.risk}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Tools */}
                <div className="mt-5 pt-5 border-t border-gray-800/50">
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-2.5 py-1 bg-cyber-black/40 text-cyber-cyan/70 border border-cyber-violet/20 rounded text-xs font-mono"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
