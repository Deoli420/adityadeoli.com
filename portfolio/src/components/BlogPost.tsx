import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, Tag, Terminal, Clock, Eye } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

interface BlogPostData {
  title: string;
  date: string;
  tags: string[];
  slug: string;
  summary: string;
  content: string;
  readTime: string;
}

const blogPostsData: Record<string, BlogPostData> = {
  'art-of-breaking-defi': {
    title: "The Art of Breaking DeFi: A QA Perspective",
    date: "2025-06-10",
    tags: ["DeFi", "QA", "Crypto Testing", "Flash Loans", "Security"],
    slug: "art-of-breaking-defi",
    summary: "Diving deep into the unique challenges of testing decentralized finance protocols. From flash loan attacks to oracle manipulation, here's what keeps me up at night.",
    readTime: "8 min",
    content: `Testing in the DeFi world isn't your typical QA job.

In traditional apps, you check whether buttons work and data gets saved. In DeFi, I'm stress-testing systems that move millions of dollars in real-time, with code that can't be patched instantly if something goes wrong.

---

### What Makes DeFi Testing Unique?

**1. Smart Contracts Are Immutable**  
Once deployed, a smart contract on-chain can't be edited. That means every test case has to consider *finality*. One missed edge case could mean an exploit worth millions.

**2. Everything Is Public**  
Attackers see the same code we do. That means security through obscurity doesn't work. Every assumption you make is one an attacker will try to break.

---

### Flash Loans: The One-Block Attack Vector

Flash loans allow users to borrow massive amounts of crypto—millions—*as long as they pay it back within the same transaction*.

In testing, this means I need to simulate:
- Sudden, high-volume liquidity movements
- Arbitrage between protocols
- Reentrancy edge cases

A feature might work fine under normal use. But when a flash loan hits, suddenly things break — prices move, oracles lag, and contract logic bends in ways you didn't plan for.

---

### Oracles: Your Data Feeds Can Betray You

Oracles are external sources that feed price data into smart contracts. But what if that data lags or gets manipulated?

I test for:
- Oracle update frequency
- What happens when the oracle fails
- How the contract handles unexpected spikes or data gaps

A lot of exploits stem from price manipulation due to poor oracle setups.

---

### My Workflow as a QA Engineer

My typical testing setup includes:
- Forked mainnet environments (so I'm testing against real-world contract states)
- Tools like Hardhat and Foundry for scripting edge case tests
- Manual test logs to document unusual behavior
- Collaboration with devs to identify assumptions in the contract logic

---

### What Keeps Me Up at Night

It's not bugs. It's assumptions.

The assumption that:
- The oracle will always be accurate
- Liquidity will always be available
- No one will call the contract 50 times in the same block

Good testing means questioning all of those. And making sure even the unexpected is handled gracefully.

---

### Final Thoughts

Breaking DeFi systems safely—before attackers do—is a responsibility I take seriously. It's high-stakes, high-impact, and constantly evolving. But that's also what makes it so exciting.

If you're building in DeFi and want a second pair of eyes on your protocol, feel free to reach out.`
  }
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const renderContent = (text: string) => {
    // Split by sections
    const sections = text.split('---').map(section => section.trim()).filter(Boolean);
    
    return sections.map((section, sectionIndex) => {
      const lines = section.split('\n').filter(line => line.trim());
      
      return (
        <div key={sectionIndex} className="mb-8">
          {lines.map((line, lineIndex) => {
            const trimmedLine = line.trim();
            
            // Headers
            if (trimmedLine.startsWith('### ')) {
              return (
                <h3 key={lineIndex} className="text-2xl font-bold text-cyan-300 mb-4 mt-8 font-mono">
                  {trimmedLine.replace('### ', '')}
                </h3>
              );
            }
            
            // Bold text
            if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
              return (
                <p key={lineIndex} className="text-green-300 font-semibold mb-3 text-lg">
                  {trimmedLine.replace(/\*\*/g, '')}
                </p>
              );
            }
            
            // List items
            if (trimmedLine.startsWith('- ')) {
              return (
                <li key={lineIndex} className="text-gray-300 mb-2 ml-4 list-disc">
                  {trimmedLine.replace('- ', '')}
                </li>
              );
            }
            
            // Regular paragraphs
            if (trimmedLine && !trimmedLine.startsWith('#')) {
              // Handle italic text
              const processedText = trimmedLine.replace(/\*(.*?)\*/g, '<em class="text-cyan-400">$1</em>');
              
              return (
                <p 
                  key={lineIndex} 
                  className="text-gray-300 mb-4 leading-relaxed text-lg"
                  dangerouslySetInnerHTML={{ __html: processedText }}
                />
              );
            }
            
            return null;
          })}
        </div>
      );
    });
  };

  return <div>{renderContent(content)}</div>;
};

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const post = slug ? blogPostsData[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-red-400 mb-4 font-mono">404: LOG NOT FOUND</h1>
          <p className="text-gray-400 mb-8">The requested data shard does not exist in our archives.</p>
          <Link
            to="/logs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black/60 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-900/30 transition-colors font-mono"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Archive
          </Link>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Terminal Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
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
              ~/logs/{post.slug}
            </div>
            <div className="text-cyan-300 mb-4">
              Decrypting data shard... Access granted.
              <span className="animate-pulse">_</span>
            </div>
          </div>
        </motion.div>

        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            to="/logs"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/60 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-900/30 transition-colors font-mono text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all logs
          </Link>
        </motion.div>

        {/* Article Content */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/60 backdrop-blur border border-green-500/30 rounded-lg p-8"
        >
          {/* Article Header */}
          <header className="mb-8 pb-6 border-b border-green-500/20">
            <h1 className="text-4xl font-bold text-cyan-300 mb-4 font-mono leading-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <time dateTime={post.date}>
                  {new Date(post.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} read</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>Classification: PUBLIC</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs rounded border bg-green-900/30 border-green-500/50 text-green-300 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <p className="text-gray-300 text-lg leading-relaxed italic border-l-4 border-cyan-500/50 pl-4">
              {post.summary}
            </p>
          </header>

          {/* Article Body */}
          <div className="prose prose-invert prose-lg max-w-none">
            <MarkdownRenderer content={post.content} />
          </div>
        </motion.article>

        {/* Footer Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex justify-between items-center"
        >
          <Link
            to="/logs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black/60 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-900/30 transition-colors font-mono"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Archive
          </Link>
          
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-black/60 border border-green-500/50 text-green-300 rounded-lg hover:bg-green-900/30 transition-colors font-mono"
          >
            <Terminal className="w-5 h-5" />
            Exit to Main Interface
          </Link>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes scanlines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};