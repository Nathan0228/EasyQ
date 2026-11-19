import { provinceLoaders } from "./atlas/loaders";
import china from "./atlas/china.json";
import places from "./atlas/places.json";
import world from "./atlas/world.json";

export type MapMode = "world" | "china";
export type Place = { id: string; zh: string; en?: string; parent?: string; alias?: string };
export type MapGeometry = {
  width: number;
  height: number;
  shapes: { id: string; d: string; x: number; y: number; small?: boolean }[];
  boundary?: string;
};

export const CHINA_ID = "CN";
// UN member states plus the two non-member observer states, Holy See and Palestine.
// https://www.un.org/en/about-us/member-states
// https://www.un.org/en/about-us/non-member-states
export const worldCountryIds = new Set(`
  AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE
  BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD
  CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ
  DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA
  GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU
  ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI
  KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU
  LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU
  MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM
  PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW
  SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST
  SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TZ
  UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW
`.trim().split(/\s+/));

export const baseMaps: Record<MapMode, MapGeometry> = { world, china };
export const placesById = new Map<string, Place>(places.map(place => [place.id, place]));
export const isDomestic = (id: string) => /^\d{6}$/.test(id);
export const hasChildren = new Set((places as Place[]).flatMap(place => place.parent ? [place.parent] : []));

export function placeName(place: Place, language: "zh" | "en") {
  return language === "en" ? (place.en ?? place.zh) : place.zh;
}

export function placeTrail(id: string) {
  const trail: Place[] = [];
  for (let place = placesById.get(id); place; place = place.parent ? placesById.get(place.parent) : undefined) {
    trail.unshift(place);
  }
  return trail;
}

export function searchPlaces(input: string, mode: MapMode) {
  const query = input.trim().toLowerCase();
  if (!query) return [];
  const results: { place: Place; rank: number }[] = [];
  for (const place of placesById.values()) {
    if (isDomestic(place.id) !== (mode === "china")) continue;
    const names = [place.zh, place.en, place.alias, place.id].filter(value => value !== undefined);
    const rank = Math.min(...names.map(value => {
      const name = value.toLowerCase();
      if (name === query) return 0;
      if (name.startsWith(query)) return 1;
      return name.includes(query) ? 2 : Infinity;
    }));
    if (Number.isFinite(rank)) results.push({ place, rank });
  }
  return results.sort((a, b) => a.rank - b.rank).slice(0, 8).map(result => result.place);
}

const provinceAtlases = new Map<string, Promise<Record<string, MapGeometry>>>();

export async function loadSubdivision(id: string) {
  const province = id.slice(0, 2);
  let loaded = provinceAtlases.get(province);
  if (!loaded) {
    loaded = provinceLoaders[province]().then(module => module.default).catch(error => {
      provinceAtlases.delete(province);
      throw error;
    });
    provinceAtlases.set(province, loaded);
  }
  const geometry = (await loaded)[id];
  if (!geometry) throw new Error(`Map missing for ${id}`);
  return geometry;
}
