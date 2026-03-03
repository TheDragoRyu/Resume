'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'performance-mode';

export function usePerformanceMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setEnabled(true);
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { performanceMode: enabled, togglePerformanceMode: toggle };
}
