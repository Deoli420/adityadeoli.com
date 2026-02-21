import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Globe, CheckCircle2, Code2 } from 'lucide-react';
import { featuredProjects } from '../data/featuredProjects';

export const FeaturedProjects: React.FC = () => {
  return (
    <section id="featured-projects" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl font-bold mb-4 cyber-text animate-flicker">
            Featured Projects
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Personal projects I designed, built, and deployed end-to-end. Each one is a deep dive
            you can explore.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {featuredProjects.map((project, index) => {
            const Icon = project.icon;
            return (
              <motion.div
                key={project.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -6 }}
                className="bg-cyber-black/50 backdrop-blur rounded-xl overflow-hidden cyber-border group"
              >
                {/* Accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r from-${project.accentColor}/20 via-${project.accentColor} to-${project.accentColor}/20`} />

                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-center gap-4 mb-2">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-lg bg-${project.accentColor}/10 border border-${project.accentColor}/20`}>
                      <Icon className={`w-6 h-6 text-${project.accentColor}`} />
                    </div>
                    <div>
                      <h3 className={`text-2xl font-bold text-${project.accentColor}`}>
                        {project.title}
                      </h3>
                      <p className="text-sm font-mono text-gray-500">{project.tagline}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-300 leading-relaxed mt-4 mb-6">
                    {project.description}
                  </p>

                  {/* Metrics strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {project.metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="bg-cyber-black/60 rounded-lg p-3 border border-gray-800"
                      >
                        <div className={`text-xl font-bold font-mono text-${project.accentColor}`}>
                          {metric.value}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{metric.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  <ul className="space-y-2.5 mb-6">
                    {project.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
                        <CheckCircle2 className={`w-4 h-4 text-${project.accentColor} mt-0.5 shrink-0`} />
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  {/* Tech pills */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.techHighlights.map((tech) => (
                      <span
                        key={tech}
                        className={`px-2.5 py-1 bg-cyber-black/40 text-${project.accentColor}/70 border border-${project.accentColor}/20 rounded text-xs font-mono`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-800/50">
                    <Link
                      to={project.detailPath}
                      className={`inline-flex items-center gap-2 px-5 py-2.5 bg-${project.accentColor} text-cyber-black font-semibold rounded-md hover:opacity-90 transition-opacity text-sm`}
                    >
                      Explore Project
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 px-5 py-2.5 border border-${project.accentColor}/40 text-${project.accentColor} rounded-md hover:bg-${project.accentColor}/10 transition-colors text-sm`}
                    >
                      <Code2 className="w-4 h-4" />
                      Source Code
                    </a>
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 px-5 py-2.5 border border-${project.accentColor}/40 text-${project.accentColor} rounded-md hover:bg-${project.accentColor}/10 transition-colors text-sm`}
                      >
                        <Globe className="w-4 h-4" />
                        Live Demo
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
