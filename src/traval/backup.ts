import { openBackupFile, saveBackupFile } from "@/lib/backup-file";
import { isTravelRecord, type TravelRecord } from "./records";

const format = "easyq-traval-backup";
const version = 1;
const maxBackupBytes = 10_000_000;

export async function exportTravelBackup(records: TravelRecord[], title: string) {
  const exportedAt = new Date().toISOString();
  const content = JSON.stringify({ format, version, exportedAt, records });
  await saveBackupFile(content, `traval-backup-${exportedAt.slice(0, 10)}.json`, title);
}

export async function importTravelBackup() {
  const raw = await openBackupFile(maxBackupBytes);
  if (raw === null) return null;
  if (raw.length > maxBackupBytes) throw new Error("Backup file is too large");
  const backup = JSON.parse(raw.replace(/^\uFEFF/, "")) as {
    format?: unknown;
    version?: unknown;
    records?: unknown;
  } | null;
  if (backup?.format !== format || backup.version !== version
    || !Array.isArray(backup.records) || !backup.records.every(isTravelRecord)) {
    throw new Error("Invalid Traval backup");
  }
  return backup.records.map(({ id, placeId, kind, start, end, note }) => ({ id, placeId, kind, start, end, note }));
}
