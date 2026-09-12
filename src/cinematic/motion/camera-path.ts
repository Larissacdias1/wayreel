// src/cinematic/motion/camera-path.ts (WAYREEL.md Section 5 directory structure)
// Normative structure per WAYREEL.md Section 11.5 (ADR-008 — Destination as
// Data). The Cinematic Engine is independent of the agent/RAG layer (CLAUDE.md
// convention) — these values are NOT derived from src/rag/destinations.ts's
// `flythrough` field (an older, separate `CameraWaypoint`/`coordinates`
// interface used by the RAG/domain layer); this file is its own source of
// truth for the cinematic engine.
//
// [DECISION REQUIRED] (WAYREEL.md Section 11.5, still open) real camera
// paths for mardin, sigiriya, chefchaouen, and jiufen have not been curated
// or tested in MapLibre per the Section 9.3 checklist. Per user decision
// (issue #134): only Setenil ships with a real, functional flythrough
// (Section 11.1, frozen values below). The other 4 use a single static
// waypoint centered on the destination — the same interim pattern already
// confirmed for src/rag/destinations.ts's `flythrough.waypoints` (2026-09-01,
// #104) — so the flythrough controller (#136) can treat it as a static shot
// consistent with the prefers-reduced-motion fallback (Section 11.3), not a
// real flythrough, until curated in Roadmap Phase 1 (Section 15.3).

export interface FlythroughWaypoint {
  center: [number, number]; // [lng, lat]
  zoom: number;
  pitch: number;
  bearing: number;
  duration: number; // ms of transition to this waypoint
  hold?: number; // ms of pause at this waypoint before the next
}

// setenil: frozen values, WAYREEL.md Section 11.1 — the source of truth;
// any other value for Setenil is outdated.
export const CAMERA_PATHS: Record<string, FlythroughWaypoint[]> = {
  setenil: [
    {
      center: [-5.179, 36.786],
      zoom: 14,
      pitch: 60,
      bearing: 0,
      duration: 4000,
      hold: 1000,
    },
    {
      center: [-5.18, 36.787],
      zoom: 16,
      pitch: 70,
      bearing: 90,
      duration: 4000,
    },
    {
      center: [-5.178, 36.785],
      zoom: 13,
      pitch: 45,
      bearing: 180,
      duration: 3000,
    },
  ],
  mardin: [
    {
      center: [40.735, 37.31306],
      zoom: 14,
      pitch: 60,
      bearing: 0,
      duration: 12000,
    },
  ],
  sigiriya: [
    {
      center: [80.75972, 7.95694],
      zoom: 14,
      pitch: 60,
      bearing: 0,
      duration: 12000,
    },
  ],
  chefchaouen: [
    {
      center: [-5.26972, 35.17139],
      zoom: 14,
      pitch: 60,
      bearing: 0,
      duration: 12000,
    },
  ],
  jiufen: [
    {
      center: [121.8435, 25.1088],
      zoom: 14,
      pitch: 60,
      bearing: 0,
      duration: 12000,
    },
  ],
};
