// src/cinematic/components/HudOverlay.tsx (WAYREEL.md Section 5, ADR-026)
// Source of truth: WAYREEL.md Section 11.4. "Not a new feature — it is a
// presentation of the existing data from table 11.1." Not coupled to the
// agent, RAG, or MCP (Section 11.4 implementation rules) — receives the
// current waypoint as a prop from whoever owns the FlythroughController
// (ui/Flythrough.tsx, #139), rather than reading any agent/RAG state
// itself.

import type { FlythroughWaypoint } from "../motion/camera-path";

export interface HudOverlayProps {
  waypoint: FlythroughWaypoint | null;
  destinationName: string;
}

export default function HudOverlay({
  waypoint,
  destinationName,
}: HudOverlayProps) {
  // Section 11.4 — "No entrance/exit animation of its own — syncs with the
  // controller's waypoint change": nothing to show before the first one.
  if (!waypoint) return null;

  const [lng, lat] = waypoint.center;

  return (
    <div
      data-component="HudOverlay"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        fontFamily: "var(--font-mono)",
        // Section 11.4 — "Monospaced font, opacity 0.6-0.7".
        opacity: 0.65,
        // Section 11.4 — "Color derived from the destination's active color
        // grade... never a generic white". Only Setenil has a real curated
        // grade (warm_andalusian, #135); its warm tone is the accent color
        // already frozen in Section 11 and reused by ADR-028
        // (--accent: #ffb37a). The other 4 destinations have no curated
        // grade to derive a different tone from (#135's neutral passthrough
        // interim), so this reuses the same token rather than inventing one.
        color: "var(--accent)",
        whiteSpace: "pre",
      }}
    >
      {`COORD  ${lng}°W  ${lat}°N\nALT    ZOOM ${waypoint.zoom} · PITCH ${waypoint.pitch}° · BRG ${waypoint.bearing}°\nDEST   ${destinationName}`}
    </div>
  );
}
