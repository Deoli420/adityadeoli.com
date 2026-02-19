import React from 'react';
import { motion } from 'framer-motion';
import { Award, GraduationCap, ExternalLink, Scroll } from 'lucide-react';
import { certifications, education } from '../data';

export const Certifications: React.FC = () => {
  return (
    <section id="certifications" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
        >
          Digital Credentials Matrix
        </motion.h2>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-xl text-cyber-cyan flex items-center gap-2">
              <Award className="w-6 h-6 text-cyber-violet animate-pulse" />
              Neural Certifications
            </h3>
            
            <div className="space-y-4">
              {certifications.map((cert) => (
                <motion.div
                  key={cert.name}
                  whileHover={{ scale: 1.02 }}
                  className="bg-cyber-black/50 backdrop-blur rounded-lg p-6 cyber-border"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white">{cert.name}</h4>
                      <p className="text-sm text-gray-400">{cert.issuer}</p>
                      <p className="text-sm text-cyber-cyan">{cert.date}</p>
                    </div>
                    {cert.link && (
                      <a
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-violet hover:text-cyber-cyan transition-colors"
                      >
                        <Scroll className="w-5 h-5 animate-pulse" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-xl text-cyber-cyan flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-cyber-violet animate-pulse" />
              Neural Training
            </h3>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-cyber-black/50 backdrop-blur rounded-lg p-8 cyber-border"
            >
              <h4 className="text-white mb-2">{education.degree}</h4>
              <p className="text-gray-400">{education.university}</p>
              <p className="text-sm text-cyber-cyan mt-2">{education.period}</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};