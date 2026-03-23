import { useState, useEffect, useRef, useCallback } from "react";

interface DraftState<T> {
  hasDraft: boolean;
  draftAge: string | null;
  restoreDraft: () => T | null;
  clearDraft: () => void;
  dismissDraft: () => void;
}

export function useFormDraft<T>(key: string, currentState: T): DraftState<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftAge, setDraftAge] = useState<string | null>(null);
  const dismissed = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { savedAt } = JSON.parse(raw);
        const ago = Math.round((Date.now() - savedAt) / 60000);
        setDraftAge(ago < 1 ? "just now" : ago < 60 ? `${ago}m ago` : `${Math.round(ago / 60)}h ago`);
        setHasDraft(true);
      }
    } catch { /* ignore */ }
  }, [key]);

  // Debounced save
  useEffect(() => {
    if (dismissed.current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify({ state: currentState, savedAt: Date.now() }));
      } catch { /* quota exceeded */ }
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [key, currentState]);

  const restoreDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const { state } = JSON.parse(raw);
        setHasDraft(false);
        return state as T;
      }
    } catch { /* ignore */ }
    return null;
  }, [key]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(key);
    setHasDraft(false);
  }, [key]);

  const dismissDraft = useCallback(() => {
    dismissed.current = true;
    localStorage.removeItem(key);
    setHasDraft(false);
  }, [key]);

  return { hasDraft, draftAge, restoreDraft, clearDraft, dismissDraft };
}
