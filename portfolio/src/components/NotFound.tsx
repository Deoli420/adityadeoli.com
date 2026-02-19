import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResponse, setShowResponse] = useState(false);

  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setShowResponse(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-cyber-black/50 backdrop-blur rounded-lg p-8 border border-cyber-violet">
          <div className="flex items-center gap-3 mb-6">
            <Bug className="w-8 h-8 text-cyber-violet animate-pulse" />
            <h1 className="text-2xl font-bold text-cyber-cyan animate-flicker">
              Bug found. Nice work.
            </h1>
          </div>

          {!showResponse ? (
            <>
              <p className="text-xl text-gray-300 mb-8">But is it reproducible?</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleOptionClick('yes')}
                  className="w-full p-4 bg-cyber-black border border-cyber-violet rounded-md text-cyber-cyan hover:bg-cyber-violet hover:text-white transition-colors cursor-pointer"
                >
                  Yes
                </button>
                
                <button
                  onClick={() => handleOptionClick('no')}
                  className="w-full p-4 bg-cyber-black border border-cyber-violet rounded-md text-cyber-cyan hover:bg-cyber-violet hover:text-white transition-colors cursor-pointer"
                >
                  No
                </button>
                
                <button
                  onClick={() => handleOptionClick('works')}
                  className="w-full p-4 bg-cyber-black border border-cyber-violet rounded-md text-cyber-cyan hover:bg-cyber-violet hover:text-white transition-colors cursor-pointer"
                >
                  Works on My Machine™
                </button>
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <p className="text-xl text-cyber-cyan mb-6">
                {selectedOption === 'yes' && "Impressive. You're hired! (Just kidding, this is my job)"}
                {selectedOption === 'no' && "Can't reproduce? Classic dev response."}
                {selectedOption === 'works' && "Ah yes, the sacred words of every developer."}
              </p>
              
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Safety
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};