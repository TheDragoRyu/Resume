'use client';

import posthog from 'posthog-js';

interface TrackClickProps {
  event: string;
  properties?: Record<string, string | number | boolean>;
  children: React.ReactNode;
}

export default function TrackClick({ event, properties, children }: TrackClickProps) {
  return (
    <span onClick={() => posthog.capture(event, properties)} className="contents">
      {children}
    </span>
  );
}
