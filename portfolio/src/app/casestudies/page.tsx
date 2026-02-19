import React from 'react';
import { Metadata } from 'next';
import { CaseStudiesList } from '@/components/casestudy/CaseStudiesList';

export const metadata: Metadata = {
  title: 'Case Studies | Aditya Deoli - QA Engineer',
  description: 'Deep-dive case studies showcasing QA engineering and technical product management work on Web3 infrastructure, identity systems, and growth platforms.',
  keywords: 'QA Engineering, Web3, Case Studies, Product Management, Blockchain Testing, Infrastructure',
  openGraph: {
    title: 'Case Studies | Aditya Deoli - QA Engineer',
    description: 'Deep-dive case studies showcasing QA engineering and technical product management work on Web3 infrastructure.',
    type: 'website',
  },
};

export default function CaseStudiesPage() {
  return <CaseStudiesList />;
}