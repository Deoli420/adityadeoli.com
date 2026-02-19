import React from 'react';
import { motion } from 'framer-motion';
import { projects } from '../data';
import { Code2, Terminal, Shield, Cpu, CheckCircle2 } from 'lucide-react';

export const Projects: React.FC = () => {
  return (
    <section id="projects" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1484776/pexels-photo-1484776.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
        >
          Digital Arsenal
        </motion.h2>
        
        <div className="max-w-5xl mx-auto space-y-12">
          {projects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-cyber-black/50 backdrop-blur rounded-xl shadow-lg overflow-hidden cyber-border"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-cyber-cyan animate-flicker">
                    {project.title}
                  </h3>
                  <span className="text-sm text-cyber-violet">
                    {project.duration}
                  </span>
                </div>
                
                <p className="text-lg text-gray-300 mb-6">
                  {project.description}
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-cyber-cyan mb-4">
                      <Shield className="w-5 h-5 text-cyber-violet animate-pulse" />
                      System Vulnerabilities
                    </h4>
                    <ul className="space-y-3">
                      {project.challenges.map((challenge) => (
                        <li key={challenge} className="flex items-start gap-2 text-gray-400">
                          <Terminal className="w-4 h-4 mt-1 text-cyber-violet flex-shrink-0" />
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-cyber-cyan mb-4">
                      <CheckCircle2 className="w-5 h-5 text-cyber-violet animate-pulse" />
                      Protocol Upgrades
                    </h4>
                    <ul className="space-y-3">
                      {project.contributions.map((contribution) => (
                        <li key={contribution} className="flex items-start gap-2 text-gray-400">
                          <Cpu className="w-4 h-4 mt-1 text-cyber-violet flex-shrink-0" />
                          {contribution}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="flex items-center gap-2 text-lg font-semibold text-cyber-cyan mb-4">
                    <Code2 className="w-5 h-5 text-cyber-violet animate-pulse" />
                    Tech Matrix
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-3 py-1 bg-cyber-black/30 text-cyber-cyan border border-cyber-violet rounded-md text-sm animate-pulse"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};