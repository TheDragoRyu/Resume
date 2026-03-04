'use client';

import { useState, useRef, useCallback } from 'react';
import type { SceneNode } from '@/content/content-types';

interface SceneKeyboardNavProps {
  nodes: SceneNode[];
  onSelect: (node: SceneNode) => void;
  label: string;
}

/**
 * DOM overlay providing keyboard access to 3D scene nodes.
 * Visually hidden until focused, uses roving tabindex with arrow keys.
 */
export default function SceneKeyboardNav({ nodes, onSelect, label }: SceneKeyboardNavProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let next = activeIndex;
      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          next = (activeIndex + 1) % nodes.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          next = (activeIndex - 1 + nodes.length) % nodes.length;
          break;
        case 'Home':
          e.preventDefault();
          next = 0;
          break;
        case 'End':
          e.preventDefault();
          next = nodes.length - 1;
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(nodes[activeIndex]);
          return;
        default:
          return;
      }
      setActiveIndex(next);
      const items = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
      items?.[next]?.focus();
    },
    [activeIndex, nodes, onSelect],
  );

  if (nodes.length === 0) return null;

  return (
    <div className="absolute left-0 top-0 z-20">
      <ul
        ref={listRef}
        role="listbox"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:left-4 focus-within:top-16 focus-within:z-30 focus-within:w-56 focus-within:rounded-lg focus-within:border focus-within:border-accent/30 focus-within:bg-surface-overlay/95 focus-within:p-2 focus-within:shadow-xl focus-within:backdrop-blur-md"
      >
        {nodes.map((node, i) => (
          <li
            key={node.id}
            role="option"
            aria-selected={i === activeIndex}
            tabIndex={i === activeIndex ? 0 : -1}
            onClick={() => onSelect(node)}
            className="cursor-pointer rounded px-3 py-2 text-sm text-cyan-100/80 outline-none focus:bg-accent/20 focus:text-accent aria-selected:bg-accent/10"
          >
            {node.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
