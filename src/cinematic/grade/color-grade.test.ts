import { COLOR_GRADES } from "./color-grade";

const EXPECTED_DESTINATION_IDS = [
  "setenil",
  "mardin",
  "sigiriya",
  "chefchaouen",
  "jiufen",
];

describe("COLOR_GRADES", () => {
  it("has exactly the 5 MVP destinations (WAYREEL.md Section 9.1)", () => {
    expect(Object.keys(COLOR_GRADES).sort()).toEqual(
      EXPECTED_DESTINATION_IDS.sort(),
    );
  });

  it.each(EXPECTED_DESTINATION_IDS)(
    "%s has a filter and an overlay defined",
    (id) => {
      const grade = COLOR_GRADES[id];
      expect(grade).toBeDefined();
      expect(typeof grade!.filter).toBe("string");
      expect(grade!.filter.length).toBeGreaterThan(0);
      expect(typeof grade!.overlay).toBe("string");
      expect(grade!.overlay.length).toBeGreaterThan(0);
    },
  );

  it("setenil matches the frozen warm_andalusian grade from WAYREEL.md Section 11.1", () => {
    expect(COLOR_GRADES.setenil).toEqual({
      filter: "sepia(0.2) contrast(1.1) saturate(1.2)",
      overlay:
        "linear-gradient(to bottom, rgba(255,200,100,0.1), rgba(0,0,0,0.3))",
    });
  });

  it.each(["mardin", "sigiriya", "chefchaouen", "jiufen"])(
    "%s uses the neutral passthrough grade (not curated yet)",
    (id) => {
      expect(COLOR_GRADES[id]).toEqual({ filter: "none", overlay: "none" });
    },
  );
});
