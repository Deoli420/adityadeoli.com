import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Shield,
  Zap,
  Eye,
  AlertTriangle,
  BarChart3,
  Clock,
  Lock,
  Globe,
  Terminal,
  Database,
  Cpu,
  Layers,
  TrendingUp,
  Bell,
  Code2,
  Server,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Brain,
  Bug,
  FileSearch,
  ShieldAlert,
  FileCode,
  Gauge,
} from 'lucide-react';

/* ── Animated counter hook ─────────────────────────────────────────────── */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, trigger: () => setStarted(true) };
}

/* ── Architecture diagram (ASCII-style) ───────────────────────────────── */
const ArchitectureDiagram: React.FC = () => {
  const layers = [
    {
      label: 'Monitoring Layer',
      color: 'cyber-cyan',
      items: ['Scheduled Probes', 'Contract Validation', 'Credential Scanning'],
    },
    {
      label: 'Analysis Engine',
      color: 'cyber-violet',
      items: ['AI Anomaly Detection', '6-Signal Risk Scoring', 'Schema Drift Tracking'],
    },
    {
      label: 'Security & Intelligence',
      color: 'cyber-pink',
      items: ['12-Pattern Leak Scanner', 'AI Debug Assistant', 'OpenAPI Compliance'],
    },
    {
      label: 'Alert & Incident Pipeline',
      color: 'cyber-cyan',
      items: ['7 Alert Conditions', 'Auto-Create/Resolve Incidents', 'n8n Webhooks'],
    },
    {
      label: 'Dashboard, CLI & API',
      color: 'cyber-violet',
      items: ['React 19 SPA', '75+ REST Endpoints', 'Sentinel CLI (CI/CD)'],
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
export const SentinelAILanding: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <Eye className="w-7 h-7" />,
      title: 'Real-Time Monitoring',
      description:
        'Automated health probes hit your endpoints on a configurable schedule. Track response times, status codes, and schema changes — with WebSocket live updates and adaptive polling.',
      color: 'cyber-cyan',
    },
    {
      icon: <AlertTriangle className="w-7 h-7" />,
      title: 'AI Anomaly Detection',
      description:
        'Cost-gated LLM analysis flags abnormal latency spikes, unexpected status codes, and response deviations. Every run is scored against a rolling baseline — the AI is only invoked when signals warrant it ($0 when healthy).',
      color: 'cyber-violet',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: '6-Signal Risk Scoring',
      description:
        'Each endpoint receives a composite risk score (0-100) computed from status, performance, schema drift, AI severity, security findings, and failure history. Scores feed into four-tier severity: LOW → MEDIUM → HIGH → CRITICAL.',
      color: 'cyber-pink',
    },
    {
      icon: <ShieldAlert className="w-7 h-7" />,
      title: 'Credential Leak Detection',
      description:
        '12-pattern regex scanner detects AWS keys, JWTs, private keys, Stripe tokens, passwords, and connection strings leaked in API responses. Findings feed directly into the risk score with severity-weighted impact.',
      color: 'cyber-cyan',
    },
    {
      icon: <Bug className="w-7 h-7" />,
      title: 'AI Debug Assistant',
      description:
        'On-demand LLM-powered debugging generates step-by-step remediation playbooks. Gathers full context — last 10 runs, anomaly history, SLA status — and returns a structured diagnosis with root cause analysis.',
      color: 'cyber-violet',
    },
    {
      icon: <FileCode className="w-7 h-7" />,
      title: 'API Contract Testing',
      description:
        'Upload an OpenAPI 3.x spec per endpoint. The pipeline validates every response — checking documented status codes, required fields, type compliance, and $ref resolution up to 5 levels deep.',
      color: 'cyber-pink',
    },
    {
      icon: <Brain className="w-7 h-7" />,
      title: 'AI Telemetry & FinOps',
      description:
        'Every LLM call tracked: prompt tokens, completion tokens, latency, cost in USD. Per-model rate tables (gpt-4o-mini, gpt-4o) power a FinOps dashboard with daily breakdowns and per-endpoint usage.',
      color: 'cyber-cyan',
    },
    {
      icon: <Terminal className="w-7 h-7" />,
      title: 'Sentinel CLI & CI/CD',
      description:
        'Standalone Python CLI (Click + Rich + httpx) for CI/CD integration. Run monitoring probes from GitHub Actions, export CSVs, manage incidents — all from the command line with stored credentials.',
      color: 'cyber-violet',
    },
    {
      icon: <Bell className="w-7 h-7" />,
      title: '7-Condition Alert Rules',
      description:
        'Per-endpoint alert rules with 7 condition types: latency, failure count, status code, schema change, risk threshold, SLA breach, and credential leak. Stateful consecutive-match tracking with n8n webhook dispatch.',
      color: 'cyber-pink',
    },
  ];

  const techStack = [
    { category: 'Backend', items: ['Python 3.12', 'FastAPI', 'SQLAlchemy 2.0', 'Alembic', 'PostgreSQL 16'], icon: <Server className="w-5 h-5" /> },
    { category: 'Frontend', items: ['React 19', 'TypeScript', 'Tailwind CSS v4', 'React Query v5', 'Zustand v5'], icon: <Code2 className="w-5 h-5" /> },
    { category: 'AI & LLM', items: ['OpenAI gpt-4o-mini', 'Cost-Gated Calls', 'Token Telemetry', 'Debug Playbooks', 'Anomaly Analysis'], icon: <Brain className="w-5 h-5" /> },
    { category: 'Security', items: ['JWT + Refresh Rotation', 'SSRF Protection', '12-Pattern Cred Scanner', 'CSP Headers', 'Account Lockout'], icon: <Lock className="w-5 h-5" /> },
    { category: 'Infrastructure', items: ['Docker Compose', 'Nginx', 'Let\'s Encrypt TLS', 'n8n Workflows', 'DigitalOcean'], icon: <Database className="w-5 h-5" /> },
    { category: 'DevOps & CLI', items: ['Sentinel CLI (Click)', '10 Alembic Migrations', 'GitHub Actions CI', 'Multi-Stage Docker', 'HSTS + Gzip'], icon: <Terminal className="w-5 h-5" /> },
  ];

  const metrics = [
    { value: 14, suffix: '', label: 'Pipeline Steps', description: 'Probe → scan → detect → score → alert' },
    { value: 12, suffix: '', label: 'Scan Patterns', description: 'AWS, JWT, Stripe, passwords, and more' },
    { value: 6, suffix: '', label: 'Risk Signals', description: 'Status, perf, drift, AI, security, history' },
    { value: 10, suffix: '', label: 'DB Migrations', description: '16 tables across 10 Alembic versions' },
  ];

  const securityFeatures = [
    { label: 'Credential Leak Detection', status: true, detail: '12-pattern regex scanner for AWS keys, JWTs, private keys, Stripe tokens, passwords in API responses' },
    { label: 'SSRF Protection', status: true, detail: 'DNS resolution check against RFC 1918 + cloud metadata (169.254.169.254)' },
    { label: 'Rate Limiting', status: true, detail: '50 req/s global, 5/min on login endpoint' },
    { label: 'HSTS Enabled', status: true, detail: 'max-age=31536000 with includeSubDomains' },
    { label: 'Content Security Policy', status: true, detail: 'Strict CSP blocking inline scripts & external resources' },
    { label: 'httpOnly Cookies', status: true, detail: 'Refresh tokens stored in Secure, SameSite=Strict cookies' },
    { label: 'Bcrypt Hashing', status: true, detail: '12 rounds — industry-standard password storage' },
    { label: 'Account Lockout', status: true, detail: '5 failed attempts → 15-minute lockout with audit trail' },
    { label: 'OpenAPI Contract Validation', status: true, detail: 'Upload specs and validate every API response for type mismatches and missing fields' },
    { label: 'Cascade Delete Safety', status: true, detail: 'Endpoint deletion cascades through runs, anomalies, risk scores, findings' },
  ];

  const faqs = [
    {
      q: 'Why did I build SentinelAI?',
      a: 'As a QA engineer, I\'ve seen production incidents that could have been prevented with better API monitoring. SentinelAI is my answer — a platform that doesn\'t just check if endpoints are up, but actively scores their risk across 6 dimensions, scans for credential leaks, validates API contracts, and alerts you before users notice problems.',
    },
    {
      q: 'How does the 6-signal risk scoring work?',
      a: 'Each API run produces a composite score (0-100) from 6 weighted signals: HTTP status (30%), performance deviation (20%), schema drift (15%), AI severity (15%), security findings (15%), and failure history (5%). Security uses severity-weighted counts — a single leaked AWS key has more impact than several generic secrets. Scores map to four tiers: LOW → MEDIUM → HIGH → CRITICAL.',
    },
    {
      q: 'How does credential leak detection work?',
      a: 'The pipeline runs 12 regex patterns against every API response body — detecting AWS keys (AKIA...), JWTs (eyJ...), private keys, GitHub/GitLab/Slack tokens, passwords in JSON fields, connection strings with credentials, Stripe keys, and more. Findings are persisted with redacted previews and feed directly into the risk score.',
    },
    {
      q: 'What is the AI debug assistant?',
      a: 'When an anomaly is detected (severity ≥ 40), users can trigger an AI analysis that gathers the last 10 runs, SLA status, alert rules, and anomaly history — then generates a structured diagnosis with step-by-step remediation playbook, root cause analysis, and related patterns. Each call is tracked via AI telemetry for cost visibility.',
    },
    {
      q: 'How does contract testing work?',
      a: 'Upload an OpenAPI 3.x spec per endpoint and the pipeline validates every response against it — checking status codes are documented, required fields are present, types match the schema, with recursive $ref resolution up to 5 levels deep. Violations are categorized by severity and displayed alongside other findings.',
    },
    {
      q: 'Can I use SentinelAI in CI/CD?',
      a: 'Yes — the Sentinel CLI (pip install) lets you run monitoring probes from GitHub Actions, export data, and manage incidents from the terminal. A GitHub Actions workflow template is included. The CI endpoint accepts endpoint names (not just UUIDs) for human-friendly YAML configuration.',
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
              href="https://sentinelai.adityadeoli.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-violet text-white rounded-lg hover:bg-cyber-purple transition-colors cyber-glow"
            >
              Live Dashboard
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
            {/* Logo / icon cluster */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center gap-4 mb-8"
            >
              <Activity className="w-8 h-8 text-cyber-violet animate-pulse" />
              <Shield className="w-8 h-8 text-cyber-cyan animate-pulse" />
              <Eye className="w-8 h-8 text-cyber-pink animate-pulse" />
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 cyber-text animate-flicker">
              SentinelAI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 leading-relaxed">
              Intelligent API Monitoring & Risk Scoring Platform
            </p>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              A full-stack production system I built from scratch — monitoring API health,
              detecting anomalies with AI, scanning for credential leaks, validating API contracts,
              computing 6-signal risk scores, and alerting teams before outages reach users.
              Includes a CLI for CI/CD integration and an AI debug assistant.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <a
                href="https://sentinelai.adityadeoli.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center gap-2 text-lg"
              >
                <Globe className="w-5 h-5" />
                View Live Dashboard
              </a>
              <a
                href="https://github.com/deoli420"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border-2 border-cyber-cyan text-cyber-cyan rounded-md hover:bg-cyber-cyan hover:text-cyber-black transition-colors cyber-glow flex items-center gap-2 text-lg"
              >
                <Code2 className="w-5 h-5" />
                Source Code
              </a>
            </div>

            {/* Quick stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Lines of Code', value: '28,000+' },
                { label: 'API Endpoints', value: '75+' },
                { label: 'React Components', value: '56+' },
                { label: 'DB Tables', value: '16' },
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
              The Problem I Solved
            </h2>
            <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">Blind spots in production.</strong>{' '}
                    Teams ship APIs but rely on users to report outages. By the time a 500 error
                    hits a Slack channel, hundreds of requests have already failed.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">No risk context.</strong>{' '}
                    Existing uptime tools tell you "it's down" — but they don't tell you
                    <em> how risky</em> an endpoint has become over time based on latency trends,
                    failure rates, and anomaly patterns.
                  </p>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">
                    <strong className="text-cyber-pink">Security as an afterthought.</strong>{' '}
                    Most monitoring dashboards lack tenant isolation, proper auth, and SSRF
                    protection on proxy features — leaving infrastructure exposed.
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
            Every feature designed, architected, and implemented by me — from database schema to pixel-perfect UI.
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
            Five-layer pipeline from probe execution to user-facing alerts.
          </p>
          <div className="max-w-3xl mx-auto">
            <ArchitectureDiagram />
          </div>

          {/* Data flow summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto mt-8 bg-cyber-black/40 rounded-xl p-6 border border-cyber-violet/20"
          >
            <h4 className="text-lg font-bold text-cyber-cyan mb-3 flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Request Lifecycle
            </h4>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                'Scheduler fires probe',
                'httpx async request',
                'Response captured',
                'Credential scan (12 patterns)',
                'Contract validation (OpenAPI)',
                'AI anomaly detection',
                '6-signal risk scoring',
                'Alert rules + incidents',
                'WebSocket broadcast',
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <span className="px-3 py-1 bg-cyber-black/60 text-gray-300 rounded border border-gray-700">
                    {step}
                  </span>
                  {i < 8 && <ArrowRight className="w-4 h-4 text-cyber-violet/50 flex-shrink-0" />}
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
            Production-grade tooling chosen for performance, type safety, and developer experience.
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

        {/* ── Security Audit ────────────────────────────────────────────── */}
        <section className="container mx-auto px-4 py-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-center mb-4 cyber-text animate-flicker"
          >
            Security Posture
          </motion.h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
            Security isn't bolted on — it's baked into every layer.
          </p>

          <div className="max-w-3xl mx-auto bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <div className="space-y-4">
              {securityFeatures.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 p-3 rounded-lg hover:bg-cyber-black/40 transition-colors"
                >
                  {item.status ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-white font-medium">{item.label}</span>
                    <p className="text-sm text-gray-400 mt-0.5">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
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
            The "why" behind the architecture — real tradeoffs, not textbook answers.
          </p>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                title: 'Cost-Gated AI — $0 When Healthy',
                body: 'The LLM is only invoked when rule-based signals detect anomalies. Zero signals = zero API calls. This keeps monitoring costs proportional to actual issues, not monitoring volume. Every call is tracked with token counts and USD cost for full FinOps visibility.',
              },
              {
                title: '6-Signal Deterministic Risk Scoring',
                body: 'Risk scores are computed from a weighted formula (status 30%, performance 20%, drift 15%, AI 15%, security 15%, history 5%) — no ML, no model drift. Same inputs always produce the same output. Users see exactly which component drives their score in the UI breakdown.',
              },
              {
                title: 'Same-Origin Serving over Separate Frontend Deploy',
                body: 'nginx serves both the React SPA and proxies /api on the same domain. This eliminates CORS complexity entirely and lets httpOnly cookies work with SameSite=Strict — the most secure cookie policy available.',
              },
              {
                title: 'Severity-Weighted Security Scoring',
                body: 'A single CRITICAL credential leak (AWS key) contributes more to the risk score than several MEDIUM findings (generic secrets). Multipliers: CRITICAL=1.0, HIGH=0.7, MEDIUM=0.4 — so severity matters more than volume.',
              },
              {
                title: 'OpenAPI Spec Co-located with Endpoints',
                body: 'The OpenAPI spec is stored as JSONB directly on the api_endpoints table — no join needed for contract validation. Suffix-based path matching handles URL differences, so /api/v1/users matches the spec path /users.',
              },
              {
                title: 'Repository Pattern over Raw SQL',
                body: 'Every database operation goes through a repository class with mandatory tenant_id. This makes tenant-scoping auditable (grep for organization_id in one directory), testable (mock the repo, not the DB), and migration-safe.',
              },
            ].map((decision, i) => (
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
                title: 'Cost-Gating AI is Essential',
                text: 'Calling an LLM on every healthy API probe would burn through budget fast. The cost-gating pattern — only invoke AI when rule-based signals detect anomalies — keeps costs proportional to actual issues. AI telemetry tracking makes spend fully visible.',
                icon: <Brain className="w-6 h-6 text-cyber-violet" />,
              },
              {
                title: 'Multi-Tenancy Touches Everything',
                text: 'Adding organization_id isn\'t just a column — it changes every query, every service method, every API response. With 16 tables across 10 migrations, miss one filter and you have a data leak.',
                icon: <Database className="w-6 h-6 text-cyber-cyan" />,
              },
              {
                title: 'Security Scanners Need Precision',
                text: 'Regex-based credential scanning requires careful pattern design. Too broad and you get false positives on every response; too narrow and you miss real leaks. Severity-weighted scoring ensures critical findings (AWS keys) outweigh minor ones.',
                icon: <ShieldAlert className="w-6 h-6 text-cyber-pink" />,
              },
              {
                title: 'Pipeline Extensibility Matters',
                text: 'The monitoring pipeline grew from 7 steps to 14, adding credential scanning, contract validation, schema snapshots, and more. The try/except isolation pattern for each step ensures one failure doesn\'t cascade — each step is independent.',
                icon: <Layers className="w-6 h-6 text-cyber-violet" />,
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

      </div>
    </div>
  );
};
