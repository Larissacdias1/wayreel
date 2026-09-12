import { CAMERA_PATHS } from "./camera-path";

const EXPECTED_DESTINATION_IDS = [
  "setenil",
  "mardin",
  "sigiriya",
  "chefchaouen",
  "jiufen",
];

describe("CAMERA_PATHS", () => {
  it("has exactly the 5 MVP destinations (WAYREEL.md Section 9.1)", () => {
    expect(Object.keys(CAMERA_PATHS).sort()).toEqual(
      EXPECTED_DESTINATION_IDS.sort(),
    );
  });

  it.each(EXPECTED_DESTINATION_IDS)(
    "%s has at least one waypoint with a valid format",
    (id) => {
      const waypoints = CAMERA_PATHS[id];
      expect(waypoints).toBeDefined();
      expect(waypoints!.length).toBeGreaterThan(0);

      for (const waypoint of waypoints!) {
        expect(waypoint.center).toHaveLength(2);
        const [lng, lat] = waypoint.center;
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
        expect(waypoint.zoom).toBeGreaterThan(0);
        expect(waypoint.pitch).toBeGreaterThanOrEqual(0);
        expect(waypoint.bearing).toBeGreaterThanOrEqual(0);
        expect(waypoint.duration).toBeGreaterThan(0);
      }
    },
  );

  // ADR-014: flythrough capped at 12s.
  it.each(EXPECTED_DESTINATION_IDS)(
    "%s's total duration (transitions + holds) does not exceed the 12s cap",
    (id) => {
      const waypoints = CAMERA_PATHS[id];
      expect(waypoints).toBeDefined();
      const totalMs = waypoints!.reduce(
        (sum, wp) => sum + wp.duration + (wp.hold ?? 0),
        0,
      );
      expect(totalMs).toBeLessThanOrEqual(12000);
    },
  );

  it("setenil matches the frozen values from WAYREEL.md Section 11.1", () => {
    expect(CAMERA_PATHS.setenil).toEqual([
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
    ]);
  });
});
