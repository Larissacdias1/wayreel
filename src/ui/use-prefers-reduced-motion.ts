// src/ui/use-prefers-reduced-motion.ts
// Extracted from App.tsx (#137) so Flythrough.tsx (#139) can reuse the same
// detection instead of duplicating it. Source of truth: WAYREEL.md Section
// 11.3 ("prefers-reduced-motion: skips straight to REVEAL with static
// cards").

import { useEffect, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}
