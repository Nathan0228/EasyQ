import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

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

  if (Platform.OS === "web") {
    const blob = new Blob([content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  const file = new File(Paths.cache, name);
  await file.write(content);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable");
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "EasyQ backup" });
}

export async function importBackup(): Promise<Question[] | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (asset.size && asset.size > MAX_BACKUP_BYTES) throw new Error("Backup file is too large");
  const raw = Platform.OS === "web"
    ? asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text()
    : await new File(asset.uri).text();
  return parseBackup(raw);
}
