// src/domain/airport-codes.ts
// Base table: WAYREEL.md Section 6.3 (City → IATA Mapping). Expanded per
// ADR-033 (WAYREEL.md Section 17) to give representative global coverage —
// this table is the deterministic fast path; cities not listed here fall
// back to the LLM's own IATA knowledge in extractIntent (docs/PROMPTS.md),
// validated by a 3-letter uppercase regex in TravelIntentSchema (src/domain/schemas.ts).

export const CITY_TO_IATA: Record<string, string> = {
  // Brazil
  "sao paulo": "GRU",
  sp: "GRU",
  "rio de janeiro": "GIG",
  rj: "GIG",
  brasilia: "BSB",
  salvador: "SSA",
  recife: "REC",
  fortaleza: "FOR",
  "belo horizonte": "CNF",
  curitiba: "CWB",
  "porto alegre": "POA",
  // Portugal
  lisboa: "LIS",
  porto: "OPO",
  faro: "FAO",
  // Spain
  madri: "MAD",
  madrid: "MAD",
  barcelona: "BCN",
  sevilha: "SVQ",
  sevilla: "SVQ",
  malaga: "AGP",
  // Turkey
  istambul: "IST",
  ancara: "ESB",
  // Morocco
  casablanca: "CMN",
  marrakech: "RAK",
  tanger: "TNG",
  // Sri Lanka
  colombo: "CMB",
  // Taiwan
  taipei: "TPE",
  // Europe (others)
  "nova york": "JFK",
  "new york": "JFK",
  londres: "LHR",
  london: "LHR",
  paris: "CDG",
  roma: "FCO",
  rome: "FCO",
  berlim: "BER",
  berlin: "BER",
  amsterda: "AMS",
  amsterdam: "AMS",
  // North America (ADR-033)
  "los angeles": "LAX",
  "cidade do mexico": "MEX",
  "mexico city": "MEX",
  toronto: "YYZ",
  chicago: "ORD",
  // Asia (ADR-033)
  toquio: "HND",
  tokyo: "HND",
  pequim: "PEK",
  beijing: "PEK",
  xangai: "PVG",
  shanghai: "PVG",
  seul: "ICN",
  seoul: "ICN",
  singapura: "SIN",
  singapore: "SIN",
  bangkok: "BKK",
  dubai: "DXB",
  bombaim: "BOM",
  mumbai: "BOM",
  "nova deli": "DEL",
  delhi: "DEL",
  "hong kong": "HKG",
  // Oceania (ADR-033)
  sydney: "SYD",
  melbourne: "MEL",
  auckland: "AKL",
  // Africa (ADR-033)
  joanesburgo: "JNB",
  johannesburg: "JNB",
  cairo: "CAI",
  nairobi: "NBO",
  lagos: "LOS",
};

export function cityToIata(city: string): string | null {
  const normalized = city.toLowerCase().trim();
  return CITY_TO_IATA[normalized] || null;
}
