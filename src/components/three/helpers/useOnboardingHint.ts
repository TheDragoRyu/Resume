'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'scene-onboarding-dismissed';

export function useOnboardingHint() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      if (!sessionStorage.getItem(STORAGE_KEY)) {
        setShowHint(true);
      }
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // sessionStorage unavailable
    }
  }, []);

  return { showHint, dismissHint };
}
