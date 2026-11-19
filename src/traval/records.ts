import { getStored, setStored, STORAGE_KEYS } from "@/lib/storage";
import { CHINA_ID, isDomestic, placeTrail, placesById, worldCountryIds } from "./places";

export const NOTE_LIMIT = 250;
export const categories = {
  home: { zh: "居住", en: "Residence", color: "#279872" },
  work: { zh: "工作", en: "Work", color: "#4F79CB" },
  travel: { zh: "旅游", en: "Travel", color: "#CF762C" },
  school: { zh: "上学", en: "School", color: "#9A62C2" },
} as const;
export type Category = keyof typeof categories;
export const categoryIds = Object.keys(categories) as Category[];
export const visitColors = ["#A8D5BA", "#69B994", "#328766", "#176047"];

export type RecordFields = {
  kind: "visit" | Category;
  start: string;
  end: string;
  note: string;
};
export type TravelRecord = RecordFields & { id: string; placeId: string };
export type PlaceActivity = { visits: number; categories: Set<Category> };

export function exploredCountryPercentage(records: TravelRecord[]) {
  const visited = new Set<string>();
  for (const { placeId } of records) {
    const countryId = isDomestic(placeId) ? CHINA_ID : placeId;
    if (worldCountryIds.has(countryId)) visited.add(countryId);
  }
  return Math.round(visited.size * 10_000 / worldCountryIds.size) / 100;
}

export function parseDate(input: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]([01]\d|2[0-3]):([0-5]\d))?$/.exec(input.trim());
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const y = Number(year), m = Number(month), d = Number(day);
  const leap = y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > days[m - 1]) return null;
  const date = `${year}-${month}-${day}`;
  return hour ? `${date} ${hour}:${minute}` : date;
}

export function isBefore(start: string, end: string) {
  // A date without a time can overlap any time on the same day.
  if (start.length === 10 || end.length === 10) return end.slice(0, 10) < start.slice(0, 10);
  return end < start;
}

export function isTravelRecord(value: unknown): value is TravelRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<TravelRecord>;
  if (typeof record.id !== "string" || typeof record.placeId !== "string" || !placesById.has(record.placeId)) return false;
  if (isDomestic(record.placeId) ? !categoryIds.includes(record.kind as Category) : record.kind !== "visit") return false;
  if (typeof record.start !== "string" || typeof record.end !== "string" || typeof record.note !== "string") return false;
  return parseDate(record.start) === record.start
    && (!record.end || (parseDate(record.end) === record.end && !isBefore(record.start, record.end)))
    && Array.from(record.note).length <= NOTE_LIMIT;
}

export async function readRecords(): Promise<TravelRecord[]> {
  const stored = await getStored(STORAGE_KEYS.traval);
  const records: unknown = stored ? JSON.parse(stored) : [];
  if (!Array.isArray(records) || !records.every(isTravelRecord)) throw new Error("Invalid Traval records");
  return records;
}

let previousWrite = Promise.resolve();

function updateRecords(update: (latest: TravelRecord[]) => TravelRecord[]) {
  const write = previousWrite.then(async () => {
    const latest = await readRecords();
    const records = update(latest);
    if (records !== latest) await setStored(STORAGE_KEYS.traval, JSON.stringify(records));
    return { records, previousCount: latest.length };
  });
  previousWrite = write.then(() => undefined, () => undefined);
  return write;
}

export async function changeRecord(record: TravelRecord, remove: boolean) {
  const { records } = await updateRecords(latest => {
    const others = latest.filter(item => item.id !== record.id);
    return remove ? others : [record, ...others];
  });
  return records;
}

export async function mergeRecords(incoming: TravelRecord[]) {
  const { records, previousCount } = await updateRecords(latest => {
    const ids = new Set(latest.map(record => record.id));
    const additions = [];
    for (const record of incoming) {
      if (ids.has(record.id)) continue;
      ids.add(record.id);
      additions.push(record);
    }
    return additions.length ? [...latest, ...additions] : latest;
  });
  return { records, added: records.length - previousCount };
}

export function summarizeActivity(records: TravelRecord[]) {
  const activity = new Map<string, PlaceActivity>();
  for (const record of records) {
    for (const place of placeTrail(record.placeId)) {
      const existing = activity.get(place.id) ?? { visits: 0, categories: new Set<Category>() };
      if (record.kind === "visit") existing.visits += 1;
      else existing.categories.add(record.kind);
      activity.set(place.id, existing);
    }
  }
  return activity;
}
