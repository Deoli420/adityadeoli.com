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
      items: ['Scheduled Probes', 'Multi-Region Pings', 'SSL / DNS Checks'],
    },
    {
      label: 'Analysis Engine',
      color: 'cyber-violet',
      items: ['Anomaly Detection', 'Risk Scoring (0-100)', 'Failure-Rate Tracking'],
    },
    {
      label: 'Alert Pipeline',
      color: 'cyber-pink',
      items: ['n8n Webhooks', 'Threshold Rules', 'Escalation Chains'],
    },
    {
      label: 'Dashboard & API',
      color: 'cyber-cyan',
      items: ['React SPA', 'FastAPI REST', 'JWT + RBAC Auth'],
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
        'Automated health probes hit your endpoints on a configurable schedule. Track response times, status codes, SSL validity, and DNS resolution — all from a single dashboard.',
      color: 'cyber-cyan',
    },
    {
      icon: <AlertTriangle className="w-7 h-7" />,
      title: 'Anomaly Detection',
      description:
        'Statistical analysis flags abnormal latency spikes, unexpected status codes, and response-body deviations. Every run is scored against a rolling baseline so you catch regressions before users do.',
      color: 'cyber-violet',
    },
    {
      icon: <Shield className="w-7 h-7" />,
      title: 'Risk Scoring Engine',
      description:
        'Each endpoint receives a composite risk score (0-100) computed from latency percentiles, failure rates, anomaly frequency, and certificate expiry. Scores feed into a four-tier severity system: LOW → MEDIUM → HIGH → CRITICAL.',
      color: 'cyber-pink',
    },
    {
      icon: <Bell className="w-7 h-7" />,
      title: 'Intelligent Alerting',
      description:
        'Configurable alert rules powered by n8n webhook integrations. Set thresholds per-endpoint, define escalation chains, and get notified through Slack, email, or any webhook-compatible service.',
      color: 'cyber-cyan',
    },
    {
      icon: <Lock className="w-7 h-7" />,
      title: 'Multi-Tenant Auth & RBAC',
      description:
        'JWT access tokens with httpOnly refresh-token rotation. Organization-level data isolation ensures tenants never see each other\'s data. Three roles — Admin, Member, Viewer — with granular route-level enforcement.',
      color: 'cyber-violet',
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'Server-Side Proxy',
      description:
        'Test any API directly from the dashboard without CORS headaches. Built-in SSRF protection blocks requests to private networks, cloud metadata endpoints, and localhost to keep your infrastructure safe.',
      color: 'cyber-pink',
    },
  ];

  const techStack = [
    { category: 'Backend', items: ['Python 3.12', 'FastAPI', 'SQLAlchemy 2.0', 'Alembic', 'PostgreSQL 16'], icon: <Server className="w-5 h-5" /> },
    { category: 'Frontend', items: ['React 18', 'TypeScript', 'Tailwind CSS v4', 'React Query', 'Zustand'], icon: <Code2 className="w-5 h-5" /> },
    { category: 'Auth & Security', items: ['JWT + Refresh Rotation', 'bcrypt', 'RBAC', 'SSRF Protection', 'CSP Headers'], icon: <Lock className="w-5 h-5" /> },
    { category: 'Infrastructure', items: ['Docker Compose', 'Nginx', 'Let\'s Encrypt TLS', 'n8n Workflows', 'DigitalOcean'], icon: <Database className="w-5 h-5" /> },
    { category: 'Monitoring', items: ['APScheduler', 'httpx Async', 'Statistical Baselines', 'Webhook Alerts', 'Risk Engine'], icon: <Activity className="w-5 h-5" /> },
    { category: 'DevOps', items: ['CI/CD Pipeline', 'Alembic Migrations', 'Multi-Stage Docker', 'Gzip + HTTP/2', 'HSTS'], icon: <Terminal className="w-5 h-5" /> },
  ];

  const metrics = [
    { value: 50, suffix: 'ms', label: 'Avg Probe Latency', description: 'Server-side measurement accuracy' },
    { value: 100, suffix: '%', label: 'Tenant Isolation', description: 'Zero cross-org data leakage' },
    { value: 4, suffix: '', label: 'Risk Tiers', description: 'LOW → MEDIUM → HIGH → CRITICAL' },
    { value: 15, suffix: 'min', label: 'Token Expiry', description: 'Short-lived JWTs with auto-refresh' },
  ];

  const securityFeatures = [
    { label: 'SSRF Protection', status: true, detail: 'DNS resolution check against RFC 1918 + cloud metadata' },
    { label: 'Rate Limiting', status: true, detail: '50 req/s global, 5/min on login endpoint' },
    { label: 'HSTS Enabled', status: true, detail: 'max-age=31536000 with includeSubDomains' },
    { label: 'Content Security Policy', status: true, detail: 'Strict CSP blocking inline scripts & external resources' },
    { label: 'httpOnly Cookies', status: true, detail: 'Refresh tokens stored in Secure, SameSite=Strict cookies' },
    { label: 'Bcrypt Hashing', status: true, detail: '12 rounds — industry-standard password storage' },
    { label: 'Account Lockout', status: true, detail: '5 failed attempts → 15-minute lockout with audit trail' },
    { label: 'Cascade Delete Safety', status: true, detail: 'Endpoint deletion cascades runs → anomalies → risk scores' },
  ];

  const faqs = [
    {
      q: 'Why did I build SentinelAI?',
      a: 'As a QA engineer, I\'ve seen production incidents that could have been prevented with better API monitoring. SentinelAI is my answer — a platform that doesn\'t just check if endpoints are up, but actively scores their risk and alerts you before users notice problems.',
    },
    {
      q: 'How does the risk scoring work?',
      a: 'Each API run produces a composite score from 0 (healthy) to 100 (critical). The engine factors in: response latency vs. rolling average, HTTP status code severity, failure rate over time, anomaly frequency, and SSL certificate expiry proximity. Scores are bucketed into four tiers that drive alert urgency.',
    },
    {
      q: 'What makes the multi-tenant architecture secure?',
      a: 'Every database query is scoped by organization_id — enforced at the repository layer, not just the API layer. JWT tokens embed the tenant context, and a FastAPI dependency extracts + validates it on every request. Refresh tokens use SHA-256 hashing with automatic rotation.',
    },
    {
      q: 'Can it monitor any API?',
      a: 'Yes — the server-side proxy bypasses CORS restrictions, so you can monitor third-party APIs, internal microservices, or any HTTP endpoint. SSRF protection ensures the proxy can\'t be abused to reach private networks or cloud metadata services.',
    },
    {
      q: 'What\'s the alerting pipeline?',
      a: 'SentinelAI integrates with n8n for flexible workflow automation. When a risk threshold is breached, a webhook fires into n8n which can route alerts to Slack, email, PagerDuty, or any custom integration. Alert rules are configurable per-endpoint.',
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
              A full-stack production system I built from scratch to monitor API health,
              detect anomalies in real time, compute risk scores, and alert teams
              before outages reach users.
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
                href="https://github.com/adityadeoli"
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
                { label: 'Lines of Code', value: '12,000+' },
                { label: 'API Endpoints', value: '25+' },
                { label: 'React Components', value: '40+' },
                { label: 'Alembic Migrations', value: '8+' },
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
            Four-layer pipeline from probe execution to user-facing alerts.
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
                'httpx sends async request',
                'Response captured (time, status, body)',
                'Anomaly detector runs statistical check',
                'Risk engine computes composite score',
                'Dashboard updates via React Query',
                'Alert fires if threshold breached',
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
                title: 'Same-Origin Serving over Separate Frontend Deploy',
                body: 'nginx serves both the React SPA and proxies /api on the same domain. This eliminates CORS complexity entirely and lets httpOnly cookies work with SameSite=Strict — the most secure cookie policy available.',
              },
              {
                title: 'Denormalized organization_id on api_runs',
                body: 'ApiRun stores organization_id even though it could be inferred via the parent endpoint. This denormalization lets me filter runs by tenant without joining through api_endpoints on every query — critical for dashboard performance.',
              },
              {
                title: 'Refresh Token Rotation over Long-Lived Access Tokens',
                body: 'Access tokens expire in 15 minutes. On 401, the frontend silently calls /auth/refresh, which rotates the refresh token (old one is revoked, new one issued). This limits the blast radius of a stolen token to minutes, not days.',
              },
              {
                title: 'Statistical Baselines over Fixed Thresholds',
                body: 'Rather than alerting on "latency > 1000ms", the anomaly detector compares each response against a rolling average. A 200ms endpoint spiking to 800ms is more concerning than a 2s endpoint hitting 2.2s.',
              },
              {
                title: 'Repository Pattern over Raw SQL',
                body: 'Every database operation goes through a repository class. This makes tenant-scoping auditable (grep for organization_id in one directory), testable (mock the repo, not the DB), and migration-safe.',
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
                title: 'Production Auth is Hard',
                text: 'Token rotation, race conditions on concurrent 401 retries, httpOnly cookie paths, lockout mechanics — each one has subtle failure modes that only surface under real load.',
                icon: <Lock className="w-6 h-6 text-cyber-violet" />,
              },
              {
                title: 'Multi-Tenancy Touches Everything',
                text: 'Adding organization_id isn\'t just a column — it changes every query, every service method, every API response. Miss one filter and you have a data leak.',
                icon: <Database className="w-6 h-6 text-cyber-cyan" />,
              },
              {
                title: 'nginx Header Inheritance is Brutal',
                text: 'Any add_header in a child location block silently drops ALL parent headers. I had to repeat security headers in every location context — a footgun I\'ll never forget.',
                icon: <Server className="w-6 h-6 text-cyber-pink" />,
              },
              {
                title: 'SSRF is a Real Threat',
                text: 'A proxy endpoint that lets users hit any URL is an SSRF vector. I added DNS resolution checks against RFC 1918 ranges, cloud metadata IPs, and blocked hostnames.',
                icon: <Shield className="w-6 h-6 text-cyber-violet" />,
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

