import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X } from 'lucide-react';

interface ReportBugModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportBugModal: React.FC<ReportBugModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
          >
            <div className="bg-cyber-black p-6 rounded-lg shadow-xl border border-cyber-violet cyber-border">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Bug className="w-6 h-6 text-cyber-violet animate-pulse" />
                  <h3 className="text-xl font-bold text-cyber-cyan animate-flicker">Bug Report #{Math.floor(Math.random() * 1000)}-FU-404</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-cyber-cyan transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4 text-center">
                <p className="text-2xl font-bold text-cyber-violet animate-glitch">
                  Go fuck yourself.
                </p>
                <p className="text-xl text-cyber-cyan">
                  This is my job.
                </p>
                <p className="text-lg text-gray-400">
                  But thanks for trying. 😂
                </p>
                
                <button
                  onClick={() => alert("500 - Internal Sass Error")}
                  className="w-full px-6 py-3 mt-4 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cyber-glow flex items-center justify-center gap-2"
                >
                  Send Anyway
                  <Bug className="w-5 h-5 animate-pulse" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};