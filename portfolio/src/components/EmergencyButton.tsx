import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Terminal, XCircle } from 'lucide-react';

export const EmergencyButton: React.FC = () => {
  const [isTriggered, setIsTriggered] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFinalReveal, setShowFinalReveal] = useState(false);
  const [buttonText, setButtonText] = useState('🔥 PRODUCTION DOWN');
  const [logs, setLogs] = useState<string[]>([]);
  const [canResume, setCanResume] = useState(true);

  useEffect(() => {
    // Console Easter Egg
    console.log("%cNice try. But I saw you open DevTools. QA always watches.", "color: violet; font-size: 16px;");
  }, []);

  const terminalLogs = [
    '> Detected unauthorized access.',
    '> Shutting down non-critical services...',
    '> Purging QA logs...',
    '> Compromised files located in /usr/dev/prod/config',
    '> 🐛 Bugs multiplying: 67...91...148...',
    '[ERROR] NullPointerException in line 666',
    '[WARNING] Legacy API call detected: `window.crashApp()`',
    '[INFO] QA tried turning it off and on again.'
  ];

  const triggerEmergency = () => {
    if (isTriggered) {
      return;
    }

    setIsTriggered(true);
    
    // Vibration API
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    setShowTerminal(true);

    // Animate terminal logs
    let i = 0;
    const logInterval = setInterval(() => {
      if (i < terminalLogs.length) {
        setLogs(prev => [...prev, terminalLogs[i]]);
        i++;
      } else {
        clearInterval(logInterval);
        setTimeout(() => {
          setShowModal(true);
        }, 2000);
      }
    }, 500);

    // Show final reveal after modal
    setTimeout(() => {
      setShowFinalReveal(true);
      setButtonText('🔥 Thank You For Stress Testing This Site');
    }, 10000);

    // Fake webhook call
    console.log('📡 Triggering deployment webhook...');
    console.log('curl -X POST https://github.com/deploy?env=🔥');
  };

  return (
    <>
      <button
        onClick={triggerEmergency}
        className="fixed bottom-4 right-4 px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all transform hover:scale-105 cursor-[emoji] shadow-lg z-50"
        title="DO NOT CLICK. Seriously."
      >
        {buttonText}
      </button>

      <AnimatePresence>
        {isTriggered && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                rotate: [0, -1, 1, -1, 0],
                transition: { 
                  rotate: {
                    repeat: Infinity,
                    duration: 0.2
                  }
                }
              }}
              className="fixed inset-10 bg-black/90 text-green-500 font-mono p-6 rounded-lg shadow-2xl overflow-auto z-50"
            >
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="mb-2"
                >
                  {log}
                </motion.div>
              ))}
            </motion.div>

            {showModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#ECE9D8] text-black p-6 rounded shadow-xl border-2 border-[#0055EA] w-96 z-50"
                style={{ fontFamily: 'Tahoma, sans-serif' }}
              >
                <div className="bg-[#0055EA] text-white py-1 px-2 flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Windows</span>
                  <XCircle className="w-4 h-4 ml-auto cursor-pointer" />
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <Terminal className="w-12 h-12 text-[#0055EA]" />
                  <div>
                    <h3 className="font-bold mb-2">🚨 SYSTEM BREACH</h3>
                    <p className="mb-4">
                      QA Panic Mode Initiated.
                      <br />
                      Deploying Hotfix via GPT-69...
                      <br />
                      <br />
                      Status: FAILED
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button className="px-4 py-1 bg-[#ECE9D8] border border-gray-400 active:bg-gray-200">
                    OK
                  </button>
                  <button className="px-4 py-1 bg-[#ECE9D8] border border-gray-400 active:bg-gray-200">
                    Panic
                  </button>
                </div>
              </motion.div>
            )}

            {showFinalReveal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 flex items-center justify-center z-50"
              >
                <div className="text-center space-y-4">
                  <motion.h2
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-4xl font-bold text-cyber-cyan mb-4"
                  >
                    RELAX. THIS IS A SIMULATION.
                  </motion.h2>
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-xl text-gray-300"
                  >
                    But now you know what we deal with.
                  </motion.p>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="space-y-2 text-cyber-violet"
                  >
                    <p>Job Title: Bug Hunter</p>
                    <p>Weapon: Selenium</p>
                    <p>Ultimate: Regression Blast</p>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Achievement Toast */}
      {isTriggered && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          className="fixed top-4 right-4 bg-cyber-violet text-white px-6 py-3 rounded-lg shadow-lg z-50"
        >
          🏆 Achievement Unlocked: Broke Prod (Virtually)
        </motion.div>
      )}
    </>
  );
};