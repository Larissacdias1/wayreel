// src/ui/HomeMapBackground.tsx
// Reuses FlythroughController (src/cinematic/motion/playback-controller.ts)
// with a wide, slow, looping set of waypoints as the Home/IDLE screen's
// background — not a new map integration or a parallel camera system.
//
// Loop: FlythroughController has no native loop option (the real
// destination flythrough it's shared with never loops), so the loop is
// implemented externally here by destroying and recreating a fresh
// controller on every onComplete. Trade-off: MapLibre's tile cache is lost
// on each recreate, causing a brief tile reload at the ~60s seam —
// accepted as negligible given the heavy grayscale/duotone filter
// (Home.css) applied on top.
//
// Waypoints: one representative, recognizable point per continent (Africa,
// Europe, Asia, North America, South America, Oceania), zoom 5-6 (already
// validated as legible under the duotone filter — Home.css). Not tied to
// the 5 curated RAG destinations (WAYREEL.md Section 11.5) — this is a
// generic globe-spanning ambient loop, distinct from any destination
// flythrough. Each duration (~10s) is the time spent flying to/settling on
// that point (no separate `hold`) — 6 points × 10s ≈ 60s total loop, same
// slow easing (MapLibre's default flyTo easing) as before.
import { useEffect, useRef } from "react";
import { FlythroughController } from "../cinematic/motion/playback-controller";
import type { FlythroughWaypoint } from "../cinematic/motion/camera-path";

const AMBIENT_WAYPOINTS: FlythroughWaypoint[] = [
  // Africa — southeast coast, Tanzania/Zanzibar area.
  { center: [39, -6], zoom: 5.5, pitch: 0, bearing: 0, duration: 10000 },
  // Europe — central Europe, Alpine region.
  { center: [10, 47], zoom: 5.5, pitch: 0, bearing: 0, duration: 10000 },
  // Asia — southeast Asia, Thai/Malay peninsula.
  { center: [100, 10], zoom: 5.5, pitch: 0, bearing: 0, duration: 10000 },
  // North America — Gulf of Mexico / Central America.
  { center: [-95, 20], zoom: 5.5, pitch: 0, bearing: 0, duration: 10000 },
  // South America — Brazilian southeast coast, Rio area.
  { center: [-45, -20], zoom: 5.5, pitch: 0, bearing: 0, duration: 10000 },
  // Oceania — southeastern Australia.
  { center: [148, -32], zoom: 5.5, pitch: 0, bearing: 0, duration: 10000 },
];

export default function HomeMapBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let destroyed = false;
    let controller: FlythroughController | null = null;

    function playLoop() {
      if (destroyed) return;
      controller = new FlythroughController({
        container,
        waypoints: AMBIENT_WAYPOINTS,
        reducedMotion: false,
        onComplete: () => {
          controller?.destroy();
          playLoop();
        },
      });
      void controller.play();
    }

    playLoop();

    return () => {
      destroyed = true;
      controller?.destroy();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="home-map-background"
      data-testid="home-map-background"
    />
  );
}
