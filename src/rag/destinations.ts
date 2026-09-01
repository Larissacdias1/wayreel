// src/rag/destinations.ts
// Curated per WAYREEL.md Section 9.1 (5 MVP destinations) and Section 9.3
// (curation checklist). Cost of living / budget neighborhood use a regional
// proxy where the destination itself is a small town with no dedicated
// index (WAYREEL.md Section 9.3 note) — sourced via web research, not
// invented; see PR/issue #104 for the source list per destination.
//
// Visa information is intentionally NOT included as destination data
// (ADR-033, WAYREEL.md Section 17): visa rules depend on the traveler's
// passport, not the destination, so a per-destination field would be
// misleading. RESOLVED: the generic disclaimer lives as boilerplate text
// in docs/SECURITY.md Section 5, included by buildResponse (WAYREEL.md
// Section 8.2 note) the same way the flight price disclaimer already is —
// not a per-destination field here.
//
// [DECISION REQUIRED] `flythrough.waypoints` and `grade_profile` are frozen
// and real only for `setenil` (WAYREEL.md Section 11.1 / 11.5). The other 4
// destinations use a single static waypoint centered on their coordinates
// (same spirit as the prefers-reduced-motion fallback, Section 11.3) as an
// interim value. CONFIRMED as the accepted interim solution (reviewed in
// the #104 implementation conversation, 2026-09-01) — this is no longer an
// open question, it's a confirmed decision awaiting real curation: real
// camera paths still need to be designed and tested in MapLibre per the
// Section 11.5 decision, which remains open.

import type { Destination } from "../domain/types";

