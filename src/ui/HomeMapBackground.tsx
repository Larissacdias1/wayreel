// src/ui/HomeMapBackground.tsx
// Reuses FlythroughController (src/cinematic/motion/playback-controller.ts,
// #136/#139) as a static map background for the IDLE screen — not a new
// map integration. A single waypoint with no hold and a minimal duration
// makes the controller park the camera there once play() resolves, with
// no further animation, no waypoint changes, and (since the controller
// already sets interactive: false on the underlying MapLibre instance)
// no user pan/zoom.
//
// Visual treatment (filter/overlay/drift) lives entirely in Home.css and
// is applied to this component's container via className — the CSS
// invert+hue-rotate dark-mode trick and the slow scale drift never touch
// the controller itself, per user decision after comparing OpenFreeMap's
// native dark styles (Dark/Fiord — both confirmed too low-contrast to use
// as-is) against Liberty + CSS filter.

import { useEffect, useRef } from "react";
import { FlythroughController } from "../cinematic/motion/playback-controller";
import type { FlythroughWaypoint } from "../cinematic/motion/camera-path";

// A neutral, non-destination point (mid-Atlantic) — low zoom so
// continents/relief are visible but subtle.
const NEUTRAL_WAYPOINT: FlythroughWaypoint = {
  center: [-30, 30],
  zoom: 2,
  pitch: 0,
  bearing: 0,
  duration: 1,
};

export default function HomeMapBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const controller = new FlythroughController({
      container: containerRef.current,
      waypoints: [NEUTRAL_WAYPOINT],
      reducedMotion: false,
    });
    void controller.play();

    return () => {
      controller.destroy();
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
