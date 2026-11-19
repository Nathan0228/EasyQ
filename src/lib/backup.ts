import { openBackupFile, saveBackupFile } from "@/lib/backup-file";
import type { Backup, Question } from "@/types/question";

const MAX_BACKUP_BYTES = 5_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function isQuestion(value: unknown): value is Question {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    value.id.length > 120 ||
    typeof value.question !== "string" ||
    !value.question.trim() ||
    value.question.length > 240 ||
    (value.mode !== "binary" && value.mode !== "text") ||
    typeof value.note !== "string" ||
    value.note.length > 300 ||
    !isDate(value.createdAt)
  ) return false;

  if (value.answer === null) return true;
  if (!isRecord(value.answer)) return false;
  return (
    typeof value.answer.value === "string" &&
    value.answer.value.length <= 2000 &&
    isDate(value.answer.answeredAt) &&
    (value.mode === "text" || value.answer.value === "yes" || value.answer.value === "no")
  );
}

export function makeBackup(questions: Question[]): Backup {
  return {
    format: "easyq-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    questions,
  };
}

export function parseBackup(raw: string): Question[] {
  if (raw.length > MAX_BACKUP_BYTES) {
    throw new Error("Backup file is too large");
  }
  const data: unknown = JSON.parse(raw);
  if (
    !isRecord(data) ||
    data.format !== "easyq-backup" ||
    data.version !== 1 ||
    !Array.isArray(data.questions) ||
    !data.questions.every(isQuestion)
  ) {
    throw new Error("Invalid EasyQ backup");
  }
  return data.questions;
}

export async function exportBackup(questions: Question[]): Promise<void> {
  const content = JSON.stringify(makeBackup(questions), null, 2);
  const name = `easyq-backup-${new Date().toISOString().slice(0, 10)}.json`;
  await saveBackupFile(content, name, "EasyQ backup");
}

export async function importBackup(): Promise<Question[] | null> {
  const raw = await openBackupFile(MAX_BACKUP_BYTES);
  return raw === null ? null : parseBackup(raw);
}
