/**
 * Scroll milestone haptics — fires a gentle pulse when sections enter viewport.
 *
 * Each section triggers only once per page load (tracked via Set).
 * Uses IntersectionObserver for zero-cost scroll detection.
 */

import { useEffect, useRef } from 'react';
import { useHaptics } from './useHaptics';

export function useScrollHaptics(sectionIds: string[]) {
  const { trigger, isSupported } = useHaptics();
  const triggered = useRef(new Set<string>());

  useEffect(() => {
    if (!isSupported) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (
            entry.isIntersecting &&
            !triggered.current.has(entry.target.id)
          ) {
            triggered.current.add(entry.target.id);
            trigger('scroll');
          }
        }
      },
      { threshold: 0.3 }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sectionIds, trigger, isSupported]);
}
