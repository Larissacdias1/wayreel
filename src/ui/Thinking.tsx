// src/ui/Thinking.tsx
// Source of truth: issue #141 DoD — "CSS particles, blur, copy, 3s
// timeout". WAYREEL.md Section 7 — "THINKING (short autoplay, max 3s,
// guaranteed timeout)... 3s timeout ──► 'try again' fallback". The
// timedOut/RETRY state transition itself was already implemented in
// experience-state.ts (#137) — this component owns the actual 3s timer and
// the visible overlay (particles/blur/copy), which didn't exist yet.
//
// [DECISION REQUIRED resolved with user input, #141] no specific particle
// count/size, blur radius, or copy text is documented anywhere — see
// Thinking.css's header comment for the minimal, non-creative values used.

import { useEffect } from "react";
import "./Thinking.css";

export const THINKING_TIMEOUT_MS = 3000;

export interface ThinkingProps {
  timedOut: boolean;
  onTimeout: () => void;
  onRetry: () => void;
}

export default function Thinking({
  timedOut,
  onTimeout,
  onRetry,
}: ThinkingProps) {
  // Section 7, rule 4 — "THINKING has a hard 3s timeout".
  useEffect(() => {
    if (timedOut) return;
    const timer = setTimeout(onTimeout, THINKING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [timedOut, onTimeout]);

  return (
    <div className="thinking-overlay" data-component="Thinking">
      <div className="thinking-particles">
        {Array.from({ length: 6 }).map((_, index) => (
          <span
            key={index}
            className="thinking-particle"
            style={{
              left: `${index * 20}px`,
              animationDelay: `${index * 0.15}s`,
            }}
          />
        ))}
      </div>

      {timedOut ? (
        <>
          <p>Something took too long.</p>
          <button onClick={onRetry}>Try again</button>
        </>
      ) : (
        <p>Finding your destination...</p>
      )}
    </div>
  );
}
