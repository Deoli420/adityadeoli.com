/**
 * 3D card tilt hook — mouse-following perspective tilt using Framer Motion.
 *
 * Returns motion styles and event handlers. Zero extra dependencies
 * beyond Framer Motion (already installed).
 *
 * Automatically disabled on touch-only devices.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  useMotionValue,
  useSpring,
  useTransform,
  type MotionStyle,
} from 'framer-motion';

interface TiltConfig {
  maxTilt?: number;      // degrees, default 6
  perspective?: number;  // px, default 900
  scale?: number;        // hover scale, default 1.015
  speed?: number;        // spring stiffness, default 300
}

export function useTilt(config: TiltConfig = {}) {
  const {
    maxTilt = 6,
    perspective = 900,
    scale = 1.015,
    speed = 300,
  } = config;

  const ref = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [canHover, setCanHover] = useState(true);

  // Check for hover capability (disabled on touch-only)
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Raw motion values
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawScale = useMotionValue(1);

  // Glow position (0-1 normalized)
  const glowX = useMotionValue(0.5);
  const glowY = useMotionValue(0.5);

  // Spring-smoothed values
  const rotateX = useSpring(rawRotateX, { stiffness: speed, damping: 30 });
  const rotateY = useSpring(rawRotateY, { stiffness: speed, damping: 30 });
  const springScale = useSpring(rawScale, { stiffness: speed, damping: 30 });

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current || !canHover) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      glowX.set(x);
      glowY.set(y);

      // Invert: tilt away from mouse for natural 3D feel
      rawRotateX.set((0.5 - y) * maxTilt * 2);
      rawRotateY.set((x - 0.5) * maxTilt * 2);
    },
    [canHover, maxTilt, rawRotateX, rawRotateY, glowX, glowY]
  );

  const onMouseEnter = useCallback(() => {
    if (!canHover) return;
    setIsHovering(true);
    rawScale.set(scale);
  }, [canHover, scale, rawScale]);

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawScale.set(1);
    glowX.set(0.5);
    glowY.set(0.5);
  }, [rawRotateX, rawRotateY, rawScale, glowX, glowY]);

  // Glow as CSS string
  const glowPercentX = useTransform(glowX, (v) => `${v * 100}%`);
  const glowPercentY = useTransform(glowY, (v) => `${v * 100}%`);

  const style: MotionStyle = {
    perspective,
    rotateX,
    rotateY,
    scale: springScale,
    transformStyle: 'preserve-3d' as const,
  };

  return {
    ref,
    style,
    onMouseMove,
    onMouseEnter,
    onMouseLeave,
    isHovering,
    glowPercentX,
    glowPercentY,
  };
}
