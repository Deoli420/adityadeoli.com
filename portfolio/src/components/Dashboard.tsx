import React from 'react';
import { motion } from 'framer-motion';
import { Bug, AlertTriangle, RefreshCw, Music, Cat, ArrowDown, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const fakeBugs = [
    {
      id: 'BUG-420',
      title: 'Button turns into cat on click',
      severity: 'Critical',
      status: 'Open',
      assignee: 'Mr. Whiskers',
      description: 'Users report button occasionally transforms into a cat gif. Cannot reproduce without catnip.',
      icon: Cat
    },
    {
      id: 'BUG-666',
      title: 'Dropdown opens the abyss',
      severity: 'High',
      status: 'In Progress',
      assignee: 'Void Walker',
      description: 'Dropdown menu creates a portal to the void. Users report existential crisis.',
      icon: ArrowDown
    },
    {
      id: 'BUG-007',
      title: 'API returned Rick Astley',
      severity: 'Medium',
      status: 'Never gonna fix',
      assignee: 'Rick A.',
      description: 'All API endpoints now return "Never Gonna Give You Up" lyrics instead of data.',
      icon: Music
    }
  ];

  return (
    <div className="min-h-screen bg-cyber-black p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Bug className="w-8 h-8 text-cyber-violet animate-pulse" />
            <h1 className="text-2xl font-bold text-cyber-cyan animate-flicker">
              QA Dashboard v4.04
            </h1>
          </div>
          
          <Link
            to="/"
            className="px-4 py-2 bg-cyber-violet text-white rounded-md hover:bg-cyber-purple transition-colors cursor-pointer"
          >
            Exit Simulation
          </Link>
        </div>

        <div className="grid gap-6">
          {fakeBugs.map((bug, index) => (
            <motion.div
              key={bug.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-cyber-black/50 backdrop-blur rounded-lg p-6 border border-cyber-violet"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <bug.icon className="w-6 h-6 text-cyber-violet animate-pulse" />
                  <div>
                    <h3 className="text-xl font-semibold text-cyber-cyan">
                      {bug.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {bug.id} • {bug.severity} • {bug.status}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="p-2 text-gray-400 hover:text-cyber-cyan transition-colors cursor-pointer">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-cyber-cyan transition-colors cursor-pointer">
                    <LinkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="mt-4 text-gray-300">{bug.description}</p>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-cyber-violet" />
                  <span className="text-sm text-gray-400">
                    Assigned to: {bug.assignee}
                  </span>
                </div>
                
                <button className="px-4 py-2 bg-cyber-black border border-cyber-violet rounded-md text-cyber-cyan hover:bg-cyber-violet hover:text-white transition-colors cursor-pointer">
                  Reproduce
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};