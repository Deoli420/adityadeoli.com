import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Calendar, Tag, ExternalLink, Eye, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogPost {
  id: string;
  title: string;
  summary: string;
  date: string;
  tags: string[];
  readTime: string;
  slug: string;
  isSecret?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: '001',
    title: 'The Art of Breaking DeFi: A QA Perspective',
    summary: 'Diving deep into the unique challenges of testing decentralized finance protocols. From flash loan attacks to oracle manipulation, here\'s what keeps me up at night.',
    date: '2024-12-15',
    tags: ['#CryptoThoughts', '#DeFi', '#BugHunting'],
    readTime: '8 min',
    slug: 'art-of-breaking-defi'
  },
  {
    id: '002',
    title: 'Web3 UX: Why Your Grandma Still Can\'t Use MetaMask',
    summary: 'A brutally honest take on Web3 user experience from someone who tests it daily. Spoiler: we\'re still in the stone age.',
    date: '2024-12-10',
    tags: ['#Web3UX', '#CryptoThoughts', '#DevLore'],
    readTime: '6 min',
    slug: 'web3-ux-grandma-metamask'
  },
  {
    id: '003',
    title: 'Gas Wars: When Testing Costs More Than Your Salary',
    summary: 'Tales from the trenches of mainnet testing. How I learned to love testnets and stop worrying about gas fees.',
    date: '2024-12-05',
    tags: ['#Ethereum', '#Testing', '#DevLore'],
    readTime: '5 min',
    slug: 'gas-wars-testing-costs'
  },
  {
    id: '004',
    title: 'The Rug Pull Detector: Building Trust in Trustless Systems',
    summary: 'Exploring patterns, red flags, and automated detection methods for identifying potential rug pulls before they happen.',
    date: '2024-11-28',
    tags: ['#Security', '#CryptoThoughts', '#BugHunting'],
    readTime: '10 min',
    slug: 'rug-pull-detector'
  },
  {
    id: 'secret',
    title: 'The Day I Almost Broke Ethereum',
    summary: 'A classified incident report from the depths of testnet hell. Some bugs are too dangerous to exist.',
    date: '2024-??-??',
    tags: ['#Classified', '#DevLore', '#NearMiss'],
    readTime: '??? min',
    slug: 'almost-broke-ethereum',
    isSecret: true
  }
];

