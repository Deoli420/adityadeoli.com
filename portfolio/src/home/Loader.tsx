import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const CHECKS = [
  { at: 18, text: 'fonts loaded' },
  { at: 42, text: 'agent swarm spawned' },
  { at: 66, text: '8 systems indexed' },
  { at: 90, text: '0 unverified claims' },
];

const MIN_MS = 1500;

/**
 * Boot overlay, transparent so the swarm shows through: counts to 100 while
 * checks tick off and fonts load, lands on "Trusted." (that is the moment the
 * swarm snaps into shape, via onComplete), then hands over to the page.
 */
export const Loader: React.FC<{ onComplete: () => void; onDone: () => void }> = ({ onComplete, onDone }) => {
  const [p, setP] = useState(0);
  const [done, setDone] = useState(false);
  const fontsReady = useRef(false);

  useEffect(() => {
    let raf = 0;
    let value = 0;
    const start = performance.now();
    document.fonts?.ready.then(() => { fontsReady.current = true; });
    // never hang on a slow font CDN
    const fallback = setTimeout(() => { fontsReady.current = true; }, 3500);

    const tick = (now: number) => {
      const elapsed = now - start;
      const canFinish = fontsReady.current && elapsed > MIN_MS;
      const target = canFinish ? 100 : Math.min(92, (elapsed / MIN_MS) * 92);
      value += (target - value) * (canFinish ? 0.16 : 0.08);
      if (canFinish && value > 99.5) value = 100;
      setP(value);
      if (value >= 100) {
        setDone(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); clearTimeout(fallback); };
  }, []);

  useEffect(() => {
    if (!done) return;
    onComplete();
    const id = setTimeout(onDone, 1100);
    return () => clearTimeout(id);
  }, [done, onComplete, onDone]);

  // let impatient visitors skip
  useEffect(() => {
    const skip = () => { onComplete(); onDone(); };
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [onComplete, onDone]);

  const n = Math.floor(p);

  return (
    <motion.div
      className="hp-loader"
      role="status"
      aria-label="Loading"
      onClick={() => { onComplete(); onDone(); }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.7, ease: [0.2, 0.7, 0.1, 1] }}
    >
      <div className="hp-loader__top hp-mono">
        <span>Aditya Deoli</span>
        <span>trajectory.verify(portfolio)</span>
      </div>

      <div className="hp-loader__center">
        {done ? (
          <motion.div
            className="hp-loader__done"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.1, 1] }}
          >
            Trusted.
          </motion.div>
        ) : (
          <div className="hp-loader__count" aria-hidden="true">{String(n).padStart(3, '0')}</div>
        )}
        <ul className="hp-loader__checks hp-mono" aria-hidden="true">
          {CHECKS.map((c) => (
            <li key={c.text} className={n >= c.at ? 'is-on' : ''}>
              <span>{n >= c.at ? '✓' : '·'}</span> {c.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="hp-loader__bottom hp-mono">
        <span>{done ? 'status: trusted' : 'status: verifying'}</span>
        <span>press any key to skip</span>
      </div>
      <div className="hp-loader__bar"><i style={{ transform: `scaleX(${p / 100})` }} /></div>
    </motion.div>
  );
};
