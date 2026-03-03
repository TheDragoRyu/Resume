'use client';

import { useEffect, useRef } from 'react';
import type { SceneNode } from '@/content/content-types';

interface ContextPanelProps {
  node: SceneNode;
  onClose: () => void;
  onOpen: () => void;
}

export default function ContextPanel({ node, onClose, onOpen }: ContextPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, [node.id]);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Details for ${node.label}`}
      tabIndex={-1}
      className="absolute bottom-4 left-1/2 z-10 w-80 -translate-x-1/2 rounded-xl border border-accent/30 bg-surface-overlay/95 p-4 shadow-2xl backdrop-blur-md border-glow-cyan"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-accent">{node.label}</h3>
          {node.description && (
            <p className="mt-1 text-sm text-cyan-100/50">{node.description}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 rounded p-1 text-cyan-100/50 transition-colors hover:text-accent"
          aria-label="Close panel"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <button
        onClick={onOpen}
        className="mt-3 w-full rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-accent-hover"
      >
        Open
      </button>
    </div>
  );
}