export const LogsPage: React.FC = () => {
  const [terminalInput, setTerminalInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    '> Initializing neural interface...',
    '> Loading encrypted data streams...',
    '> Welcome to the archive, Operator.'
  ]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const terminalRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const command = terminalInput.toLowerCase().trim();
    
    setTerminalHistory(prev => [...prev, `> ${terminalInput}`]);
    
    if (command === 'sudo reveal' || command === 'reveal') {
      setShowSecret(true);
      setTerminalHistory(prev => [...prev, 'ACCESS GRANTED: Classified logs unlocked.']);
    } else if (command === 'help') {
      setTerminalHistory(prev => [...prev, 'Available commands: help, clear, sudo reveal']);
    } else if (command === 'clear') {
      setTerminalHistory([]);
    } else if (command === 'whoami') {
      setTerminalHistory(prev => [...prev, 'User: QA_OPERATOR | Clearance: ALPHA | Status: ONLINE']);
    } else {
      setTerminalHistory(prev => [...prev, `Command not found: ${command}`]);
    }
    
    setTerminalInput('');
  };

  const visiblePosts = showSecret ? blogPosts : blogPosts.filter(post => !post.isSecret);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* CRT Scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="h-full w-full bg-gradient-to-b from-transparent via-green-500/20 to-transparent animate-pulse" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px)',
               animation: 'scanlines 0.1s linear infinite'
             }} />
      </div>

      {/* Matrix Rain Effect */}
      <div className="fixed top-0 right-0 w-32 h-full pointer-events-none opacity-20 overflow-hidden">
        <div className="text-green-400 text-xs font-mono leading-none animate-pulse">
          {Array.from({ length: 50 }, (_, i) => (
            <div key={i} className="animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>
              {Math.random() > 0.5 ? '1' : '0'}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Terminal Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-black/80 backdrop-blur border border-green-500/30 rounded-lg p-6 font-mono">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-green-400" />
                <span className="text-green-400">NEURAL_TERMINAL_v2.1.0</span>
              </div>
              <div className="text-cyan-400 text-sm">
                {currentTime.toLocaleTimeString()} UTC
              </div>
            </div>
            
            <div className="text-green-400 text-xl mb-2">
              ~/logs
            </div>
            <div className="text-cyan-300 mb-4">
              Decrypting stream... Welcome, Operator.
              <span className="animate-pulse">_</span>
            </div>
            
            <div className="text-gray-400 text-sm">
              Status: {blogPosts.length - (showSecret ? 0 : 1)} data shards loaded | 
              Clearance: {showSecret ? 'ALPHA' : 'BETA'} | 
              Neural sync: 98.7%
            </div>
          </div>
        </motion.div>

        {/* Blog Posts Grid */}
        <div className="grid gap-6 mb-12">
          <AnimatePresence>
            {visiblePosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0,255,0,0.3)' }}
                className={`bg-black/60 backdrop-blur border rounded-lg p-6 cursor-pointer transition-all duration-300 ${
                  post.isSecret 
                    ? 'border-red-500/50 hover:border-red-400' 
                    : 'border-green-500/30 hover:border-green-400'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {post.isSecret ? (
                      <Lock className="w-5 h-5 text-red-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-green-400" />
                    )}
                    <span className="text-gray-400 font-mono text-sm">
                      LOG_{post.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h3 className={`text-xl font-bold mb-3 ${
                  post.isSecret ? 'text-red-300' : 'text-cyan-300'
                }`}>
                  {post.title}
                </h3>

                <p className="text-gray-300 mb-4 leading-relaxed">
                  {post.summary}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`px-2 py-1 text-xs rounded border font-mono ${
                          post.isSecret
                            ? 'bg-red-900/30 border-red-500/50 text-red-300'
                            : 'bg-green-900/30 border-green-500/50 text-green-300'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <Link
                    to={`/logs/${post.slug}`}
                    className={`flex items-center gap-2 px-4 py-2 rounded border transition-colors ${
                      post.isSecret
                        ? 'border-red-500/50 text-red-300 hover:bg-red-900/30'
                        : 'border-green-500/50 text-green-300 hover:bg-green-900/30'
                    }`}
                  >
                    Access Log
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Terminal Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/80 backdrop-blur border border-green-500/30 rounded-lg p-4 font-mono"
        >
          <div className="mb-4 max-h-32 overflow-y-auto">
            {terminalHistory.map((line, index) => (
              <div key={index} className="text-green-400 text-sm mb-1">
                {line}
              </div>
            ))}
          </div>
          
          <form onSubmit={handleTerminalSubmit} className="flex items-center gap-2">
            <span className="text-green-400">{'>'}</span>
            <input
              ref={terminalRef}
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              className="flex-1 bg-transparent text-green-400 outline-none placeholder-green-600"
              placeholder="enter command..."
              autoComplete="off"
            />
            <span className="text-green-400 animate-pulse">_</span>
          </form>
          
          <div className="text-gray-500 text-xs mt-2">
            Hint: Try 'help', 'whoami', or 'sudo reveal'
          </div>
        </motion.div>

        {/* Back to Main */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black/60 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-900/30 transition-colors font-mono"
          >
            <Terminal className="w-5 h-5" />
            Exit to Main Interface
          </Link>
        </div>
      </div>

      {/* Hidden Easter Egg Comment */}
      {/* FLAG{YOU_FOUND_THE_SECRET} - DM @adityadeoli */}
      
      <style jsx>{`
        @keyframes scanlines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};