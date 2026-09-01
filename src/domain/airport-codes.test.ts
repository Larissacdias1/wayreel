import { cityToIata } from "./airport-codes";

describe("cityToIata", () => {
  it("resolves 'sao paulo' to GRU", () => {
    expect(cityToIata("sao paulo")).toBe("GRU");
  });

  it("resolves 'Lisboa' to LIS, case-insensitively", () => {
    expect(cityToIata("Lisboa")).toBe("LIS");
  });

  it("resolves '  Madrid  ' to MAD, trimming whitespace", () => {
    expect(cityToIata("  Madrid  ")).toBe("MAD");
  });

  it("resolves an abbreviation alias ('rj') to GIG", () => {
    expect(cityToIata("rj")).toBe("GIG");
  });

  it("returns null for a city not in the table", () => {
    expect(cityToIata("Timbuktu")).toBeNull();
  });
});
