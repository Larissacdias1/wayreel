// src/domain/airport-codes.ts
// Source of truth: WAYREEL.md Section 6.3 (City → IATA Mapping). Do not add
// or remove entries not specified there — see CLAUDE.md "Before any change".

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
  // Others
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
};

export function cityToIata(city: string): string | null {
  const normalized = city.toLowerCase().trim();
  return CITY_TO_IATA[normalized] || null;
}
