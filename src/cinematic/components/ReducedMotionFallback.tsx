// src/cinematic/components/ReducedMotionFallback.tsx (WAYREEL.md Section 5)
// Source of truth: WAYREEL.md Section 11.3 — "prefers-reduced-motion: Skips
// the entire flythrough. Goes straight to REVEAL with a static image + info
// cards."
//
// Real destination imagery/info cards don't exist yet — no REVEAL-scene
// component is on the board (only ui/App.tsx, Chat.tsx, Flythrough.tsx,
// TravelOptions.tsx). This renders a minimal, clearly visible static
// placeholder in place of the flythrough animation (not silence — bug
// found and fixed during #139) and hands control back immediately via
// onComplete, matching "skips... goes straight to REVEAL" (no timer, no
// animation of its own).

import { useEffect } from "react";

export interface ReducedMotionFallbackProps {
  destinationId: string;
  onComplete: () => void;
}

export default function ReducedMotionFallback({
  destinationId,
  onComplete,
}: ReducedMotionFallbackProps) {
  useEffect(() => {
    onComplete();
  }, [destinationId, onComplete]);

  return (
    <div
      data-component="ReducedMotionFallback"
      data-destination-id={destinationId}
    >
      <p>{destinationId}</p>
    </div>
  );
}
