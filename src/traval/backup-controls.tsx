import { useRef, useState } from "react";
import { View } from "react-native";
import { AppText } from "@/components/app-text";
import { AppButton } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { exportTravelBackup, importTravelBackup } from "./backup";
import { mergeRecords, type TravelRecord } from "./records";

export function BackupControls({ records, onImport }: {
  records: TravelRecord[] | null;
  onImport: (records: TravelRecord[]) => void;
}) {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const pending = useRef(false);

  async function run(action: "import" | "export") {
    if (pending.current || !records) return;
    pending.current = true;
    setBusy(true);
    setStatus(null);
    let fileRead = false;
    try {
      if (action === "export") {
        await exportTravelBackup(records, zh ? "Traval 备份" : "Traval backup");
        return;
      }
      const incoming = await importTravelBackup();
      if (incoming === null) return;
      fileRead = true;
      const merged = await mergeRecords(incoming);
      onImport(merged.records);
      const skipped = incoming.length - merged.added;
      const imported = zh ? `已导入 ${merged.added} 条记录。` : `Records imported: ${merged.added}.`;
      const duplicates = zh ? `跳过 ${skipped} 条重复记录。` : ` Duplicates skipped: ${skipped}.`;
      setStatus({ text: skipped ? imported + duplicates : imported });
    } catch {
      let text: string;
      if (action === "export") {
        text = zh ? "无法导出备份，请重试。" : "Could not export the backup. Please try again.";
      } else if (fileRead) {
        text = zh ? "无法保存导入的记录，请检查本地存储后重试。" : "Could not save the imported records. Check local storage and try again.";
      } else {
        text = zh ? "无法导入，请选择有效的 Traval JSON 备份。" : "Could not import the file. Choose a valid Traval JSON backup.";
      }
      setStatus({ text, error: true });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <View className="max-w-full gap-2">
      <View className="flex-row flex-wrap gap-2">
        <AppButton compact variant="secondary" iconName="upload" label={zh ? "导入备份" : "Import backup"}
          disabled={busy || !records} onPress={() => void run("import")} />
        <AppButton compact variant="secondary" iconName="download" label={zh ? "导出备份" : "Export backup"}
          disabled={busy || !records?.length} onPress={() => void run("export")} />
      </View>
      {status && <AppText className="text-xs leading-5" accessibilityRole={status.error ? "alert" : undefined}
        accessibilityLiveRegion="polite" style={{ color: status.error ? colors.danger : colors.success }}>
        {status.text}
      </AppText>}
    </View>
  );
}
