'use client';

import React, { useState, useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Share2, Copy, Clock, Users, DollarSign, Target, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { CaseStudy } from '@/data/casestudies';

interface CaseStudyDetailProps {
  caseStudy: CaseStudy;
}

export const CaseStudyDetail: React.FC<CaseStudyDetailProps> = ({ caseStudy }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [expandedTradeoffs, setExpandedTradeoffs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'problem', label: 'Problem' },
    { id: 'constraints', label: 'Constraints' },
    { id: 'role', label: 'My Role' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'tradeoffs', label: 'Tradeoffs' },
    { id: 'outcomes', label: 'Outcomes' },
    { id: 'improvements', label: 'Next Steps' },
    { id: 'why', label: 'Why This Matters' }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => 
        document.getElementById(section.id)
      ).filter(Boolean);

      const currentSection = sectionElements.find(element => {
        if (!element) return false;
        const rect = element.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTradeoff = (title: string) => {
    setExpandedTradeoffs(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const copyLink = async () => {
    try {
      const textToCopy = `${caseStudy.title}\n${window.location.href}`;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link');
    }
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`${caseStudy.title} - ${caseStudy.subtitle}`);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-cyber-violet z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      {/* Sticky Navigation */}
      <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden xl:block">
        <nav className="bg-cyber-black/80 backdrop-blur rounded-lg p-4 border border-cyber-violet/30">
          <div className="space-y-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`block px-2 py-1 text-xs rounded transition-colors ${
                  activeSection === section.id
                    ? 'bg-cyber-violet text-white'
                    : 'text-gray-400 hover:text-cyber-cyan'
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </nav>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10 xl:ml-auto xl:mr-8">
        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link
            to="/casestudies"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-black/60 border border-cyber-violet/50 text-cyber-violet rounded-lg hover:bg-cyber-violet/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Case Studies
          </Link>
          
          <div className="flex items-center gap-3">
            <button
              onClick={shareToLinkedIn}
              className="p-2 bg-cyber-black/60 border border-cyber-cyan/50 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/10 transition-colors"
              title="Share on LinkedIn"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={copyLink}
              className="p-2 bg-cyber-black/60 border border-cyber-violet/50 text-cyber-violet rounded-lg hover:bg-cyber-violet/10 transition-colors"
              title={copied ? "Copied!" : "Copy Link"}
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.section
          id="overview"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 cyber-text animate-flicker">
              {caseStudy.title}
            </h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {caseStudy.subtitle}
            </p>
            
            {/* Badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <span className="px-4 py-2 bg-cyber-violet/20 text-cyber-violet border border-cyber-violet/50 rounded-lg font-medium">
                {caseStudy.role}
              </span>
              <span className="px-4 py-2 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50 rounded-lg font-medium">
                {caseStudy.productType}
              </span>
              <span className="px-4 py-2 bg-cyber-black/50 text-gray-300 border border-gray-600 rounded-lg font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {caseStudy.timeline}
              </span>
            </div>
          </div>

          {/* Metric Chips */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {Object.entries(caseStudy.snapshot).map(([key, value]) => {
              if (key === 'partners') return null;
              
              const getIcon = (key: string) => {
                switch (key) {
                  case 'users':
                  case 'wallets':
                    return <Users className="w-5 h-5" />;
                  case 'revenue':
                    return <DollarSign className="w-5 h-5" />;
                  default:
                    return <Target className="w-5 h-5" />;
                }
              };

              return (
                <motion.div
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  className="bg-cyber-black/50 backdrop-blur rounded-lg p-4 cyber-border text-center"
                >
                  <div className="flex items-center justify-center mb-2 text-cyber-violet">
                    {getIcon(key)}
                  </div>
                  <div className="text-2xl font-bold text-cyber-cyan mb-1">
                    {value}
                  </div>
                  <div className="text-sm text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* TL;DR */}
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h3 className="text-2xl font-bold text-cyber-cyan mb-4">TL;DR</h3>
            <p className="text-gray-300 text-lg leading-relaxed">
              {caseStudy.tldr}
            </p>
          </div>

          {/* Product Snapshot */}
          <div className="mt-8 bg-cyber-black/30 rounded-xl p-8 border border-cyber-violet/30">
            <h3 className="text-xl font-bold text-cyber-violet mb-6">Product Snapshot</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {Object.entries(caseStudy.snapshot).map(([key, value]) => {
                  if (key === 'partners') return null;
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-cyber-cyan font-mono">{value}</span>
                    </div>
                  );
                })}
              </div>
              
              {caseStudy.snapshot.partners && (
                <div>
                  <h4 className="text-cyber-cyan font-semibold mb-3">Partners:</h4>
                  <div className="flex flex-wrap gap-2">
                    {caseStudy.snapshot.partners.map((partner) => (
                      <span
                        key={partner}
                        className="px-3 py-1 bg-cyber-violet/20 text-cyber-violet border border-cyber-violet/30 rounded text-sm"
                      >
                        {partner}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* Problem Section */}
        <motion.section
          id="problem"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-6">
              {caseStudy.sections.problem.title}
            </h2>
            <div className="space-y-4 mb-8">
              {caseStudy.sections.problem.content.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyber-violet rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-cyber-violet/10 border border-cyber-violet/30 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-cyber-violet mb-3">Goal</h3>
              <p className="text-gray-300 text-lg leading-relaxed">
                {caseStudy.sections.problem.goal}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Constraints Section */}
        <motion.section
          id="constraints"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-6">
              {caseStudy.sections.constraints.title}
            </h2>
            <div className="space-y-4">
              {caseStudy.sections.constraints.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyber-pink rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Role Section */}
        <motion.section
          id="role"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-8">
              {caseStudy.sections.role.title}
            </h2>
            <div className="grid gap-8">
              {caseStudy.sections.role.areas.map((area, index) => (
                <div key={index} className="bg-cyber-black/30 rounded-lg p-6 border border-cyber-violet/20">
                  <h3 className="text-xl font-semibold text-cyber-violet mb-4">
                    {area.title}
                  </h3>
                  <div className="space-y-3">
                    {area.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-cyber-cyan rounded-full mt-3 flex-shrink-0" />
                        <p className="text-gray-300 leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Metrics Section */}
        <motion.section
          id="metrics"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-8">
              {caseStudy.sections.metrics.title}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {caseStudy.sections.metrics.cards.map((card, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-cyber-black/50 rounded-lg p-6 border border-cyber-violet/30 text-center"
                >
                  <div className="text-3xl font-bold text-cyber-violet mb-2">
                    {card.value}
                  </div>
                  <div className="text-lg font-semibold text-white mb-2">
                    {card.label}
                  </div>
                  {card.description && (
                    <div className="text-sm text-gray-400">
                      {card.description}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Tradeoffs Section */}
        <motion.section
          id="tradeoffs"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-8">
              {caseStudy.sections.tradeoffs.title}
            </h2>
            <div className="space-y-4">
              {caseStudy.sections.tradeoffs.decisions.map((decision, index) => (
                <div key={index} className="border border-cyber-violet/30 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleTradeoff(decision.title)}
                    className="w-full px-6 py-4 bg-cyber-black/30 flex items-center justify-between text-left hover:bg-cyber-violet/10 transition-colors"
                  >
                    <span className="text-lg font-semibold text-cyber-violet">
                      {decision.title}
                    </span>
                    {expandedTradeoffs.includes(decision.title) ? (
                      <ChevronUp className="w-5 h-5 text-cyber-violet" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-cyber-violet" />
                    )}
                  </button>
                  {expandedTradeoffs.includes(decision.title) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 py-4 bg-cyber-black/20"
                    >
                      <p className="text-gray-300 leading-relaxed">
                        {decision.description}
                      </p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Outcomes Section */}
        <motion.section
          id="outcomes"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-6">
              {caseStudy.sections.outcomes.title}
            </h2>
            <div className="space-y-4">
              {caseStudy.sections.outcomes.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Improvements Section */}
        <motion.section
          id="improvements"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-6">
              {caseStudy.sections.improvements.title}
            </h2>
            <div className="space-y-4">
              {caseStudy.sections.improvements.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyber-yellow rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Why This Matters Section */}
        <motion.section
          id="why"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border">
            <h2 className="text-3xl font-bold text-cyber-cyan mb-6">
              {caseStudy.sections.why.title}
            </h2>
            <div className="space-y-4">
              {caseStudy.sections.why.items.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-cyber-violet rounded-full mt-3 flex-shrink-0" />
                  <p className="text-gray-300 text-lg leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-cyber-violet/30"
        >
          <Link
            to="/casestudies"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-black/60 border border-cyber-violet/50 text-cyber-violet rounded-lg hover:bg-cyber-violet/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Case Studies
          </Link>
          
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-black/60 border border-cyber-cyan/50 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/10 transition-colors"
          >
            Back to Portfolio
            <ExternalLink className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
};