export const destinations: Destination[] = [
  {
    id: "setenil",
    name: "Setenil de las Bodegas",
    country: "Spain",
    region: "Andalusia",
    coordinates: { lat: 36.8625, lng: -5.18139 },
    tags: ["romantic", "historic", "gastronomy"],
    vibe_description:
      "A small Andalusian village built into and under the rock itself — streets where houses sit beneath overhanging cliffs, quiet enough for a slow, romantic walk between meals.",
    best_for: ["romantic", "historic", "gastronomy"],
    best_time_to_visit: {
      months: "April-June, September-October",
      reason:
        "Spring and early fall avoid Andalusia's summer heat while keeping mild, walkable temperatures.",
    },
    cost_of_living: {
      level: "medium",
      daily_estimate_usd: 110,
      notes:
        "Regional proxy (Andalusia), not a Setenil-specific index — the village is too small for a dedicated cost-of-living entry. Mid-range travelers: roughly €90-130/day (boutique hotel + restaurant meals).",
    },
    top_attractions: [
      {
        name: "Calle Cuevas del Sol / Calle Cuevas de la Sombra",
        description:
          "The streets carved beneath the rock overhang — houses and bars built directly into the cliff, the village's defining image.",
        must_see: true,
      },
      {
        name: "Plaza de Andalucía",
        description:
          "The heart of the upper village, surrounded by the historic hermitages (San Benito, Nuestra Señora del Carmen, San Sebastián).",
        must_see: false,
      },
      {
        name: "Tuk-tuk village tour",
        description:
          "A short guided ride through the village's narrow streets with a local driver sharing history and context.",
        must_see: false,
      },
    ],
    budget_neighborhood: {
      name: "Ronda (nearby town)",
      why: "Setenil itself has no distinct budget district — Ronda, about 20 minutes away, has a wider range of cheaper lodging.",
      avg_hotel_night_usd: 62,
    },
    physical_exertion: {
      level: "low",
      notes: "Flat, walkable village streets; no significant climbing.",
    },
    nearest_airport: "AGP",
    flythrough: {
      duration_seconds: 12,
      waypoints: [
        {
          coordinates: [-5.179, 36.786],
          zoom: 14,
          pitch: 60,
          bearing: 0,
          duration: 4000,
          hold: 1000,
        },
        {
          coordinates: [-5.18, 36.787],
          zoom: 16,
          pitch: 70,
          bearing: 90,
          duration: 4000,
        },
        {
          coordinates: [-5.178, 36.785],
          zoom: 13,
          pitch: 45,
          bearing: 180,
          duration: 3000,
        },
      ],
      grade_profile: "warm_andalusian",
    },
  },
  {
    id: "mardin",
    name: "Mardin",
    country: "Turkey",
    region: "Southeastern Anatolia",
    coordinates: { lat: 37.31306, lng: 40.735 },
    tags: ["historic", "cultural", "scenic views"],
    vibe_description:
      "A hilltop old town of honey-colored stone overlooking the vast Mesopotamian Plain — mosques, a monastery, and a covered bazaar layered into centuries of Artuqid architecture.",
    best_for: ["historic", "cultural", "scenic views"],
    best_time_to_visit: {
      months: "April-May, September-October",
      reason:
        "Spring and fall avoid the extreme summer heat of southeastern Anatolia.",
    },
    cost_of_living: {
      level: "low",
      daily_estimate_usd: 35,
      notes:
        "Mardin is among the least expensive destinations in the region; travel-cost sources put daily budgets around $25-45.",
    },
    top_attractions: [
      {
        name: "Mardin Old Town",
        description:
          "A labyrinth of narrow stone alleys and traditional houses, free to explore on foot.",
        must_see: true,
      },
      {
        name: "Great Mosque of Mardin",
        description:
          "Known for its intricately carved minaret, one of the old town's central landmarks.",
        must_see: false,
      },
      {
        name: "Deyrulzafaran Monastery",
        description:
          "A historic Syriac Orthodox monastery just outside the city.",
        must_see: false,
      },
    ],
    budget_neighborhood: {
      name: "Old Town (Mardin)",
      why: "The old town itself is already affordable — no nearby-town proxy needed.",
      avg_hotel_night_usd: 25,
    },
    physical_exertion: {
      level: "medium",
      notes:
        "The old town is built on a steep hillside; expect sloped streets and stairs.",
    },
    nearest_airport: "MQM",
    flythrough: {
      duration_seconds: 12,
      waypoints: [
        {
          coordinates: [40.735, 37.31306],
          zoom: 14,
          pitch: 60,
          bearing: 0,
          duration: 12000,
        },
      ],
      grade_profile: "default",
    },
  },
  {
    id: "sigiriya",
    name: "Sigiriya",
    country: "Sri Lanka",
    region: "Central Province",
    coordinates: { lat: 7.95694, lng: 80.75972 },
    tags: ["adventure", "nature", "historic"],
    vibe_description:
      "An ancient rock fortress rising out of the jungle in Sri Lanka's Cultural Triangle — part hike, part archaeological site, with elephants roaming nearby after dark.",
    best_for: ["adventure", "nature", "historic"],
    best_time_to_visit: {
      months: "December-March",
      reason:
        "The dry season across Sri Lanka's Cultural Triangle, with the least rainfall.",
    },
    cost_of_living: {
      level: "low",
      daily_estimate_usd: 35,
      notes:
        "Mid-range daily budgets (guesthouse + attractions + food) run roughly $25-45; the Sigiriya Rock entry fee alone is $35 for foreign visitors.",
    },
    top_attractions: [
      {
        name: "Sigiriya Rock Fortress (Lion Rock)",
        description:
          "The UNESCO World Heritage rock fortress that gives the destination its name.",
        must_see: true,
      },
      {
        name: "Pidurangala Rock",
        description:
          "A budget-friendly climb ($6 vs. Sigiriya's $35) with a view of Lion Rock itself.",
        must_see: false,
      },
      {
        name: "Dambulla Cave Temple",
        description: "A nearby cave temple complex, a common day-trip pairing.",
        must_see: false,
      },
    ],
    budget_neighborhood: {
      name: "Dambulla / Habarana area",
      why: "Sigiriya town is small and tourist-priced; the nearby Dambulla/Habarana area has cheaper guesthouses.",
      avg_hotel_night_usd: 26,
    },
    physical_exertion: {
      level: "high",
      notes:
        "Climbing Sigiriya Rock involves steep stairs and exposed heights; Pidurangala is a rougher, less maintained trail.",
    },
    nearest_airport: "CMB",
    flythrough: {
      duration_seconds: 12,
      waypoints: [
        {
          coordinates: [80.75972, 7.95694],
          zoom: 14,
          pitch: 60,
          bearing: 0,
          duration: 12000,
        },
      ],
      grade_profile: "default",
    },
  },
  {
    id: "chefchaouen",
    name: "Chefchaouen",
    country: "Morocco",
    region: "Rif Mountains",
    coordinates: { lat: 35.17139, lng: -5.26972 },
    tags: ["quiet", "photography", "mountains"],
    vibe_description:
      "Morocco's blue-painted mountain town — quiet medina alleys in every shade of blue, framed by the Rif Mountains, built for slow photography walks rather than nightlife.",
    best_for: ["quiet", "photography", "mountains"],
    best_time_to_visit: {
      months: "April-May, September-October",
      reason: "Mild mountain temperatures, avoiding summer heat.",
    },
    cost_of_living: {
      level: "low",
      daily_estimate_usd: 37,
      notes:
        "Among Morocco's most affordable destinations; budget travelers report $30-45/day.",
    },
    top_attractions: [
      {
        name: "Blue Medina",
        description:
          "The old town's blue-painted alleys — free to explore, the defining image of the town.",
        must_see: true,
      },
      {
        name: "Derb El Assri",
        description: "A well-known sunrise photography spot in the medina.",
        must_see: false,
      },
      {
        name: "Akchour Waterfalls",
        description: "A hiking day trip into the surrounding Rif Mountains.",
        must_see: false,
      },
    ],
    budget_neighborhood: {
      name: "Medina (Chefchaouen)",
      why: "Guesthouses inside the medina itself are already budget-friendly ($25-40/night); no external proxy needed.",
      avg_hotel_night_usd: 30,
    },
    physical_exertion: {
      level: "medium",
      notes:
        "Medina streets are steep and stepped; the Akchour hike adds a moderate half-day trek.",
    },
    nearest_airport: "TNG",
    flythrough: {
      duration_seconds: 12,
      waypoints: [
        {
          coordinates: [-5.26972, 35.17139],
          zoom: 14,
          pitch: 60,
          bearing: 0,
          duration: 12000,
        },
      ],
      grade_profile: "default",
    },
  },
  {
    id: "jiufen",
    name: "Jiufen",
    country: "Taiwan",
    region: "New Taipei City",
    coordinates: { lat: 25.1088, lng: 121.8435 },
    tags: ["nostalgic", "gastronomy", "mountains"],
    vibe_description:
      "A former gold-mining town clinging to a mountainside above Taiwan's northeast coast — narrow lantern-lit alleys, tea houses, and street food, an hour from Taipei.",
    best_for: ["nostalgic", "gastronomy", "mountains"],
    best_time_to_visit: {
      months: "October-November, March-April",
      reason:
        "Fall and spring avoid Taiwan's summer typhoon season (June-September).",
    },
    cost_of_living: {
      level: "medium",
      daily_estimate_usd: 55,
      notes:
        "Mid-range daily budgets (teahouses, private room, transport) run roughly NT$1,500-2,500 (~$50-80).",
    },
    top_attractions: [
      {
        name: "Jiufen Old Street",
        description:
          "The lantern-lit stepped street that defines Jiufen, lined with tea houses and food stalls.",
        must_see: true,
      },
      {
        name: "A-Mei Tea House",
        description:
          "The most photographed tea house in northern Taiwan, overlooking the mountainside.",
        must_see: false,
      },
      {
        name: "Shifen Waterfall / Yehliu Geopark",
        description: "Common day-trip pairings from Jiufen.",
        must_see: false,
      },
    ],
    budget_neighborhood: {
      name: "Ruifang (nearby district)",
      why: "Jiufen itself is small and tourist-priced; Ruifang, the district it sits in, has cheaper lodging options.",
      avg_hotel_night_usd: 35,
    },
    physical_exertion: {
      level: "medium",
      notes: "Jiufen's Old Street is a long stepped alley on a mountainside.",
    },
    nearest_airport: "TPE",
    flythrough: {
      duration_seconds: 12,
      waypoints: [
        {
          coordinates: [121.8435, 25.1088],
          zoom: 14,
          pitch: 60,
          bearing: 0,
          duration: 12000,
        },
      ],
      grade_profile: "default",
    },
  },
];
