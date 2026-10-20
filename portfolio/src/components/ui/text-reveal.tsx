// Source: 21st.dev — Text Reveal by dillionverma (Magic UI).
// Adapted: single ref (the original attached it twice), colours and sizing via
// className props so the host page owns the typography.

import { FC, ReactNode, useRef } from 'react';
import { motion, MotionValue, useScroll, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';

interface TextRevealByWordProps {
  text: string;
  className?: string;
  textClassName?: string;
  /** Words to render in the accent style (matched without punctuation) */
  accentWords?: string[];
  accentClassName?: string;
}

const TextRevealByWord: FC<TextRevealByWordProps> = ({
  text,
  className,
  textClassName,
  accentWords = [],
  accentClassName,
}) => {
  const targetRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
  });
  const words = text.split(' ');
  const accents = new Set(accentWords.map((w) => w.toLowerCase()));

  return (
    <div ref={targetRef} className={cn('relative z-0 h-[200vh]', className)}>
      <div className="sticky top-0 mx-auto flex h-[100vh] items-center bg-transparent">
        <p className={cn('flex flex-wrap', textClassName)}>
          {words.map((word, i) => {
            const start = i / words.length;
            const end = start + 1 / words.length;
            const isAccent = accents.has(word.toLowerCase().replace(/[^\p{L}\p{N}'’]/gu, ''));
            return (
              <Word
                key={i}
                progress={scrollYProgress}
                range={[start, end]}
                className={isAccent ? accentClassName : undefined}
              >
                {word}
              </Word>
            );
          })}
        </p>
      </div>
    </div>
  );
};

interface WordProps {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
  className?: string;
}

const Word: FC<WordProps> = ({ children, progress, range, className }) => {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className={cn('relative mr-[0.25em]', className)}>
      <span className="absolute opacity-[0.14]">{children}</span>
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
};

export { TextRevealByWord };
