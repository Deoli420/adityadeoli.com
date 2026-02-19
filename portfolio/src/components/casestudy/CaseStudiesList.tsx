'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Filter, Zap } from 'lucide-react';
import { caseStudies, getAllDomains } from '../../data/casestudies';

export const CaseStudiesList: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const domains = getAllDomains();
  const filters = ['All', ...domains];

  const filteredCaseStudies = selectedFilter === 'All' 
    ? caseStudies 
    : caseStudies.filter(study => study.domain.includes(selectedFilter));

  return (
    <div className="min-h-screen bg-cyber-black relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold mb-6 cyber-text animate-flicker">
            Case Studies
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Deep-dive analysis of infrastructure products I've built, tested, and scaled. 
            From Web3 growth engines to identity verification systems.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          <div className="flex items-center gap-2 mr-4">
            <Filter className="w-5 h-5 text-cyber-violet" />
            <span className="text-cyber-cyan font-medium">Filter:</span>
          </div>
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 cyber-border ${
                selectedFilter === filter
                  ? 'bg-cyber-violet text-white shadow-lg shadow-cyber-violet/25'
                  : 'bg-cyber-black/50 text-gray-400 hover:text-cyber-cyan hover:border-cyber-cyan/50'
              }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Case Studies Grid */}
        <div className="grid gap-8 max-w-4xl mx-auto">
          {filteredCaseStudies.map((study, index) => (
            <motion.div
              key={study.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: '0 0 30px rgba(142, 68, 236, 0.3)'
              }}
              className="group"
            >
              <Link to={`/casestudies/${study.slug}`}>
                <div className="bg-cyber-black/50 backdrop-blur rounded-xl p-8 cyber-border hover:border-cyber-violet/60 transition-all duration-300 cursor-pointer">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Zap className="w-6 h-6 text-cyber-violet animate-pulse" />
                        <span className="text-cyber-cyan font-mono text-sm">
                          {study.timeline}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-cyber-cyan transition-colors">
                        {study.title}
                      </h2>
                      <p className="text-gray-400 text-lg leading-relaxed">
                        {study.subtitle}
                      </p>
                    </div>
                    <ArrowRight className="w-6 h-6 text-cyber-violet group-hover:text-cyber-cyan group-hover:translate-x-1 transition-all duration-300 flex-shrink-0 ml-4" />
                  </div>

                  {/* Domain Tags */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {study.domain.map((domain) => (
                      <span
                        key={domain}
                        className="px-3 py-1 bg-cyber-violet/20 text-cyber-violet border border-cyber-violet/30 rounded-md text-sm font-medium"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>

                  {/* Primary Metric */}
                  <div className="bg-cyber-black/30 rounded-lg p-4 border border-cyber-cyan/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">
                        {study.primaryMetric.label}
                      </span>
                      <span className="text-2xl font-bold text-cyber-cyan animate-pulse">
                        {study.primaryMetric.value}
                      </span>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className="px-3 py-1 bg-cyber-black/50 border border-cyber-violet/50 text-cyber-violet rounded-md text-sm font-medium">
                      {study.role}
                    </span>
                    <span className="px-3 py-1 bg-cyber-black/50 border border-cyber-cyan/50 text-cyber-cyan rounded-md text-sm font-medium">
                      {study.productType}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Back to Portfolio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-black/60 border border-cyber-cyan/50 text-cyber-cyan rounded-lg hover:bg-cyber-cyan/10 transition-colors font-mono"
          >
            ← Back to Portfolio
          </Link>
        </motion.div>
      </div>
    </div>
  );
};