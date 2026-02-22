import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Layers,
  Terminal,
  Server,
  Code2,
  Timer,
  TestTubes,
  Monitor,
  Container,
  GitBranch,
  Gauge,
  Shield,
  Settings,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  BarChart3,
  Bug,
  Repeat,
  FileCode,
  Globe,
} from 'lucide-react';

/* ── Architecture diagram ─────────────────────────────────────────────── */
const ArchitectureDiagram: React.FC = () => {
  const layers = [
    {
      label: 'Test Layer',
      color: 'cyber-cyan',
      items: ['UI Tests (Selenium)', 'API Tests (requests)', 'Performance (JMeter)'],
    },
    {
      label: 'Page Objects',
      color: 'cyber-violet',
      items: ['HomePage', 'SearchResultsPage', 'ProductPage', 'CartPage'],
    },
    {
      label: 'Service Layer',
      color: 'cyber-pink',
      items: ['ApiClient', 'SearchService', 'ProductService', 'SchemaValidator'],
    },
    {
      label: 'Core Layer',
      color: 'cyber-cyan',
      items: ['DriverFactory', 'BasePage', 'Config', 'Logger', 'Exceptions'],
    },
    {
      label: 'Infrastructure',
      color: 'cyber-violet',
      items: ['Docker', 'GitHub Actions', 'Selenium Grid', 'Nginx', 'Cron'],
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

/* ── Main Landing Page ─────────────────────────────────────────────────── */
export const AutomationFrameworkLanding: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Monitor className="w-7 h-7" />,
      title: 'UI Automation',
      description:
        'Selenium WebDriver with real DOM selectors verified against live Nykaa. Explicit waits (zero time.sleep), popup dismissal, parametrized data-driven tests, and automatic screenshot capture on failure.',
      color: 'cyber-cyan',
    },
    {
      icon: <TestTubes className="w-7 h-7" />,
      title: 'API Validation',
      description:
        'Real working endpoints (search suggestions, inventory, offers) with JSON schema validation, negative/boundary testing, and full HTTP method coverage (GET/POST/PUT/DELETE/HEAD).',
      color: 'cyber-violet',
    },
    {
      icon: <Gauge className="w-7 h-7" />,
      title: 'Performance Testing',
      description:
        'JMeter test plans with controlled load (5-10 users, 60s ramp). Measures avg response time, 95th percentile, error rate, and throughput.',
      color: 'cyber-pink',
    },
    {
      icon: <Container className="w-7 h-7" />,
      title: 'Docker',
      description:
        'Two-container setup: Selenium Chrome + Python test runner. Full suite runs in isolated containers with volume-mounted reports.',
      color: 'cyber-cyan',
    },
    {
      icon: <GitBranch className="w-7 h-7" />,
      title: 'CI/CD Pipeline',
      description:
        'GitHub Actions with three parallel jobs: API tests (no browser), UI tests (Selenium service), and performance tests (JMeter, scheduled).',
      color: 'cyber-violet',
    },
    {
      icon: <Globe className="w-7 h-7" />,
      title: 'Deployment & Reports',
      description:
        'Nightly cron on DigitalOcean runs regression, publishes HTML reports behind nginx with basic auth. 14-day retention with auto-cleanup.',
      color: 'cyber-pink',
    },
  ];

  const techStack = [
    { category: 'Test Framework', items: ['Python 3.13', 'PyTest', 'Selenium 4.27', 'Allure', 'pytest-xdist'], icon: <Code2 className="w-5 h-5" /> },
    { category: 'API Layer', items: ['requests', 'jsonschema', 'Pydantic Settings', 'HTTPAdapter Retry'], icon: <Server className="w-5 h-5" /> },
    { category: 'Performance', items: ['Apache JMeter 5.6', 'Thread Groups', 'Listeners', 'HTML Dashboard'], icon: <Gauge className="w-5 h-5" /> },
    { category: 'Infrastructure', items: ['Docker Compose', 'Selenium Chrome', 'Nginx', 'DigitalOcean'], icon: <Container className="w-5 h-5" /> },
    { category: 'CI/CD', items: ['GitHub Actions', 'Service Containers', 'Artifact Upload', 'Scheduled Runs'], icon: <GitBranch className="w-5 h-5" /> },
    { category: 'Config & Logging', items: ['pydantic-settings', 'python-json-logger', 'Env-Aware Config', 'AUTO_ Prefix'], icon: <Settings className="w-5 h-5" /> },
  ];

  const designDecisions = [
    {
      title: 'Page Object Model over Raw Selectors',
      body: 'Separates locators from test logic. When the DOM changes, I fix one page file — not every test. Each page object inherits from BasePage which handles waits, scrolling, and screenshots.',
    },
    {
      title: 'Driver Factory over Direct WebDriver',
      body: 'A static factory abstracts browser creation. Same test code runs on local Chrome, headless CI, or remote Selenium Grid. Switching to Grid is one env var change — zero code changes.',
    },
    {
      title: 'Function-Scoped Driver over Session-Scoped',
      body: 'Each test gets a fresh browser instance. Slower, but bulletproof test isolation — no state leakage between tests. A failing test can never corrupt the next one.',
    },
    {
      title: 'Sync requests over async httpx',
      body: 'PyTest is synchronous. Using httpx async adds complexity (event loops, fixtures) for zero gain. The tests don\'t need concurrency — they need reliability.',
    },
    {
      title: 'Framework-Validating API Tests',
      body: 'Nykaa\'s Akamai WAF blocks direct API calls with 403. Rather than fight the CDN, API tests validate framework behavior — timing measurement, error handling, header capture — regardless of response code.',
    },
    {
      title: 'Standalone Chrome over Selenium Grid',
      body: 'Grid is overkill for 30 tests. Standalone Chrome is simpler to debug and deploy. The upgrade path is pre-built: change one env var to point at a hub.',
    },
  ];

  const faqs = [
    {
      q: 'Why did I build this?',
      a: 'As an SDET, I needed a portfolio piece that demonstrates end-to-end ownership of test architecture — not just "I can write Selenium tests," but "I can design a framework, Dockerize it, set up CI/CD, deploy nightly regression, and explain every tradeoff." This framework is that proof.',
    },
    {
      q: 'How does the Page Object Model work here?',
      a: 'Every page (Home, Search Results, Product, Cart) is a Python class inheriting from BasePage. BasePage provides explicit waits, click/type/scroll methods, and screenshot capture. Tests never touch raw WebDriver — they call page.search_product("lipstick") or cart.validate_pricing(). When Nykaa changes their DOM, I update one locator in one file.',
    },
    {
      q: 'What happens when the API returns 403?',
      a: 'Nykaa uses Akamai WAF which blocks non-browser traffic. Instead of faking headers or fighting the CDN, the API tests are designed to validate the framework itself — does ApiClient capture timing? Does it handle errors gracefully? Does SchemaValidator work correctly? The framework proves its resilience regardless of what the server returns.',
    },
    {
      q: 'How does Docker make this portable?',
      a: 'docker-compose.yml defines two services: selenium/standalone-chrome (browser) and a Python test runner. The runner connects to Chrome via SELENIUM_REMOTE_URL. This means the same tests run identically on my MacBook, in GitHub Actions, and on the DigitalOcean droplet — no "works on my machine" issues.',
    },
    {
      q: 'What\'s the scaling path?',
      a: 'Phase 1 (current): Standalone Chrome. Phase 2: Swap to Selenium Grid hub + N Chrome nodes — zero code changes. Phase 3: CI matrix strategy for Chrome + Firefox. Phase 4: Contract testing with Schemathesis. Phase 5: Kubernetes with Selenium Helm chart and test CronJobs.',
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
        {/* ── Navigation ───────────────────────────────────────────────── */}
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
              href="https://github.com/Deoli420/automation-framework"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-violet text-white rounded-lg hover:bg-cyber-purple transition-colors cyber-glow"
            >
              Source Code
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ── Hero Section ──────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 pt-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Icon cluster */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center gap-4 mb-8"
            >
              <TestTubes className="w-8 h-8 text-cyber-violet animate-pulse" />
              <Monitor className="w-8 h-8 text-cyber-cyan animate-pulse" />
              <Gauge className="w-8 h-8 text-cyber-pink animate-pulse" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 cyber-text animate-flicker">
              E2E Automation Framework
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              Production-Grade Test Architecture for Web Applications
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A complete automation framework I designed and built from scratch — UI testing
              with Selenium, API validation, performance testing with JMeter, Dockerized
              execution, CI/CD pipeline, and nightly regression on a live server.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <a
                href="https://github.com/Deoli420/automation-framework"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center gap-2 text-lg"
              >
                <Code2 className="w-5 h-5" />
                View Source Code
              </a>
              <a
                href="https://github.com/Deoli420/automation-framework/actions"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border-2 border-cyber-cyan text-cyber-cyan rounded-md hover:bg-cyber-cyan hover:text-cyber-black transition-colors cyber-glow flex items-center gap-2 text-lg"
              >
                <Play className="w-5 h-5" />
                CI Pipeline
              </a>
            </div>

            {/* Quick stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Test Cases', value: '67' },
                { label: 'Page Objects', value: '4' },
                { label: 'API Services', value: '3' },
                { label: 'CI Jobs', value: '3' },
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

        {/* ── The Problem Section ────────────────────────────────────────── */}
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
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">Interview-ready architecture.</strong>{' '}
                    Most QA portfolios show isolated test scripts. This framework demonstrates
                    end-to-end SDET ownership — from config management and page objects to
                    Docker, CI/CD, and production deployment.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">Multi-layer validation.</strong>{' '}
                    UI tests catch visual regressions. API tests catch schema and timing issues.
                    Performance tests catch throughput degradation. Cross-layer checks catch
                    data inconsistencies that single-layer testing misses entirely.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">Production-grade patterns.</strong>{' '}
                    Pydantic-settings for typed config, structured JSON logging, categorized
                    exceptions, retry strategies, function-scoped isolation — patterns I've
                    used in real production at scale.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Core Features ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            Core Capabilities
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Every layer designed, built, and deployed by me — from page locators to nightly cron.
          </p>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border group"
              >
                <div className={`text-${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold text-${feature.color} mb-3`}>
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Architecture ──────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            System Architecture
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Five-layer architecture from infrastructure to test execution.
          </p>
          <div className="max-w-3xl mx-auto">
            <ArchitectureDiagram />
          </div>

          {/* Test flow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-8 bg-cyber-black/40 rounded-xl p-6 border border-cyber-violet/20"
          >
            <h4 className="text-lg font-bold text-cyber-cyan mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Test Execution Flow
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                'pytest collects tests',
                'DriverFactory creates browser',
                'Page Object executes actions',
                'Assertions validate state',
                'Screenshot on failure',
                'HTML report generated',
                'Artifact uploaded to CI',
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <span className="px-3 py-1 bg-cyber-black/60 text-gray-300 rounded border border-gray-700">
                    {step}
                  </span>
                  {i < 6 && <ArrowRight className="w-4 h-4 text-cyber-violet/50 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Tech Stack ────────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            Tech Stack
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Production-grade tooling chosen for reliability, not resume padding.
          </p>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((group, i) => (
              <motion.div
                key={group.category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-cyber-violet">{group.icon}</span>
                  <h3 className="text-lg font-bold text-cyber-cyan">{group.category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-cyber-black/30 text-gray-300 border border-cyber-violet/30 rounded-md text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Test Coverage Breakdown ──────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            Test Coverage
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            67 test cases across three layers — each validating different failure modes.
          </p>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'UI Tests',
                count: '31',
                icon: <Monitor className="w-6 h-6" />,
                color: 'cyber-cyan',
                items: [
                  'Parametrized search (5 terms × multi-word queries)',
                  'Filter presence & product page navigation',
                  'Negative/boundary: XSS, 500-char, SQLi, gibberish',
                  'Homepage: load, search bar, popup dismissal',
                  'Cart tests with auth-required gating',
                ],
              },
              {
                title: 'API Tests',
                count: '36',
                icon: <Terminal className="w-6 h-6" />,
                color: 'cyber-violet',
                items: [
                  'Search suggestions & trending (real endpoints)',
                  'Inventory + product offers schema validation',
                  'HTTP methods: POST, PUT, DELETE, HEAD resilience',
                  'Negative: SQLi, Unicode, long queries, HTML injection',
                  'Parametrized data-driven with WAF-aware skips',
                ],
              },
              {
                title: 'Performance',
                count: '2 plans',
                icon: <Gauge className="w-6 h-6" />,
                color: 'cyber-pink',
                items: [
                  'Search endpoint: 5 users, 30s ramp, 60s run',
                  'Product endpoint: 5 users, 30s ramp, 60s run',
                  'Metrics: avg latency, P95, error %, throughput',
                  'Think times: 2-3s (ethical load)',
                  'HTML dashboard auto-generated',
                ],
              },
            ].map((group, i) => (
              <motion.div
                key={group.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-${group.color}`}>{group.icon}</span>
                  <h3 className={`text-xl font-bold text-${group.color}`}>{group.title}</h3>
                </div>
                <div className={`text-3xl font-bold font-mono text-${group.color} mb-4`}>
                  {group.count}
                </div>
                <ul className="space-y-2">
                  {group.items.map((item, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-400">
                      <span className={`text-${group.color} mt-0.5 shrink-0`}>&#x25B8;</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Engineering Decisions ────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            Key Engineering Decisions
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Real tradeoffs, not textbook answers. Every choice has a "why."
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {designDecisions.map((decision, i) => (
              <motion.div
                key={decision.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
              >
                <h3 className="text-lg font-bold text-cyber-violet mb-3">
                  {decision.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{decision.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Scaling Path ────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            Scaling Path
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Built to evolve — every phase requires zero test-code changes.
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { phase: 'Phase 1', label: 'Standalone Chrome', status: 'Current', detail: 'Single selenium/standalone-chrome container. pytest-xdist for parallel API execution. 67 tests with Allure reporting.', color: 'text-green-400' },
              { phase: 'Phase 2', label: 'Selenium Grid', status: 'Ready', detail: 'Replace standalone-chrome with selenium/hub + N chrome-node containers. Zero code changes — one env var switch.', color: 'text-cyber-cyan' },
              { phase: 'Phase 3', label: 'Multi-Browser', status: 'Designed', detail: 'DriverFactory already supports Chrome + Firefox. CI matrix strategy adds parallel browser testing.', color: 'text-cyber-violet' },
              { phase: 'Phase 4', label: 'Contract Testing', status: 'Planned', detail: 'Add Schemathesis or Pact tests in tests/contract/. Baseline schemas already exist in fixtures/.', color: 'text-cyber-pink' },
              { phase: 'Phase 5', label: 'Kubernetes', status: 'Planned', detail: 'Selenium Helm chart + test runner as CronJob + reports to S3.', color: 'text-gray-400' },
            ].map((item, i) => (
              <motion.div
                key={item.phase}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start gap-4 p-4 bg-cyber-black/40 rounded-lg border border-gray-800 hover:border-cyber-violet/30 transition-colors"
              >
                <div className="flex flex-col items-center gap-1 shrink-0 w-20">
                  <span className="text-xs font-mono text-gray-500">{item.phase}</span>
                  <span className={`text-xs font-mono ${item.color}`}>{item.status}</span>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-1">{item.label}</h4>
                  <p className="text-sm text-gray-400">{item.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FAQ Section ───────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
          >
            Deep Dive Q&A
          </motion.h2>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border border-cyber-violet/30 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-6 py-4 bg-cyber-black/30 flex items-center justify-between text-left hover:bg-cyber-violet/10 transition-colors"
                >
                  <span className="text-lg font-semibold text-cyber-cyan">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-cyber-violet flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-cyber-violet flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="px-6 py-4 bg-cyber-black/20"
                  >
                    <p className="text-gray-300 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── What I Learned ────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
          >
            What I Learned Building This
          </motion.h2>

          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
            {[
              {
                title: 'CDN WAFs Break Direct API Testing',
                text: 'Nykaa\'s Akamai WAF returns 403 on all non-browser API calls. Lesson: design API tests to validate framework behavior, not server responses. Your test framework must prove itself regardless of what the backend does.',
                icon: <Shield className="w-6 h-6 text-cyber-violet" />,
              },
              {
                title: 'Test Isolation is Non-Negotiable',
                text: 'Function-scoped browser fixtures are slower but eliminate all state leakage. A cart test that leaves items behind will corrupt every subsequent test. Fresh browser per test is the only reliable pattern.',
                icon: <Bug className="w-6 h-6 text-cyber-cyan" />,
              },
              {
                title: 'Config Management Compounds',
                text: 'pydantic-settings with env prefix (AUTO_) keeps framework config separate from app config. Env-aware loading (local/ci/staging) means the same test code works everywhere without conditional logic.',
                icon: <Settings className="w-6 h-6 text-cyber-pink" />,
              },
              {
                title: 'Docker Makes Tests Portable',
                text: 'The gap between "works on my machine" and "works in CI" vanishes with Docker. Same Chrome version, same Python version, same network. Debugging becomes deterministic.',
                icon: <Container className="w-6 h-6 text-cyber-violet" />,
              },
            ].map((lesson, i) => (
              <motion.div
                key={lesson.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl p-6 cyber-border"
              >
                <div className="flex items-center gap-3 mb-3">
                  {lesson.icon}
                  <h3 className="text-lg font-bold text-white">{lesson.title}</h3>
                </div>
                <p className="text-gray-400 leading-relaxed text-sm">{lesson.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Ethical Design ─────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border"
          >
            <h2 className="text-2xl font-bold text-cyber-cyan mb-6 flex items-center gap-3">
              <Eye className="w-6 h-6" />
              Ethical Design
            </h2>
            <div className="space-y-3">
              {[
                'Realistic User-Agent for compatibility; framework clearly documented as portfolio project',
                'JMeter load capped at 5-10 users with 2-3 second think times',
                'No login, payment, or account creation flows',
                'No aggressive crawling or data scraping',
                'Read-only validation framework — never modifies target state',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300">{item}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── Footer CTA ──────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-6 cyber-text animate-flicker">
              Explore the Code
            </h2>
            <p className="text-gray-400 mb-8">
              Every pattern, every decision, every line — open source and interview-ready.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/Deoli420/automation-framework"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center gap-2"
              >
                <Code2 className="w-5 h-5" />
                GitHub Repository
              </a>
              <Link
                to="/"
                className="px-8 py-3 border-2 border-cyber-cyan text-cyber-cyan rounded-md hover:bg-cyber-cyan hover:text-cyber-black transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Portfolio
              </Link>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};
