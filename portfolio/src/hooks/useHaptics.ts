/**
 * Haptic feedback hook — wraps the Web Vibration API.
 *
 * Provides named vibration patterns for UI interactions.
 * Gracefully degrades to a no-op on unsupported browsers (desktop, iOS).
 */

import { useCallback, useMemo } from 'react';

type HapticPattern = 'tap' | 'scroll' | 'success' | 'error';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  tap: 15,
  scroll: 10,
  success: [10, 50, 20],
  error: [30, 30, 30, 30, 50],
};

export function useHaptics() {
  const isSupported = useMemo(
    () => typeof navigator !== 'undefined' && 'vibrate' in navigator,
    []
  );

  const trigger = useCallback(
    (pattern: HapticPattern = 'tap') => {
      if (!isSupported) return;
      try {
        navigator.vibrate(PATTERNS[pattern]);
      } catch {
        // Silently swallow — some browsers expose the API but throw
      }
    },
    [isSupported]
  );

  return { trigger, isSupported };
}
