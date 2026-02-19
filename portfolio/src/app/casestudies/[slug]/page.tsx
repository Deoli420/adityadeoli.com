import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCaseStudyBySlug, caseStudies } from '@/data/casestudies';
import { CaseStudyDetail } from '@/components/casestudy/CaseStudyDetail';

interface CaseStudyPageProps {
  params: {
    slug: string;
  };
}

export async function generateStaticParams() {
  return caseStudies.map((study) => ({
    slug: study.slug,
  }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const caseStudy = getCaseStudyBySlug(params.slug);
  
  if (!caseStudy) {
    return {
      title: 'Case Study Not Found',
    };
  }

  return {
    title: `${caseStudy.title} | Aditya Deoli`,
    description: caseStudy.subtitle,
    keywords: caseStudy.domain.join(', '),
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.subtitle,
      type: 'article',
    },
  };
}

export default function CaseStudyPage({ params }: CaseStudyPageProps) {
  const caseStudy = getCaseStudyBySlug(params.slug);
  
  if (!caseStudy) {
    notFound();
  }

  return <CaseStudyDetail caseStudy={caseStudy} />;
}