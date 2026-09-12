// src/cinematic/motion/playback-controller.ts (WAYREEL.md Section 5 directory structure)
// Source of truth: WAYREEL.md Section 11.2 (Implementation rules) and
// Section 11.3 (prefers-reduced-motion Fallback). Issue #136's title says
// "cinematic/flythrough.ts", but Section 5 lists this module as
// `motion/playback-controller.ts` — same naming mismatch already resolved
// for #134/#135, kept consistent here.
//
// ADR-007 (Motion and Grade are independent): this controller only handles
// camera movement (play/pause/skip/destroy) — it does not know about or
// apply color grades (src/cinematic/grade/color-grade.ts). Applying a
// grade's CSS filter/overlay to the map container is a rendering-layer
// concern for whichever component wraps this controller.

import type { FlythroughWaypoint } from "./camera-path";

// WAYREEL.md Section 11.2 — "MapLibre GL JS with OpenFreeMap tiles".
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// The minimal MapLibre surface this controller depends on. Real MapLibre
// requires a WebGL canvas context, unavailable in Jest's "node" test
// environment (jest.config.cjs) — injecting this interface (mirroring the
// FlightProvider pattern in src/mcp/) lets tests supply a fake map and
// verify play/pause/skip/destroy sequencing deterministically, without
// depending on real WebGL rendering (verified instead via Playwright E2E).
export interface FlythroughMap {
  flyTo(options: {
    center: [number, number];
    zoom: number;
    pitch: number;
    bearing: number;
    duration: number;
  }): void;
  once(event: "moveend", handler: () => void): void;
  stop(): void;
  remove(): void;
}

export type MapFactory = (
  container: HTMLElement,
) => FlythroughMap | Promise<FlythroughMap>;

// maplibre-gl ships ESM-only (no CJS build), so it is dynamically imported
// here rather than statically at the top of the module — a static import
// would make Jest fail to load this file entirely (jest.config.cjs's
// "node" test environment has no WebGL context anyway, and tests always
// inject their own mapFactory, never reaching this function).
const defaultMapFactory: MapFactory = async (container) => {
  const { Map: MapLibreMap } = await import("maplibre-gl");
  return new MapLibreMap({
    container,
    style: MAP_STYLE_URL,
    // Section 11.2 — "attributionControl: true — mandatory (OSM license)".
    // MapLibre's type only accepts `false` or an options object (enabling
    // it is the default), so an empty options object is the explicit "on".
    attributionControl: {},
    interactive: false,
  }) as unknown as FlythroughMap;
};

export type PlaybackState =
  "idle" | "playing" | "paused" | "skipped" | "destroyed";

export interface FlythroughControllerOptions {
  container: HTMLElement;
  waypoints: FlythroughWaypoint[];
  // Section 11.3 — "Skips the entire flythrough" when true. The caller
  // (a future UI component) determines this via
  // window.matchMedia('(prefers-reduced-motion: reduce)').
  reducedMotion: boolean;
  mapFactory?: MapFactory;
  onComplete?: () => void;
  // Section 11.4 (HUD Overlay) — "updates on every waypoint change". Added
  // during #139: the HudOverlay component needs the real-time active
  // waypoint, which this controller previously had no way to expose
  // (getState() only reports playback lifecycle, not position).
  onWaypointChange?: (waypoint: FlythroughWaypoint, index: number) => void;
}

export class FlythroughController {
  private map: FlythroughMap | null = null;
  private state: PlaybackState = "idle";
  private currentIndex = 0;
  private abortController: AbortController | null = null;
  private readonly options: FlythroughControllerOptions;

  constructor(options: FlythroughControllerOptions) {
    this.options = options;
  }

  getState(): PlaybackState {
    return this.state;
  }

  async play(): Promise<void> {
    if (this.state === "destroyed") return;

    // Section 11.3 — reduced motion skips the flythrough entirely, no map
    // is ever instantiated.
    if (this.options.reducedMotion) {
      this.state = "skipped";
      this.options.onComplete?.();
      return;
    }

    if (!this.map) {
      // Section 11.2 — "Lazy load: the map is only instantiated when
      // FLYTHROUGH is activated".
      const factory = this.options.mapFactory ?? defaultMapFactory;
      this.map = await factory(this.options.container);
    }

    this.state = "playing";
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    for (let i = this.currentIndex; i < this.options.waypoints.length; i++) {
      if (signal.aborted) return;
      this.currentIndex = i;
      const waypoint = this.options.waypoints[i];
      if (!waypoint) continue;

      this.options.onWaypointChange?.(waypoint, i);
      await this.flyToWaypoint(waypoint, signal);
      if (signal.aborted) return;

      if (waypoint.hold) {
        await this.wait(waypoint.hold, signal);
        if (signal.aborted) return;
      }
    }

    if (this.state === "playing") {
      this.currentIndex = this.options.waypoints.length;
      this.state = "idle";
      this.options.onComplete?.();
    }
  }

  // Section 11.2 — "Interruptible playback — AbortController to cancel
  // pending waypoints". Resuming (calling play() again) continues from the
  // waypoint that was in progress when paused.
  pause(): void {
    if (this.state !== "playing") return;
    this.abortController?.abort();
    this.map?.stop();
    this.state = "paused";
  }

  skip(): void {
    if (this.state === "destroyed") return;
    this.abortController?.abort();
    this.map?.stop();
    this.state = "skipped";
    this.options.onComplete?.();
  }

  // Section 11.2 — "Mandatory cleanup on unmount: map.remove() + cancel
  // animation frames".
  destroy(): void {
    this.abortController?.abort();
    this.map?.remove();
    this.map = null;
    this.state = "destroyed";
  }

  private flyToWaypoint(
    waypoint: FlythroughWaypoint,
    signal: AbortSignal,
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.map) {
        resolve();
        return;
      }
      const onAbort = () => resolve();
      signal.addEventListener("abort", onAbort, { once: true });
      this.map.once("moveend", () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      });
      this.map.flyTo({
        center: waypoint.center,
        zoom: waypoint.zoom,
        pitch: waypoint.pitch,
        bearing: waypoint.bearing,
        duration: waypoint.duration,
      });
    });
  }

  private wait(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    });
  }
}
