import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ChevronRight } from 'lucide-react';
import { experiences } from '../data';

export const Experience: React.FC = () => {
  return (
    <section id="experience" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
        >
          Neural Network Timeline
        </motion.h2>

        <div className="max-w-3xl mx-auto">
          {experiences.map((experience, index) => (
            <motion.div
              key={experience.company}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="relative pl-8 pb-12 last:pb-0"
            >
              <div className="absolute left-0 top-0 h-full w-px bg-cyber-violet/30" />
              <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-cyber-violet animate-pulse" />
              
              <div className="bg-cyber-black/50 backdrop-blur rounded-lg p-6 cyber-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-cyber-cyan">{experience.company}</h3>
                  <span className="text-sm text-cyber-violet">{experience.period}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-cyber-violet animate-pulse" />
                  <span className="font-medium text-gray-300">{experience.role}</span>
                </div>
                
                <p className="text-gray-400 mb-4">{experience.description}</p>
                
                <ul className="space-y-2">
                  {experience.achievements.map((achievement) => (
                    <li key={achievement} className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 mt-1 text-cyber-violet flex-shrink-0 animate-pulse" />
                      <span className="text-gray-400">{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};