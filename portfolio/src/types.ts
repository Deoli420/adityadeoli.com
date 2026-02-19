export interface Project {
  title: string;
  duration: string;
  description: string;
  tools: string[];
  challenges: string[];
  contributions: string[];
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  achievements: string[];
}

export interface Skill {
  name: string;
  category: string;
  description: string;
  tools: string[];
  level: number;
  isPrimary: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  link?: string;
}

export interface Stats {
  bugsUncovered: number;
  uptime: number;
  automatedTests: number;
  majorReleases: number;
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}