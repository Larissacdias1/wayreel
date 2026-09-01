import {
  TravelIntentSchema,
  FlightSearchInputSchema,
  DestinationRecommendationSchema,
  UserMessageSchema,
} from "./schemas";

describe("TravelIntentSchema", () => {
  it("accepts a valid intent", () => {
    expect(
      TravelIntentSchema.safeParse({
        vibe: "romantic",
        budget_level: "medium",
        origin_iata: "GRU",
        passengers: 2,
        dates_flexibility: "fixed",
        departure_date: "2026-09-01",
      }).success,
    ).toBe(true);
  });

  it("rejects an invalid budget_level", () => {
    expect(
      TravelIntentSchema.safeParse({ budget_level: "super-high" }).success,
    ).toBe(false);
  });

  it("rejects an origin_iata with the wrong length", () => {
    expect(TravelIntentSchema.safeParse({ origin_iata: "GRUX" }).success).toBe(
      false,
    );
  });

  it("rejects a departure_date in the wrong format", () => {
    expect(
      TravelIntentSchema.safeParse({ departure_date: "01-09-2026" }).success,
    ).toBe(false);
  });
});

describe("FlightSearchInputSchema", () => {
  it("accepts a valid input", () => {
    expect(
      FlightSearchInputSchema.safeParse({
        origin: "GRU",
        destination: "AGP",
        departure_date: "2026-09-01",
        passengers: 1,
      }).success,
    ).toBe(true);
  });

  it("rejects input missing required fields", () => {
    expect(FlightSearchInputSchema.safeParse({ origin: "GRU" }).success).toBe(
      false,
    );
  });

  it("rejects an invalid class", () => {
    expect(
      FlightSearchInputSchema.safeParse({
        origin: "GRU",
        destination: "AGP",
        departure_date: "2026-09-01",
        passengers: 1,
        class: "vip",
      }).success,
    ).toBe(false);
  });
});

describe("DestinationRecommendationSchema", () => {
  it("accepts a valid recommendation", () => {
    expect(
      DestinationRecommendationSchema.safeParse({
        destination_id: "setenil",
        confidence: 0.8,
        reason: "matches vibe",
        caveats: [],
      }).success,
    ).toBe(true);
  });

  it("rejects a confidence out of range", () => {
    expect(
      DestinationRecommendationSchema.safeParse({
        destination_id: "setenil",
        confidence: 1.5,
        reason: "x",
        caveats: [],
      }).success,
    ).toBe(false);
  });
});

describe("UserMessageSchema", () => {
  it("accepts a valid message", () => {
    expect(
      UserMessageSchema.safeParse({
        message: "hi",
        session_id: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
    ).toBe(true);
  });

  it("rejects a session_id that is not a uuid", () => {
    expect(
      UserMessageSchema.safeParse({ message: "hi", session_id: "not-a-uuid" })
        .success,
    ).toBe(false);
  });

  it("rejects a message longer than 2000 characters", () => {
    expect(
      UserMessageSchema.safeParse({
        message: "a".repeat(2001),
        session_id: "123e4567-e89b-12d3-a456-426614174000",
      }).success,
    ).toBe(false);
  });
});
