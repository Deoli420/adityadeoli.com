import React, { useState } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Layers,
  Code2,
  TestTubes,
  Monitor,
  Smartphone,
  AppWindow,
  Shield,
  Eye,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  HeartPulse,
  Scale,
  AlertTriangle,
  Repeat,
  MessageSquareWarning,
  BookOpen,
  BarChart3,
  Settings,
  Server,
  GitBranch,
  Search,
  ClipboardCheck,
} from 'lucide-react';

/* ── Architecture diagram ─────────────────────────────────────────────── */
const ArchitectureDiagram: React.FC = () => {
  const layers = [
    {
      label: 'Test Layer',
      color: 'cyber-pink',
      items: ['Web Tests (Selenium)', 'Mobile Tests (Appium)', 'Desktop Tests (FlaUI)', 'AI Validation Tests'],
    },
    {
      label: 'Page Objects & AI Validators',
      color: 'cyber-violet',
      items: ['LoginPage', 'SettingsPage', 'NotepadPage', 'CalculatorPage', 'LLMClient', 'MedicalValidator'],
    },
    {
      label: 'AI/ML Validation Engine',
      color: 'cyber-cyan',
      items: ['SimilarityEngine', 'ToxicityChecker', 'HallucinationDetector', 'BiasDetector', 'ConsistencyTester'],
    },
    {
      label: 'Core Services',
      color: 'cyber-pink',
      items: ['DriverFactory', 'ConfigManager', 'WaitManager', 'SelfHealingLocator', 'ReportManager', 'DI Container'],
    },
    {
      label: 'Infrastructure',
      color: 'cyber-violet',
      items: ['GitHub Actions', 'Azure DevOps', 'NUnit Parallel', 'Serilog', 'ExtentReports'],
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
export const UnifiedAutomationAILanding: React.FC = () => {
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
      title: 'Web Automation',
      description:
        'Selenium WebDriver with Chrome + Edge support. WebDriverManager auto-downloads binaries. Self-healing locator chains try fallback strategies when primary selectors break.',
      color: 'cyber-cyan',
    },
    {
      icon: <Smartphone className="w-7 h-7" />,
      title: 'Mobile Automation',
      description:
        'Appium 5.x client for Android with UiAutomator2. Mobile-specific actions: swipe, scroll-to-text, hide keyboard. Config-driven device selection.',
      color: 'cyber-violet',
    },
    {
      icon: <AppWindow className="w-7 h-7" />,
      title: 'Desktop Automation',
      description:
        'FlaUI with UIA3 for Windows applications. Automates Notepad and Calculator with AutomationId, Name, and ControlType locators. Menu traversal and keyboard simulation.',
      color: 'cyber-pink',
    },
    {
      icon: <BrainCircuit className="w-7 h-7" />,
      title: 'LLM Response Validation',
      description:
        'Validate AI outputs: non-empty checks, keyword matching, intent scoring, format validation (JSON, lists, code blocks), and threshold-based assertions for non-deterministic outputs.',
      color: 'cyber-cyan',
    },
    {
      icon: <HeartPulse className="w-7 h-7" />,
      title: 'Medical AI Safety',
      description:
        'CRITICAL risk validation: enforces disclaimers, blocks dangerous medical advice, detects inappropriate dosage recommendations, and flags unauthorized diagnoses.',
      color: 'cyber-violet',
    },
    {
      icon: <AlertTriangle className="w-7 h-7" />,
      title: 'Hallucination Detection',
      description:
        'Splits LLM responses into claims, searches a knowledge base for supporting evidence via similarity scoring, and flags unsupported claims as potential hallucinations.',
      color: 'cyber-pink',
    },
    {
      icon: <Scale className="w-7 h-7" />,
      title: 'Bias Detection',
      description:
        'Tests if LLM outputs differ systematically across protected attributes (gender, race, age). Computes pairwise similarity and flags content/length divergence.',
      color: 'cyber-cyan',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Toxicity & Safety',
      description:
        'Two-tier approach: fast pattern-based keyword scanning plus LLM-as-judge evaluation. Checks toxicity, violence, self-harm, hate speech, and sexual content.',
      color: 'cyber-violet',
    },
    {
      icon: <Repeat className="w-7 h-7" />,
      title: 'Consistency Testing',
      description:
        'Runs the same prompt N times, computes pairwise similarity, and asserts mean/min/stddev within thresholds. Catches model instability and prompt sensitivity.',
      color: 'cyber-pink',
    },
  ];

  const techStack = [
    { category: 'Core Runtime', items: ['C# 12', '.NET 8', 'NUnit 4', 'Microsoft.Extensions.DI'], icon: <Code2 className="w-5 h-5" /> },
    { category: 'Web Automation', items: ['Selenium 4.18', 'WebDriverManager', 'Chrome', 'Edge'], icon: <Monitor className="w-5 h-5" /> },
    { category: 'Mobile & Desktop', items: ['Appium 5.x', 'UiAutomator2', 'FlaUI', 'UIA3'], icon: <Smartphone className="w-5 h-5" /> },
    { category: 'AI/ML Validation', items: ['OpenAI API', 'Cosine Similarity', 'TF-IDF', 'Embeddings'], icon: <BrainCircuit className="w-5 h-5" /> },
    { category: 'Observability', items: ['Serilog', 'ExtentReports', 'Allure', 'Rolling Logs'], icon: <BarChart3 className="w-5 h-5" /> },
    { category: 'CI/CD', items: ['GitHub Actions', 'Azure DevOps', 'Browser Matrix', 'Artifact Upload'], icon: <GitBranch className="w-5 h-5" /> },
  ];

  const aiValidationModules = [
    {
      title: 'Similarity Engine',
      count: '3 engines',
      icon: <Search className="w-6 h-6" />,
      color: 'cyber-cyan',
      items: [
        'Cosine similarity (TF-IDF style, zero API calls)',
        'Jaccard similarity (set overlap, fastest)',
        'Embedding-based (LLM vectors, most accurate)',
        'Pairwise scoring for consistency analysis',
        'Configurable pass threshold (default 0.7)',
      ],
    },
    {
      title: 'Safety & Toxicity',
      count: '2 tiers',
      icon: <Shield className="w-6 h-6" />,
      color: 'cyber-violet',
      items: [
        'Tier 1: Pattern-based keyword scanning (fast)',
        'Tier 2: LLM-as-judge evaluation (accurate)',
        '5 categories: toxicity, violence, self-harm, sexual, hate',
        'Configurable blocked keywords list',
        'Severity levels: CRITICAL, HIGH, MEDIUM, LOW',
      ],
    },
    {
      title: 'Medical AI Validator',
      count: '6 checks',
      icon: <HeartPulse className="w-6 h-6" />,
      color: 'cyber-pink',
      items: [
        'Disclaimer enforcement (regex patterns)',
        'Dangerous pattern blocking (5+ patterns)',
        'Required safety phrase detection',
        'Dosage specificity checking',
        'Unauthorized diagnosis detection',
      ],
    },
  ];

  const designDecisions = [
    {
      title: 'ThreadLocal<> for Driver Isolation',
      body: 'Parallel tests must never share WebDriver instances. ThreadLocal<IWebDriver> ensures each NUnit worker thread gets its own browser session. Zero locks, zero leaks, zero flaky tests from shared state.',
    },
    {
      title: 'Self-Healing Locators over Hard Failures',
      body: 'When a primary locator fails, the framework tries fallback strategies in order (Id → CSS → XPath → LinkText). Successful fallbacks are cached. The team gets a warning log to fix the selector, but the test stays green.',
    },
    {
      title: 'Cosine Similarity as Default over Embeddings',
      body: 'Embedding-based similarity is more accurate but requires an API call per comparison. Cosine similarity on TF-IDF vectors is deterministic, free, and fast enough for most non-deterministic assertions. Embeddings are available when accuracy matters more than speed.',
    },
    {
      title: 'Threshold-Based Assertions over Exact Match',
      body: 'LLMs are non-deterministic. Asserting response.Content == expected will always fail. Instead, we assert SimilarityScore >= 0.7. This is the fundamental shift from traditional testing to AI validation.',
    },
    {
      title: 'Medical AI as Separate Validator',
      body: 'Medical outputs have the highest stakes — wrong information can cause physical harm. The MedicalAIValidator runs 6 specialized checks that general validators don\'t: disclaimer enforcement, dosage detection, diagnosis blocking. This isn\'t gold plating; it\'s risk mitigation.',
    },
    {
      title: 'Config over Code for Everything',
      body: 'Switching browsers, environments, LLM models, similarity thresholds, or toxicity categories requires a JSON change or environment variable. Zero code changes, zero recompilation. CI can override anything with AF_Section__Key=value.',
    },
  ];

  const faqs = [
    {
      q: 'Why build a unified framework instead of separate tools?',
      a: 'Real enterprise teams don\'t run three separate frameworks for web, mobile, and desktop. They need shared config, shared reporting, shared utilities. This framework proves I can design systems-level architecture — not just write isolated test scripts.',
    },
    {
      q: 'How does the AI validation module work without an API key?',
      a: 'The similarity engine (Cosine, Jaccard) works locally with zero API calls. Consistency tests, toxicity scanning, and hallucination detection against the knowledge base all work offline. The LLM client is only needed for embedding-based similarity, LLM-as-judge safety checks, and live prompt testing.',
    },
    {
      q: 'Why is medical AI validation separate from general safety?',
      a: 'General safety checks (toxicity, hate speech) are necessary but not sufficient for medical AI. A response can be non-toxic but still dangerous — "Take 500mg of ibuprofen every 4 hours" is polite, non-toxic, and potentially harmful to a child. The medical validator catches what general safety misses.',
    },
    {
      q: 'How does hallucination detection work?',
      a: 'The response is split into individual factual claims (sentence-level). Each claim is compared against entries in the knowledge base using the similarity engine. Claims below 0.4 similarity to any source are flagged as unsupported. The overall hallucination rate (% unsupported claims) determines pass/fail.',
    },
    {
      q: 'What makes this portfolio-worthy vs. a tutorial project?',
      a: 'Three things: (1) System design — DI container, config resolution, ThreadLocal isolation, self-healing locators. (2) AI validation depth — not just "call OpenAI and check non-empty", but hallucination detection, bias testing, medical safety, and non-deterministic scoring. (3) Production patterns — structured logging, layered config, CI/CD pipelines, retry with exponential backoff.',
    },
  ];

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-hidden">
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-pink via-cyber-violet to-cyber-cyan z-50 origin-left"
        style={{ scaleX }}
      />

      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      <div className="relative z-10">
        {/* ── Navigation ───────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-black/60 border border-cyber-pink/50 text-cyber-pink rounded-lg hover:bg-cyber-pink/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Portfolio
            </Link>
            <a
              href="https://github.com/adityadeoli"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-pink text-white rounded-lg hover:opacity-90 transition-opacity cyber-glow"
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
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center gap-4 mb-8"
            >
              <BrainCircuit className="w-8 h-8 text-cyber-pink animate-pulse" />
              <TestTubes className="w-8 h-8 text-cyber-violet animate-pulse" />
              <HeartPulse className="w-8 h-8 text-cyber-cyan animate-pulse" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 cyber-text animate-flicker">
              Unified Automation + AI Validation
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              Cross-Platform Framework with AI/ML Testing Engine
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              An enterprise-grade C#/.NET 8 framework that unifies Web, Mobile, and Desktop automation
              with a dedicated AI/ML validation module — hallucination detection, bias testing,
              medical AI safety, and non-deterministic output scoring.
            </p>

            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <a
                href="https://github.com/adityadeoli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-cyber-pink text-white rounded-md hover:opacity-90 transition-opacity cyber-glow flex items-center gap-2 text-lg"
              >
                <Code2 className="w-5 h-5" />
                View Source Code
              </a>
              <Link
                to="/projects/stryker-compliance-template"
                className="px-8 py-3 border-2 border-cyber-cyan text-cyber-cyan rounded-md hover:bg-cyber-cyan hover:text-cyber-black transition-colors flex items-center gap-2 text-lg"
              >
                <ClipboardCheck className="w-5 h-5" />
                Compliance Template
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'C# Source Files', value: '48+' },
                { label: 'AI Validators', value: '7' },
                { label: 'Platforms', value: '4' },
                { label: 'Test Suites', value: '12' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="bg-cyber-black/50 backdrop-blur rounded-lg p-4 cyber-border"
                >
                  <div className="text-2xl font-bold text-cyber-pink font-mono">
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
                    <strong className="text-cyber-pink">AI testing is the next frontier.</strong>{' '}
                    Traditional automation validates deterministic outputs. AI produces
                    different answers every time. This framework bridges both worlds — proving
                    I can design systems that validate non-deterministic, high-stakes AI outputs.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">Medical AI demands rigor.</strong>{' '}
                    When an AI chatbot tells someone to stop their medication, people get hurt.
                    The medical validator enforces disclaimers, blocks dangerous advice patterns,
                    and flags hallucinated claims against a knowledge base. This is QA for
                    life-critical systems.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">Unified architecture at enterprise scale.</strong>{' '}
                    Web, Mobile, Desktop, and AI testing share config, logging, reporting, DI,
                    and retry infrastructure. One framework, four platforms, one codebase.
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
            9 capabilities across 4 platforms — from Selenium page objects to hallucination detection.
          </p>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
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
            Five-layer architecture from infrastructure to AI validation.
          </p>
          <div className="max-w-3xl mx-auto">
            <ArchitectureDiagram />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-8 bg-cyber-black/40 rounded-xl p-6 border border-cyber-pink/20"
          >
            <h4 className="text-lg font-bold text-cyber-cyan mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              AI Validation Flow
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                'Send prompt to LLM',
                'Validate not empty',
                'Score similarity',
                'Check toxicity',
                'Detect hallucinations',
                'Run bias analysis',
                'Generate report',
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <span className="px-3 py-1 bg-cyber-black/60 text-gray-300 rounded border border-gray-700">
                    {step}
                  </span>
                  {i < 6 && <ArrowRight className="w-4 h-4 text-cyber-pink/50 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ── AI Validation Deep Dive ────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            AI Validation Deep Dive
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Three validation engines covering accuracy, safety, and medical compliance.
          </p>

          <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
            {aiValidationModules.map((group, i) => (
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
            Production tooling chosen for enterprise reliability, not resume padding.
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
                  <span className="text-cyber-pink">{group.icon}</span>
                  <h3 className="text-lg font-bold text-cyber-cyan">{group.category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 bg-cyber-black/30 text-gray-300 border border-cyber-pink/30 rounded-md text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
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
            Real tradeoffs with real reasoning. Every choice has a "why."
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
                <h3 className="text-lg font-bold text-cyber-pink mb-3">
                  {decision.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{decision.body}</p>
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
                className="border border-cyber-pink/30 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full px-6 py-4 bg-cyber-black/30 flex items-center justify-between text-left hover:bg-cyber-pink/10 transition-colors"
                >
                  <span className="text-lg font-semibold text-cyber-cyan">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="w-5 h-5 text-cyber-pink flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-cyber-pink flex-shrink-0" />
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
                title: 'Non-Determinism Changes Everything',
                text: 'Traditional testing asserts exact equality. AI testing asserts similarity thresholds. This one shift — from assertEquals to assertSimilar — fundamentally changes how you design test architecture, reporting, and failure analysis.',
                icon: <BrainCircuit className="w-6 h-6 text-cyber-pink" />,
              },
              {
                title: 'Medical AI Safety is Non-Negotiable',
                text: 'A toxicity checker that says "response is not hateful" is useless for medical AI. "Take 500mg every 4 hours" is polite, non-toxic, and potentially lethal for a child. Domain-specific validators are not optional — they\'re the entire point.',
                icon: <HeartPulse className="w-6 h-6 text-cyber-cyan" />,
              },
              {
                title: 'Cross-Platform Requires Systems Thinking',
                text: 'Making Selenium, Appium, and FlaUI share config, logging, and reporting is a design problem, not a coding problem. The DriverFactory pattern with ThreadLocal isolation is the architecture that makes it work.',
                icon: <Settings className="w-6 h-6 text-cyber-violet" />,
              },
              {
                title: 'Self-Healing Saves Maintenance Time',
                text: 'A single CSS selector change in a React refactor can break 30 tests. Self-healing locators with fallback chains absorb the impact. The team gets a log warning to fix it, but CI stays green while they do.',
                icon: <Zap className="w-6 h-6 text-cyber-pink" />,
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
              48+ C# files, 7 AI validators, 4 platforms — open source and interview-ready.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://github.com/adityadeoli"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-cyber-pink text-white rounded-md hover:opacity-90 transition-opacity cyber-glow flex items-center gap-2"
              >
                <Code2 className="w-5 h-5" />
                GitHub Repository
              </a>
              <Link
                to="/projects/stryker-compliance-template"
                className="px-8 py-3 bg-cyber-violet text-white rounded-md hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <ClipboardCheck className="w-5 h-5" />
                Compliance Template
              </Link>
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
