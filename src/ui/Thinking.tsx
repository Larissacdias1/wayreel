// src/ui/Thinking.tsx
// Source of truth: issue #141 DoD — "CSS particles, blur, copy, timeout".
// WAYREEL.md Section 7 — "THINKING (short autoplay, max 20s, guaranteed
// timeout)... 20s timeout ──► 'try again' fallback". The timedOut/RETRY
// state transition itself was already implemented in experience-state.ts
// (#137) — this component owns the actual timer and the visible overlay
// (particles/blur/copy), which didn't exist yet.
//
// [DECISION REQUIRED resolved with user input, #141] no specific particle
// count/size, blur radius, or copy text is documented anywhere — see
// Thinking.css's header comment for the minimal, non-creative values used.
//
// Timeout corrected from 3000 to 20000: measured directly via 5 real Chat
// round trips (extractIntent + retrieveContext + recommendDestination,
// each a real Gemini call) — 7.9s/8.2s/9.0s/12.4s/15.7s, all well above the
// original 3s. At 3s, every real conversation hit "try again" while the
// actual response was still in flight server-side and landed moments
// later anyway (see App.tsx's AbortController wiring, which now cancels
// that in-flight request instead of letting its late result silently
// change scene state). See WAYREEL.md Section 7 for the full note.

import { useEffect } from "react";
import "./Thinking.css";

export const THINKING_TIMEOUT_MS = 20000;

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
          <button className="btn-primary" onClick={onRetry}>
            Try again
          </button>
        </>
      ) : (
        <p className="thinking-status">Finding your destination...</p>
      )}
    </div>
  );
}
