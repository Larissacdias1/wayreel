// src/cinematic/grade/color-grade.ts (WAYREEL.md Section 5 directory structure)
// Normative structure per WAYREEL.md Section 11.5 (ADR-008 — Destination as
// Data). The Cinematic Engine is independent of the agent/RAG layer
// (CLAUDE.md convention) — these values are NOT derived from
// src/rag/destinations.ts's `grade_profile` field (a string label with no
// CSS value attached); this file is its own source of truth for the
// cinematic engine, mirroring src/cinematic/motion/camera-path.ts's pattern.
//
// [DECISION REQUIRED] (parallel to WAYREEL.md Section 11.5's waypoint gap,
// same nature) only Setenil has a real, documented color grade
// (`warm_andalusian`, Section 11.1, frozen). No CSS filter/overlay value is
// documented anywhere for the other 4 destinations' `grade_profile:
// "default"` label (src/rag/destinations.ts). Per user decision (issue
// #135): the other 4 destinations get a neutral passthrough grade (no
// filter, no overlay) — signaling "not curated yet", not a real creative
// treatment — until curated in Roadmap Phase 1 (Section 15.3), same spirit
// as the camera-path.ts static fallback (#134).

export interface ColorGrade {
  filter: string; // CSS filter applied to the MapLibre canvas
  overlay: string; // CSS gradient, mixBlendMode "overlay"
}

// setenil: frozen values, WAYREEL.md Section 11.1 — the source of truth;
// any other value for Setenil is outdated.
export const COLOR_GRADES: Record<string, ColorGrade> = {
  setenil: {
    filter: "sepia(0.2) contrast(1.1) saturate(1.2)",
    overlay:
      "linear-gradient(to bottom, rgba(255,200,100,0.1), rgba(0,0,0,0.3))",
  },
  mardin: {
    filter: "none",
    overlay: "none",
  },
  sigiriya: {
    filter: "none",
    overlay: "none",
  },
  chefchaouen: {
    filter: "none",
    overlay: "none",
  },
  jiufen: {
    filter: "none",
    overlay: "none",
  },
};
