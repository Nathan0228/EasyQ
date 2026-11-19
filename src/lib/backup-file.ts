import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

const mimeType = "application/json";

export async function saveBackupFile(content: string, name: string, dialogTitle: string) {
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }

  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable");
  const file = new File(Paths.cache, name);
  await file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle });
}

export async function openBackupFile(maxBytes: number) {
  const result = await DocumentPicker.getDocumentAsync({
    type: Platform.OS === "web" ? [mimeType, ".json"] : mimeType,
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (Platform.OS === "web") {
    try {
      if (asset.size && asset.size > maxBytes) throw new Error("Backup file is too large");
      return asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
    } finally {
      URL.revokeObjectURL(asset.uri);
    }
  }

  const file = new File(asset.uri);
  if ((asset.size ?? file.size) > maxBytes) throw new Error("Backup file is too large");
  return file.text();
}
