import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { skills } from '../data';
import { Code2, Bug, Cpu, Shield, Webhook } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  'Automation': Code2,
  'Manual Testing': Bug,
  'Behavioral': Cpu,
  'API': Webhook,
  'DevOps': Cpu,
  'Blockchain': Shield,
  'Security': Shield,
  'Mobile': Code2,
  'Management': Bug
};

export const Skills: React.FC = () => {
  const categories = Array.from(new Set(skills.map(skill => skill.category)));
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const filteredSkills = selectedCategory === 'All' 
    ? skills 
    : skills.filter(skill => skill.category === selectedCategory);

  return (
    <section id="skills" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
        >
          Neural Augmentations
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 cyber-border ${
              selectedCategory === 'All'
                ? 'bg-cyber-violet text-white'
                : 'bg-cyber-black/50 text-gray-400 hover:text-cyber-cyan'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 cyber-border ${
                selectedCategory === category
                  ? 'bg-cyber-violet text-white'
                  : 'bg-cyber-black/50 text-gray-400 hover:text-cyber-cyan'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSkills.map((skill) => {
            const Icon = iconMap[skill.category] || Code2;
            return (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-cyber-black/50 backdrop-blur rounded-lg p-6 cyber-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Icon className="w-6 h-6 text-cyber-violet animate-pulse" />
                  <h3 className="text-xl font-semibold text-cyber-cyan">
                    {skill.name}
                  </h3>
                </div>

                <p className="text-gray-400 mb-4 italic">
                  "{skill.description}"
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Neural Sync</span>
                      <span className="text-sm font-medium text-cyber-violet">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="h-2 bg-cyber-black rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${skill.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyber-violet to-cyber-cyan"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {skill.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-3 py-1 bg-cyber-black/30 text-cyber-cyan border border-cyber-violet rounded-md text-sm animate-pulse"
                      >
                        {tool}
                      </span>
                    ))}
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