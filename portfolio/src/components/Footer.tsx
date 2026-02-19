import React, { useState } from 'react';
import { Bug } from 'lucide-react';
import { ReportBugModal } from './ReportBugModal';
import { EmergencyButton } from './EmergencyButton';

export const Footer: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="py-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg')] bg-cover bg-center opacity-5" />
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-black via-cyber-black/90 to-cyber-black" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-4">
          <p className="text-cyber-cyan font-mono italic animate-flicker">
            "If this page has a bug, it's a feature — and yes, I logged it."
          </p>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Bug className="w-4 h-4 animate-pulse" />
            <p>&copy; {new Date().getFullYear()} Aditya Deoli. All rights reserved.</p>
          </div>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-cyber-black/50 border border-cyber-violet rounded-md text-cyber-cyan hover:bg-cyber-violet hover:text-white transition-colors cyber-glow flex items-center gap-2 mx-auto"
          >
            <Bug className="w-5 h-5 animate-pulse" />
            Found a Bug?
          </button>
        </div>
      </div>

      <ReportBugModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      <EmergencyButton />
    </footer>
  );
};