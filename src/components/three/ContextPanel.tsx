'use client';

import { useEffect, useRef, useState } from 'react';
import type { SceneNode } from '@/content/content-types';

interface ContextPanelProps {
  node: SceneNode;
  onClose: () => void;
  onPrimary: () => void;
  primaryLabel: string;
  onBack?: () => void;
  secondaryAction?: { label: string; handler: () => void };
  navigating?: boolean;
}

const FOCUS_RING = 'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-overlay';

export default function ContextPanel({
  node,
  onClose,
  onPrimary,
  primaryLabel,
  onBack,
  secondaryAction,
  navigating,
}: ContextPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Opacity fade-in on mount (Gap 21)
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Focus trap + Escape handler (Gap 5)
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    panel.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, node.id]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${node.label}`}
      tabIndex={-1}
      className={`absolute bottom-4 left-1/2 z-10 w-80 -translate-x-1/2 rounded-xl border border-accent/30 bg-surface-overlay/95 p-4 shadow-2xl backdrop-blur-md border-glow-cyan transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-accent">{node.label}</h3>
          {node.description && (
            <p className="mt-1 text-sm text-cyan-100/70">{node.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className={`ml-2 shrink-0 rounded p-1 min-h-[44px] min-w-[44px] flex items-center justify-center text-cyan-100/50 transition-colors hover:text-accent ${FOCUS_RING}`}
          aria-label="Close panel"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <button
        onClick={onPrimary}
        disabled={navigating}
        className={`mt-3 w-full rounded-lg bg-accent px-4 py-3 min-h-[44px] text-sm font-bold text-black transition-colors hover:bg-accent-hover disabled:opacity-60 ${FOCUS_RING}`}
      >
        {navigating ? (
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </span>
        ) : (
          primaryLabel
        )}
      </button>
      {secondaryAction && (
        <button
          onClick={secondaryAction.handler}
          className={`mt-2 w-full rounded-lg border border-accent/30 px-4 py-3 min-h-[44px] text-sm text-cyan-100/70 transition-colors hover:border-accent/60 hover:text-accent ${FOCUS_RING}`}
        >
          {secondaryAction.label}
        </button>
      )}
      {onBack && (
        <button
          onClick={onBack}
          className={`mt-2 w-full rounded-lg border border-accent/30 px-4 py-3 min-h-[44px] text-sm text-cyan-100/70 transition-colors hover:border-accent/60 hover:text-accent ${FOCUS_RING}`}
        >
          ← Back to System
        </button>
      )}
    </div>
  );
}
