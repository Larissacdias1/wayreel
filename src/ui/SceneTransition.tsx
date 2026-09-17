// src/ui/SceneTransition.tsx
// Single, central place for scene-change animation (per user decision) —
// individual scene components (Chat, Thinking, Flythrough, TravelOptions,
// etc.) know nothing about this; App.tsx wraps whichever scene it renders.
//
// No new dependency: plain CSS opacity transition + React state. On a
// sceneKey change, fades the outgoing scene out first (var(--motion-slow),
// 800ms), then swaps to the new scene's content and fades it in over the
// same duration — a sequential cross-fade, not a simultaneous double-buffer
// one (that would need both scenes mounted at once, which isn't achievable
// with plain CSS + key alone). If a true simultaneous crossfade is ever
// needed, that's a library question — flag it, don't add one silently.

import { useEffect, useRef, useState, type ReactNode } from "react";

const TRANSITION_MS = 800; // matches var(--motion-slow)

export interface SceneTransitionProps {
  sceneKey: string;
  children: ReactNode;
}

export default function SceneTransition({
  sceneKey,
  children,
}: SceneTransitionProps) {
  const [displayKey, setDisplayKey] = useState(sceneKey);
  const [visible, setVisible] = useState(true);
  const frozenContent = useRef<ReactNode>(children);

  if (displayKey === sceneKey) {
    // Same scene: keep content live (e.g. new chat messages), no fade.
    frozenContent.current = children;
  }

  useEffect(() => {
    if (sceneKey === displayKey) return;

    setVisible(false); // fade the outgoing scene out
    const timeout = setTimeout(() => {
      setDisplayKey(sceneKey); // swap content only after the fade-out
      setVisible(true); // then fade the new scene in
    }, TRANSITION_MS);

    return () => clearTimeout(timeout);
  }, [sceneKey, displayKey]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity var(--motion-slow) ease`,
      }}
    >
      {frozenContent.current}
    </div>
  );
}
