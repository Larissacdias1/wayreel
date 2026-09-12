// src/ui/Flythrough.tsx
// Source of truth: issue #139 DoD — "Integration with controller, skip
// button after 3s, cleanup". WAYREEL.md Section 11.2 implementation rules:
// lazy map instantiation (handled by FlythroughController itself, #136),
// "Skip button: absolute position bottom-right, appears with opacity: 0 → 1
// after 3s", and "Mandatory cleanup on unmount: map.remove() + cancel
// animation frames" (also handled by the controller's destroy()).
//
// Fixed after initial review: this component used to always instantiate
// FlythroughController and call play() regardless of reducedMotion, relying
// on the controller's own internal skip (#136) to fire onComplete — which
// transitions scenes correctly but never rendered the visible static
// fallback Section 11.3 requires. It now checks reducedMotion BEFORE
// creating any controller and renders ReducedMotionFallback instead.
//
// Also wires HudOverlay (Section 11.4, ADR-026) via the controller's new
// onWaypointChange callback (added during #139 — the controller previously
// had no way to expose the real-time active waypoint).

import { useEffect, useRef, useState } from "react";
import {
  CAMERA_PATHS,
  type FlythroughWaypoint,
} from "../cinematic/motion/camera-path";
import { FlythroughController } from "../cinematic/motion/playback-controller";
import HudOverlay from "../cinematic/components/HudOverlay";
import ReducedMotionFallback from "../cinematic/components/ReducedMotionFallback";
import { usePrefersReducedMotion } from "./use-prefers-reduced-motion";

const SKIP_BUTTON_DELAY_MS = 3000;

export interface FlythroughProps {
  destinationId: string;
  // Optional until the REVEAL/App wiring (#142) has a real display name to
  // pass — defaults to destinationId so HudOverlay's DEST field is never
  // blank. Not read from src/rag/destinations.ts here: the cinematic layer
  // stays independent of the agent/RAG layer (CLAUDE.md convention).
  destinationName?: string;
  onComplete: () => void;
}

export default function Flythrough({
  destinationId,
  destinationName,
  onComplete,
}: FlythroughProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<FlythroughController | null>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [currentWaypoint, setCurrentWaypoint] =
    useState<FlythroughWaypoint | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  // Section 11.2 — "The skip button appears in FLYTHROUGH after 3 seconds".
  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setShowSkip(true), SKIP_BUTTON_DELAY_MS);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  useEffect(() => {
    // Section 11.3 — reduced motion never instantiates the map/controller
    // at all; ReducedMotionFallback (rendered below) handles the scene.
    if (reducedMotion) return;
    if (!containerRef.current) return;

    const controller = new FlythroughController({
      container: containerRef.current,
      waypoints: CAMERA_PATHS[destinationId] ?? [],
      reducedMotion,
      onComplete,
      onWaypointChange: (waypoint) => setCurrentWaypoint(waypoint),
    });
    controllerRef.current = controller;
    void controller.play();

    // Section 11.2 — "Mandatory cleanup on unmount: map.remove() + cancel
    // animation frames" (handled inside FlythroughController.destroy()).
    return () => {
      controller.destroy();
      controllerRef.current = null;
      setCurrentWaypoint(null);
    };
  }, [destinationId, reducedMotion, onComplete]);

  function handleSkip() {
    controllerRef.current?.skip();
  }

  if (reducedMotion) {
    return (
      <ReducedMotionFallback
        destinationId={destinationId}
        onComplete={onComplete}
      />
    );
  }

  return (
    <div data-component="Flythrough">
      <div ref={containerRef} data-testid="flythrough-map" />
      <HudOverlay
        waypoint={currentWaypoint}
        destinationName={destinationName ?? destinationId}
      />
      <button
        onClick={handleSkip}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          opacity: showSkip ? 1 : 0,
          pointerEvents: showSkip ? "auto" : "none",
          transition: "opacity 400ms",
        }}
      >
        Skip
      </button>
    </div>
  );
}
