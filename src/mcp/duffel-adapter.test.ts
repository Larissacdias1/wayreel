import { DuffelAdapter } from "./duffel-adapter";
import type { FlightSearchInput } from "../domain/types";

const input: FlightSearchInput = {
  origin: "GRU",
  destination: "AGP",
  departure_date: "2026-10-01",
  passengers: 1,
};

describe("DuffelAdapter", () => {
  it("is not activated — search() throws rather than calling a real API", async () => {
    const adapter = new DuffelAdapter();
    await expect(adapter.search(input)).rejects.toThrow(
      "DuffelAdapter is not implemented yet",
    );
  });
});
