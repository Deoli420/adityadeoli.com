import { Activity, TestTubes, BrainCircuit } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface FeaturedProject {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  accentColor: 'cyber-cyan' | 'cyber-violet' | 'cyber-pink';
  icon: LucideIcon;
  detailPath: string;
  githubUrl: string;
  liveUrl?: string;
  metrics: { label: string; value: string }[];
  techHighlights: string[];
  highlights: string[];
}

export const featuredProjects: FeaturedProject[] = [
  {
    slug: 'sentinelai',
    title: 'SentinelAI',
    tagline: 'Intelligent API Monitoring, Security Scanning & Risk Scoring',
    description:
      'Full-stack production platform — monitors API health, detects anomalies with AI, scans for credential leaks, validates API contracts against OpenAPI specs, computes 6-signal risk scores, and includes a CLI for CI/CD integration.',
    accentColor: 'cyber-violet',
    icon: Activity,
    detailPath: '/projects/sentinelai',
    githubUrl: 'https://github.com/deoli420',
    liveUrl: 'https://sentinelai.adityadeoli.com',
    metrics: [
      { label: 'Lines of Code', value: '28,000+' },
      { label: 'API Endpoints', value: '75+' },
      { label: 'React Components', value: '56+' },
      { label: 'DB Tables', value: '16' },
    ],
    techHighlights: ['Python', 'FastAPI', 'React 19', 'PostgreSQL', 'Docker', 'OpenAI'],
    highlights: [
      '6-signal risk scoring with credential leak detection (12 regex patterns) and AI anomaly analysis',
      'API contract testing (OpenAPI 3.x), AI debug assistant, and FinOps telemetry dashboard',
      'Sentinel CLI for CI/CD integration with GitHub Actions workflow templates',
    ],
  },
  {
    slug: 'automation-framework',
    title: 'E2E Automation Framework',
    tagline: 'Production-Grade Test Architecture',
    description:
      'Complete automation framework built from scratch — UI testing with Selenium, API validation, performance testing with JMeter, Dockerized execution, and CI/CD pipeline.',
    accentColor: 'cyber-cyan',
    icon: TestTubes,
    detailPath: '/projects/automation-framework',
    githubUrl: 'https://github.com/Deoli420/automation-framework',
    metrics: [
      { label: 'Test Cases', value: '68' },
      { label: 'Page Objects', value: '4' },
      { label: 'API Services', value: '3' },
      { label: 'CI Jobs', value: '3' },
    ],
    techHighlights: ['Python', 'Selenium', 'PyTest', 'Docker', 'GitHub Actions', 'JMeter'],
    highlights: [
      'Page Object Model with real DOM selectors, explicit waits, and Allure reporting',
      'Parametrized + negative/boundary tests across UI, API, and performance layers',
      'Pre-built scaling path: Standalone → Grid → K8s with zero code changes',
    ],
  },
  {
    slug: 'unified-automation-ai',
    title: 'Unified Automation + AI Validation',
    tagline: 'Cross-Platform Framework with AI/ML Testing',
    description:
      'Enterprise-grade C#/.NET 8 framework unifying Web (Selenium), Mobile (Appium), and Desktop (FlaUI) automation with a dedicated AI/ML validation module — hallucination detection, bias testing, medical AI safety, and non-deterministic output scoring.',
    accentColor: 'cyber-pink',
    icon: BrainCircuit,
    detailPath: '/projects/unified-automation-ai',
    githubUrl: 'https://github.com/Deoli420/unified-automation-ai',
    metrics: [
      { label: 'C# Source Files', value: '48+' },
      { label: 'AI Validators', value: '7' },
      { label: 'Platforms', value: '4' },
      { label: 'Test Suites', value: '12' },
    ],
    techHighlights: ['C#', '.NET 8', 'Selenium', 'Appium', 'FlaUI', 'NUnit', 'Serilog', 'OpenAI API'],
    highlights: [
      'Self-healing locators with fallback chains and cached healing for zero-flake tests',
      'Medical AI validator: disclaimer enforcement, hallucination detection, dangerous pattern blocking',
      'Cosine/Jaccard/Embedding similarity engine for non-deterministic LLM output scoring',
    ],
  },
];
