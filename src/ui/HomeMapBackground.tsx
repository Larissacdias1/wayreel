// src/ui/HomeMapBackground.tsx
// Reuses FlythroughController (src/cinematic/motion/playback-controller.ts)
// with a wide, slow, looping set of waypoints as the Home/IDLE screen's
// background — not a new map integration or a parallel camera system.
//
// Loop: uses FlythroughController's opt-in `loop: true` mode (added
// specifically for this ambient/decorative use case) — restarts from
// waypoint 0 on the SAME map/controller instance when the cycle ends, no
// destroy()/recreate. The real destination flythrough (#136/#139) never
// passes `loop`, so it's completely unaffected. Fixes a real flash/pop at
// every ~60s loop seam that the previous destroy()+recreate approach had
// (WebGL canvas + tile cache were torn down and rebuilt from scratch each
// cycle).
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

    const controller = new FlythroughController({
      container: containerRef.current,
      waypoints: AMBIENT_WAYPOINTS,
      reducedMotion: false,
      loop: true,
    });
    void controller.play();

    return () => controller.destroy();
  }, []);

  return (
    <div
      ref={containerRef}
      className="home-map-background"
      data-testid="home-map-background"
    />
  );
}
