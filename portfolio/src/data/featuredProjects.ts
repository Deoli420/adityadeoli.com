import { Activity, TestTubes } from 'lucide-react';
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
    tagline: 'Intelligent API Monitoring & Risk Scoring',
    description:
      'Full-stack production platform that monitors API health, detects anomalies in real time, computes risk scores, and alerts teams before outages reach users.',
    accentColor: 'cyber-violet',
    icon: Activity,
    detailPath: '/projects/sentinelai',
    githubUrl: 'https://github.com/adityadeoli',
    liveUrl: 'https://sentinelai.adityadeoli.com',
    metrics: [
      { label: 'Lines of Code', value: '12,000+' },
      { label: 'API Endpoints', value: '25+' },
      { label: 'React Components', value: '40+' },
      { label: 'Risk Tiers', value: '4' },
    ],
    techHighlights: ['Python', 'FastAPI', 'React', 'PostgreSQL', 'Docker', 'n8n'],
    highlights: [
      'Composite risk scoring (0-100) with statistical anomaly detection',
      'Multi-tenant JWT auth with refresh token rotation and RBAC',
      'Server-side proxy with SSRF protection for CORS-free monitoring',
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
      { label: 'Test Cases', value: '34' },
      { label: 'Page Objects', value: '4' },
      { label: 'API Services', value: '3' },
      { label: 'CI Jobs', value: '3' },
    ],
    techHighlights: ['Python', 'Selenium', 'PyTest', 'Docker', 'GitHub Actions', 'JMeter'],
    highlights: [
      'Page Object Model with DriverFactory pattern and function-scoped isolation',
      'Three-layer testing: UI, API validation, and performance benchmarks',
      'Pre-built scaling path: Standalone → Grid → K8s with zero code changes',
    ],
  },
];
