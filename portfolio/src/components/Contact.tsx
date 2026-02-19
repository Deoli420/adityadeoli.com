import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Linkedin, Github, Send, Scroll, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [integrityScore, setIntegrityScore] = useState(0);
  const [integrityFeedback, setIntegrityFeedback] = useState<string[]>([]);
  const [integrityStatus, setIntegrityStatus] = useState<'critical' | 'warning' | 'stable'>('critical');

  // Transmission Integrity Analyzer (TIA)
  const analyzeTransmissionIntegrity = (name: string, email: string, message: string) => {
    let score = 100;
    const feedback: string[] = [];
    
    // Length Analysis
    if (message.length < 20) {
      score -= 40;
      feedback.push('Data packet too brief - expand transmission content');
    } else if (message.length < 50) {
      score -= 20;
      feedback.push('Signal strength low - consider adding more context');
    }
    
    // Signal Quality Detection
    const lowSignalPatterns = [
      /^(hi|hello|hey|test|testing)$/i,
      /^(.)\1{3,}/, // Repeated characters
      /^(a|e|i|o|u|x|z){5,}$/i, // Low entropy
    ];
    
    const spamPatterns = [
      /\b(urgent|asap|immediate|quick|fast)\b/gi,
      /(.)\1{4,}/, // 5+ repeated chars
      /[A-Z]{10,}/, // Excessive caps
    ];
    
    if (lowSignalPatterns.some(pattern => pattern.test(message.trim()))) {
      score -= 30;
      feedback.push('Low-entropy signal detected - provide meaningful content');
    }
    
    if (spamPatterns.some(pattern => pattern.test(message))) {
      score -= 25;
      feedback.push('Transmission pattern flagged - refine message structure');
    }
    
    // Context Completeness
    if (!name.trim()) {
      score -= 20;
      feedback.push('Identity vector missing');
    }
    
    if (!email.trim()) {
      score -= 20;
      feedback.push('Neural address required for response channel');
    }
    
    if (!message.trim()) {
      score -= 30;
      feedback.push('Data packet empty - transmission impossible');
    }
    
    // Sentence structure check
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0 && message.length > 0) {
      score -= 15;
      feedback.push('Consider adding complete thoughts for clarity');
    }
    
    // Professional context bonus
    const professionalKeywords = [
      'project', 'collaboration', 'opportunity', 'work', 'position', 
      'qa', 'testing', 'automation', 'web3', 'blockchain'
    ];
    
    if (professionalKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    )) {
      score += 10;
      if (score > 100) score = 100;
    }
    
    // Determine status
    let status: 'critical' | 'warning' | 'stable';
    if (score < 60) {
      status = 'critical';
    } else if (score < 80) {
      status = 'warning';
    } else {
      status = 'stable';
    }
    
    // Ensure score doesn't go below 0
    if (score < 0) score = 0;
    
    return { score, feedback, status };
  };

  // Real-time analysis on input change
  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Run integrity analysis
    const analysis = analyzeTransmissionIntegrity(
      newFormData.name,
      newFormData.email,
      newFormData.message
    );
    
    setIntegrityScore(analysis.score);
    setIntegrityFeedback(analysis.feedback);
    setIntegrityStatus(analysis.status);
  };

  const getStatusConfig = () => {
    switch (integrityStatus) {
      case 'critical':
        return {
          label: 'Unstable Link',
          color: 'text-red-400',
          bgColor: 'bg-red-900/30',
          borderColor: 'border-red-500/50',
          icon: AlertTriangle
        };
      case 'warning':
        return {
          label: 'Partial Sync',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/30',
          borderColor: 'border-yellow-500/50',
          icon: Shield
        };
      case 'stable':
        return {
          label: 'Stable Transmission',
          color: 'text-green-400',
          bgColor: 'bg-green-900/30',
          borderColor: 'border-green-500/50',
          icon: CheckCircle
        };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setErrorMessage('');
    
    // Check integrity score
    if (integrityScore < 60) {
      setErrorMessage('Transmission integrity too low. Improve signal quality before sending.');
      setSubmitStatus('error');
      return;
    }
    
    // Validation - check if any field is empty
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('All neural pathways must be connected. Please fill in all fields.');
      setSubmitStatus('error');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Generate mailto URL
      const subject = `New Neural Connection from ${formData.name}`;
      const body = `Identity: ${formData.name}
Neural Address: ${formData.email}

Data Packet:
${formData.message}`;
      
      // Encode components for URL
      const encodedSubject = encodeURIComponent(subject);
      const encodedBody = encodeURIComponent(body);
      
      // Create mailto URL
      const mailtoURL = `mailto:adityadeoli@gmail.com?subject=${encodedSubject}&body=${encodedBody}`;
      
      // Open mail client
      window.location.href = mailtoURL;
      
      // Update UI state
      setSubmitStatus('success');
      
      // Optional: Reset form after successful send
      setTimeout(() => {
        setFormData({ name: '', email: '', message: '' });
        setSubmitStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error('Neural transmission error:', error);
      setErrorMessage('Neural link disrupted. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2387793/pexels-photo-2387793.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12 cyber-text animate-flicker"
        >
          Neural Link Connection
        </motion.h2>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h3 className="text-2xl font-bold text-cyber-cyan mb-6">
              Connect to the Network
            </h3>
            
            <div className="space-y-6">
              <a
                href="mailto:adityadeoli@gmail.com"
                className="flex items-center gap-3 text-gray-400 hover:text-cyber-cyan transition-colors"
              >
                <Mail className="w-6 h-6 animate-pulse" />
                adityadeoli@gmail.com
              </a>
              
              <a
                href="https://linkedin.com/in/adityadeoli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-cyber-cyan transition-colors"
              >
                <Linkedin className="w-6 h-6 animate-pulse" />
                LinkedIn
              </a>
              
              <a
                href="https://github.com/adityadeoli"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-cyber-cyan transition-colors"
              >
                <Github className="w-6 h-6 animate-pulse" />
                GitHub
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-cyber-black/50 backdrop-blur rounded-lg p-8 cyber-border"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm text-cyber-cyan mb-2">
                  Your Identity
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="w-full px-4 py-2 rounded-md border border-cyber-violet bg-cyber-black/30 text-white focus:ring-2 focus:ring-cyber-cyan outline-none transition-shadow"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm text-cyber-cyan mb-2">
                  Neural Address
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="w-full px-4 py-2 rounded-md border border-cyber-violet bg-cyber-black/30 text-white focus:ring-2 focus:ring-cyber-cyan outline-none transition-shadow"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm text-cyber-cyan mb-2">
                  Data Packet
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  className="w-full px-4 py-2 rounded-md border border-cyber-violet bg-cyber-black/30 text-white focus:ring-2 focus:ring-cyber-cyan outline-none transition-shadow"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                />
              </div>

              {/* Transmission Integrity Analyzer Display */}
              {(formData.name || formData.email || formData.message) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-cyber-cyan">Transmission Integrity</span>
                    <span className="text-sm font-mono text-gray-400">
                      {integrityScore}/100
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-2 bg-cyber-black rounded-full overflow-hidden border border-cyber-violet/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${integrityScore}%` }}
                      transition={{ duration: 0.3 }}
                      className={`h-full ${
                        integrityStatus === 'critical' ? 'bg-red-500' :
                        integrityStatus === 'warning' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                    />
                  </div>
                  
                  {/* Status Display */}
                  {(() => {
                    const { icon: StatusIcon } = getStatusConfig();
                    return (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-md border ${getStatusConfig().bgColor} ${getStatusConfig().borderColor}`}>
                    <StatusIcon className={`w-4 h-4 ${getStatusConfig().color}`} />
                    <span className={`text-sm font-medium ${getStatusConfig().color}`}>
                      {getStatusConfig().label}
                    </span>
                  </div>
                    );
                  })()}
                  
                  {/* Feedback Messages */}
                  {integrityFeedback.length > 0 && (
                    <div className="space-y-1">
                      {integrityFeedback.map((feedback, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="text-cyber-violet mt-0.5">▸</span>
                          <span>{feedback}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || integrityScore < 60}
                className="w-full px-6 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  'Transmitting...'
                ) : (
                  <>
                    Send Data
                    <Scroll className="w-5 h-5 animate-pulse" />
                  </>
                )}
              </button>

              {errorMessage && (
                <p className="text-cyber-pink text-center text-sm">
                  {errorMessage}
                </p>
              )}

              {submitStatus === 'success' && (
                <p className="text-cyber-cyan text-center">
                  Neural link established! Check your mail client.
                </p>
              )}
              
              {submitStatus === 'error' && !errorMessage && (
                <p className="text-cyber-pink text-center">
                  Transmission failed. Please try again.
                </p>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};