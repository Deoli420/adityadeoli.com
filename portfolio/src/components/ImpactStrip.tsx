import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface Metric {
  value: string;
  numericPart: number;
  suffix: string;
  prefix: string;
  label: string;
}

const metrics: Metric[] = [
  { value: '11M+', numericPart: 11, suffix: 'M+', prefix: '', label: 'Platform users protected' },
  { value: '$10M+', numericPart: 10, suffix: 'M+', prefix: '$', label: 'Rewards secured' },
  { value: '5,000+', numericPart: 5000, suffix: '+', prefix: '', label: 'Automated test cases' },
  { value: '99.9%', numericPart: 99.9, suffix: '%', prefix: '', label: 'Uptime maintained' },
  { value: '6,500+', numericPart: 6500, suffix: '+', prefix: '', label: 'Campaigns validated' },
  { value: '2.4M+', numericPart: 2.4, suffix: 'M+', prefix: '', label: 'Identities verified' },
];

const Counter: React.FC<{ metric: Metric; isInView: boolean }> = ({ metric, isInView }) => {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const target = metric.numericPart;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(current + increment, target);

      // Ease-out: slow down as we approach the target
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const easedValue = target * eased;

      setCount(easedValue);

      if (step >= steps) {
        setCount(target);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, metric.numericPart]);

  const formatCount = (num: number): string => {
    const target = metric.numericPart;

    // For values like 99.9, show one decimal
    if (target < 100 && target % 1 !== 0) {
      return num.toFixed(1);
    }

    // For values like 11 (representing 11M), show integer
    if (target < 100) {
      return Math.floor(num).toString();
    }

    // For values like 5000, 6500 — format with commas
    return Math.floor(num).toLocaleString();
  };

  return (
    <span className="font-mono font-bold">
      {metric.prefix}
      {isInView ? formatCount(count) : '0'}
      {isInView && count >= metric.numericPart * 0.99 ? metric.suffix : ''}
    </span>
  );
};

export const ImpactStrip: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <section
      ref={ref}
      className="relative w-full overflow-hidden"
    >
      {/* Subtle gradient background — not pure black */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyber-black via-[#131333] to-cyber-black" />
      {/* Top and bottom thin border lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-violet/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent" />

      <div className="relative z-10 py-6 md:py-8">
        {/* Mobile: horizontal scroll  |  Desktop: full row */}
        <div className="flex overflow-x-auto md:overflow-x-visible scrollbar-hide">
          <div className="flex items-center min-w-max md:min-w-0 md:w-full md:justify-between md:max-w-6xl md:mx-auto px-6 md:px-8 gap-0">
            {metrics.map((metric, index) => (
              <React.Fragment key={metric.label}>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center px-6 md:px-4 lg:px-6 py-2 shrink-0"
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl text-cyber-cyan tracking-tight">
                    <Counter metric={metric} isInView={isInView} />
                  </span>
                  <span className="text-xs md:text-sm text-gray-400 mt-1 whitespace-nowrap max-w-[140px] md:max-w-none truncate md:whitespace-normal">
                    {metric.label}
                  </span>
                </motion.div>

                {/* Separator — visible between items, not after last */}
                {index < metrics.length - 1 && (
                  <div className="w-px h-10 bg-gradient-to-b from-transparent via-cyber-violet/30 to-transparent shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
