import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  Code2,
  Play,
  Search,
  Globe,
  Smartphone,
  Shield,
  Zap,
  Link2,
  FileCode,
  Container,
  GitBranch,
  Mail,
  Database,
  Timer,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Terminal,
  Eye,
  BarChart3,
  Layers,
  Settings,
  Bug,
} from 'lucide-react';

/* ── Architecture Diagram ────────────────────────────────────────────── */
const ArchitectureDiagram: React.FC = () => {
  const layers = [
    {
      label: 'Test Layer',
      color: 'cyber-cyan',
      items: ['Meta Tags', 'Headings', 'Links', 'Performance', 'Mobile', 'Structured Data', 'Security'],
    },
    {
      label: 'Page Object Model',
      color: 'cyber-violet',
      items: ['BasePage', '20+ Methods', 'Zero Hardcoded Selectors', 'JS Evaluation'],
    },
    {
      label: 'Data & Utils',
      color: 'cyber-pink',
      items: ['URL Crawler', 'SQLite Logger', 'Email Reporter', 'URL Validator'],
    },
    {
      label: 'Infrastructure',
      color: 'cyber-cyan',
      items: ['Playwright', 'pytest', 'Docker', 'GitHub Actions', 'Allure Reports'],
    },
  ];

  return (
    <div className="space-y-4">
      {layers.map((layer, i) => (
        <motion.div
          key={layer.label}
          initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className={`bg-cyber-black/40 border border-${layer.color}/30 rounded-lg p-5`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full bg-${layer.color} animate-pulse`} />
            <h4 className={`text-lg font-bold text-${layer.color}`}>{layer.label}</h4>
          </div>
          <div className="flex flex-wrap gap-2 ml-6">
            {layer.items.map((item) => (
              <span
                key={item}
                className="px-3 py-1 bg-cyber-black/60 text-gray-300 text-sm rounded border border-gray-700"
              >
                {item}
              </span>
            ))}
          </div>
          {i < layers.length - 1 && (
            <div className="flex justify-center mt-3">
              <ChevronDown className={`w-5 h-5 text-${layer.color}/50`} />
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

/* ── Live Findings Component ──────────────────────────────────────────── */
const LiveFindings: React.FC = () => {
  const findings = [
    {
      severity: 'high',
      title: 'Category Pages Have Empty H1/H2/H3 Tags',
      detail: 'All 4 category pages render headings via CSS — DOM contains empty <h1>, <h2>, and 16+ empty <h3> elements. Googlebot sees blank headings.',
      pages: 4,
    },
    {
      severity: 'medium',
      title: 'Homepage Has 2 H1 Tags',
      detail: 'First H1 is just "Beebom" (6 chars). Best practice is one descriptive H1 per page.',
      pages: 1,
    },
    {
      severity: 'medium',
      title: '8 Review Pages Missing Article Schema',
      detail: 'Review articles lack @type: Article in JSON-LD. Ineligible for Google rich results (publish date, author, featured snippet).',
      pages: 8,
    },
    {
      severity: 'low',
      title: '5 Titles Have Duplicate Words',
      detail: 'Words like "learning", "tools", "step" repeated in titles. Looks spammy to search engines and wastes character space.',
      pages: 5,
    },
    {
      severity: 'low',
      title: '1 Page Load Exceeded 5s',
      detail: 'Doom: The Dark Ages review took 18,066ms — likely heavy embeds/images causing slow load on content-rich pages.',
      pages: 1,
    },
  ];

  const severityConfig = {
    high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: <XCircle className="w-5 h-5" /> },
    medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: <AlertTriangle className="w-5 h-5" /> },
    low: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: <Eye className="w-5 h-5" /> },
  };

  return (
    <div className="space-y-4">
      {findings.map((f, i) => {
        const s = severityConfig[f.severity as keyof typeof severityConfig];
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`${s.bg} border rounded-lg p-5`}
          >
            <div className="flex items-start gap-3">
              <div className={`${s.color} mt-0.5`}>{s.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-white font-semibold">{f.title}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded ${s.color} border ${s.bg}`}>
                    {f.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{f.pages} page{f.pages > 1 ? 's' : ''}</span>
                </div>
                <p className="text-gray-400 text-sm">{f.detail}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

/* ── Main Landing Page ────────────────────────────────────────────────── */
export const BeebomSEOLanding: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Search className="w-7 h-7" />,
      title: 'Meta Tag Validation',
      description:
        'Title length, meta descriptions, Open Graph tags, canonical URLs, robots directives — 11 checks per page ensuring SERP visibility and social sharing work correctly.',
      color: 'cyber-cyan',
    },
    {
      icon: <FileCode className="w-7 h-7" />,
      title: 'Heading Structure',
      description:
        'Single H1 enforcement, heading hierarchy, empty heading detection, keyword-in-H1 matching. Ensures crawlers and screen readers parse content structure correctly.',
      color: 'cyber-violet',
    },
    {
      icon: <Link2 className="w-7 h-7" />,
      title: 'Link & Image Audit',
      description:
        'Broken internal link detection, redirect chain analysis, nofollow misuse, image alt text coverage, 404 image detection — network-verified against live URLs.',
      color: 'cyber-pink',
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'Performance Testing',
      description:
        'Page load time, TTFB, render-blocking resource count, oversized images (>500KB), total network request budget — all measured via Navigation Timing API.',
      color: 'cyber-cyan',
    },
    {
      icon: <Smartphone className="w-7 h-7" />,
      title: 'Mobile Responsiveness',
      description:
        'iPhone 13 emulation with viewport validation, font readability (>=12px), tap target sizing (>=48px), horizontal overflow detection, and mobile layout rendering.',
      color: 'cyber-violet',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Security & Technical SEO',
      description:
        'HTTPS enforcement, mixed content detection, HTTP-to-HTTPS redirect validation, robots.txt, sitemap.xml validity, and X-Frame-Options clickjacking protection.',
      color: 'cyber-pink',
    },
  ];

  const techStack = [
    { category: 'Browser Engine', items: ['Playwright', 'Chromium (headless)', 'Mobile Emulation'], icon: <Globe className="w-5 h-5" /> },
    { category: 'Test Framework', items: ['Python 3.11+', 'pytest', 'Parametrize', 'Markers', 'Allure'], icon: <Code2 className="w-5 h-5" /> },
    { category: 'Page Objects', items: ['BasePage (20+ methods)', 'JS Evaluation', 'Navigation Timing API'], icon: <Layers className="w-5 h-5" /> },
    { category: 'Data Layer', items: ['SQLite', 'URL Crawler', 'Sitemap Parser', 'BeautifulSoup'], icon: <Database className="w-5 h-5" /> },
    { category: 'Infrastructure', items: ['Docker', 'docker-compose', 'GitHub Actions', 'Cron Scheduler'], icon: <Container className="w-5 h-5" /> },
    { category: 'Reporting', items: ['Allure Reports', 'HTML Email (smtplib)', 'Trend Analysis', 'Auto Screenshots'], icon: <Mail className="w-5 h-5" /> },
  ];

  const designDecisions = [
    {
      title: 'Page Object Model over Raw Selectors',
      body: 'BasePage class wraps 20+ Playwright interactions. Tests call base_page.get_meta_description() — never touch raw CSS selectors. One change point when the site redesigns.',
    },
    {
      title: 'Live URL Crawler over Hardcoded Lists',
      body: 'First run used hardcoded URLs — 12 of 16 were 404s, producing 126 false failures. Built a sitemap + homepage crawler to discover only live URLs. Lesson: validate test data, not just test logic.',
    },
    {
      title: 'Parametrized Tests over Copy-Paste',
      body: '@pytest.mark.parametrize runs every test against 54 URLs automatically. Adding a new URL means editing one list — zero new test code. One function → 1,300+ test executions.',
    },
    {
      title: 'Function-Scoped Browser Context',
      body: 'Each test gets a fresh Playwright browser context. No cookie leakage, no state pollution. A flaky test cannot corrupt the next one.',
    },
    {
      title: 'SQLite for Trend Analysis',
      body: 'Every run logs to two tables: run summaries and individual results. Email reports compare the last 5 runs to catch regressions. Lightweight — zero infrastructure beyond a file.',
    },
    {
      title: 'Two-Tier URL Lists: ALL_URLS vs SMOKE_URLS',
      body: 'Network-heavy tests (broken links, performance) use a 9-URL smoke subset. Lightweight tests (meta tags, headings) run against all 54 URLs. Balances coverage vs runtime.',
    },
  ];

  const faqs = [
    {
      q: 'Why did I build this?',
      a: 'SEO issues are silent — no alerts when a canonical tag breaks or a meta description goes missing. I built this to automate nightly checks so the team gets an email every morning with exactly what regressed, complete with screenshots and trend history.',
    },
    {
      q: 'How did you handle the 404 URL problem?',
      a: 'My first run showed 69.8% pass rate with 126 failures. Investigation revealed 12 of 16 hardcoded URLs were dead 404s — Beebom had restructured their site. I built a URL crawler (sitemap.xml + homepage links) that discovers only live URLs, then verifies each with HTTP HEAD before testing. Pass rate jumped to 97.1% with only real findings remaining.',
    },
    {
      q: 'What real SEO issues did you find on Beebom?',
      a: '16 genuine findings: (1) All 4 category pages have empty H1/H2/H3 tags — likely CSS-rendered headings invisible to crawlers. (2) Homepage has 2 H1 tags instead of 1. (3) 8 review pages missing Article schema — no rich result eligibility. (4) 5 titles with duplicate words. (5) 1 page with 18-second load time.',
    },
    {
      q: 'How does the nightly pipeline work?',
      a: 'GitHub Actions cron runs at 11 PM IST. It installs Python + Playwright, runs the full pytest suite with Allure reporting, uploads the report as an artifact, then sends an HTML email with pass/fail summary and trend comparison. Alternative: scheduler.py runs locally as a daemon.',
    },
    {
      q: 'What\'s the scaling path?',
      a: 'Phase 1 (current): Single Chromium, sequential. Phase 2: pytest-xdist for parallel browsers. Phase 3: Lighthouse CI integration for Core Web Vitals. Phase 4: Multi-site support via BASE_URL parameterization. Phase 5: Grafana dashboard replacing email reports.',
    },
  ];

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-hidden">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-violet via-cyber-cyan to-cyber-pink z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Background texture */}
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      <div className="relative z-10">
        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-black/60 border border-cyber-violet/50 text-cyber-violet rounded-lg hover:bg-cyber-violet/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </Link>
            <a
              href="https://github.com/Deoli420/beebom-seo-framework"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-violet text-white rounded-lg hover:bg-cyber-purple transition-colors cyber-glow"
            >
              Source Code
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ── Hero Section ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 pt-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center gap-4 mb-8"
            >
              <Search className="w-8 h-8 text-cyber-violet animate-pulse" />
              <Globe className="w-8 h-8 text-cyber-cyan animate-pulse" />
              <Shield className="w-8 h-8 text-cyber-pink animate-pulse" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 cyber-text animate-flicker">
              SEO Testing Framework
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              Automated SEO Auditing for beebom.com
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A production-ready framework that crawls live URLs, runs 1,300+ SEO tests across
              7 categories, catches real issues on a 10M+ monthly visitor site, and emails
              color-coded reports every night — all running on Docker and GitHub Actions.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <a
                href="https://github.com/Deoli420/beebom-seo-framework"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center gap-2 text-lg"
              >
                <Code2 className="w-5 h-5" />
                View Source Code
              </a>
              <a
                href="https://github.com/Deoli420/beebom-seo-framework/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border-2 border-cyber-cyan text-cyber-cyan rounded-md hover:bg-cyber-cyan hover:text-cyber-black transition-colors cyber-glow flex items-center gap-2 text-lg"
              >
                <Play className="w-5 h-5" />
                CI Pipeline
              </a>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Test Cases', value: '1,304' },
                { label: 'Pass Rate', value: '97.1%' },
                { label: 'URLs Tested', value: '54' },
                { label: 'Real Findings', value: '16' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-cyber-black/50 backdrop-blur rounded-lg p-4 cyber-border"
                >
                  <div className="text-2xl font-bold text-cyber-cyan font-mono">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── The Problem ──────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker">
              Why This Exists
            </h2>
            <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
              <div className="space-y-6">
                {[
                  { color: 'cyber-pink', text: 'SEO issues are silent killers.', detail: 'No alerts when a canonical tag breaks, a meta description goes missing, or a page accidentally gets noindexed. Manual audits take hours and people forget to run them.' },
                  { color: 'cyber-cyan', text: 'Beebom gets 10M+ monthly visitors.', detail: 'A single noindex mistake on a high-traffic article can wipe out thousands of daily organic visits. Automated nightly checks catch regressions within 24 hours.' },
                  { color: 'cyber-violet', text: 'Proof of SDET ownership.', detail: 'This framework demonstrates end-to-end test architecture — from POM design and fixture management to Docker, CI/CD, email reporting, and database trend analysis.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-2 h-2 bg-${item.color} rounded-full mt-3 flex-shrink-0`} />
                    <p className="text-gray-300 text-lg leading-relaxed">
                      <strong className={`text-${item.color}`}>{item.text}</strong>{' '}
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Features Grid ────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker">
            7 Test Categories
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Every category runs against 54 verified live URLs using parametrized pytest
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`bg-cyber-black/50 backdrop-blur rounded-xl p-6 border border-${f.color}/20 hover:border-${f.color}/60 transition-colors group`}
              >
                <div className={`text-${f.color} mb-4 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className={`text-xl font-bold text-${f.color} mb-3`}>{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Live Findings ────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker">
              Real SEO Findings
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              16 genuine issues caught on beebom.com — not false positives, not framework bugs
            </p>

            {/* Pass/fail summary bar */}
            <div className="flex items-center gap-4 mb-8 justify-center">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-mono font-bold">1,266 passed</span>
              </div>
              <div className="w-px h-6 bg-gray-600" />
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-mono font-bold">16 failed</span>
              </div>
              <div className="w-px h-6 bg-gray-600" />
              <div className="flex items-center gap-2">
                <span className="text-cyber-cyan font-mono font-bold">97.1% pass rate</span>
              </div>
            </div>

            <LiveFindings />
          </motion.div>
        </section>

        {/* ── Architecture ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker">
              Framework Architecture
            </h2>
            <ArchitectureDiagram />
          </div>
        </section>

        {/* ── Tech Stack ───────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker">
            Tech Stack
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {techStack.map((t, i) => (
              <motion.div
                key={t.category}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-cyber-violet">{t.icon}</div>
                  <h3 className="text-lg font-bold text-white">{t.category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-cyber-violet/10 text-cyber-violet text-sm rounded-full border border-cyber-violet/30"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Design Decisions ─────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker">
            Design Decisions
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {designDecisions.map((d, i) => (
              <motion.div
                key={d.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
              >
                <h3 className="text-lg font-bold text-cyber-cyan mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  {d.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{d.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── The 404 Bug Story ────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker">
              The 404 Bug Story
            </h2>
            <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <Bug className="w-6 h-6 text-red-400 flex-shrink-0" />
                  <div>
                    <div className="text-red-400 font-bold">First Run: 69.8% pass rate — 126 failures</div>
                    <div className="text-gray-400 text-sm">Pages missing canonical tags, OG tags, robots directives... looked like a catastrophe.</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <Search className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div>
                    <div className="text-yellow-400 font-bold">Investigation: 12 of 16 URLs were dead 404s</div>
                    <div className="text-gray-400 text-sm">Hardcoded URLs based on assumptions. Beebom had restructured — /best-phones/, /best-laptops/ all returned 404.</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                  <div>
                    <div className="text-green-400 font-bold">Fix: Built URL crawler + verification pipeline</div>
                    <div className="text-gray-400 text-sm">Crawls sitemap.xml + homepage, verifies every URL returns 200 before testing. Pass rate: 97.1% with only real findings.</div>
                  </div>
                </div>

                <p className="text-gray-300 text-center italic mt-4">
                  "Always validate your test data, not just your test logic."
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker">
            FAQ / Interview Deep-Dive
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="cyber-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full text-left p-5 flex items-center justify-between hover:bg-cyber-violet/5 transition-colors"
                >
                  <span className="text-white font-semibold pr-4">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-cyber-violet flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-5 pb-5"
                  >
                    <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── CTA Footer ───────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6 cyber-text">Ready to Explore?</h2>
            <p className="text-gray-400 mb-8">
              Clone the repo, set up .env, and run <code className="text-cyber-cyan bg-cyber-black/60 px-2 py-1 rounded">pytest tests/</code> — results in under 15 minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/Deoli420/beebom-seo-framework"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center gap-2"
              >
                <Code2 className="w-5 h-5" />
                GitHub Repository
              </a>
              <Link
                to="/"
                className="px-8 py-3 border-2 border-gray-600 text-gray-300 rounded-md hover:border-cyber-cyan hover:text-cyber-cyan transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Portfolio
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer spacer */}
        <div className="h-20" />
      </div>
    </div>
  );
};
