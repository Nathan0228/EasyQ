import { useRef, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { AppText } from "@/components/app-text";
import { AppButton, AppInput } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { RecordDateTimeFields } from "./date-time-fields";
import { Swatch } from "./map";
import { isDomestic, placeName, placeTrail, type Place } from "./places";
import { categories, categoryIds, isBefore, NOTE_LIMIT, parseDate, type RecordFields, type TravelRecord } from "./records";

export function RecordEditor({ place, record, onClose, onChange }: {
  place: Place;
  record?: TravelRecord;
  onClose: () => void;
  onChange: (record: TravelRecord, remove: boolean) => Promise<void>;
}) {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const domestic = isDomestic(place.id);
  const [fields, setFields] = useState<RecordFields>(() => record ?? {
    kind: domestic ? "travel" : "visit", start: "", end: "", note: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pending = useRef(false);
  const noteLength = Array.from(fields.note).length;

  function update<Key extends keyof RecordFields>(name: Key, value: RecordFields[Key]) {
    setFields(current => ({ ...current, [name]: value }));
    setError("");
  }

  async function commit(next: TravelRecord, remove: boolean) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await onChange(next, remove);
      onClose();
    } catch {
      setError(zh ? "无法保存更改，请重试。" : "Could not save changes. Please try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function save() {
    const start = parseDate(fields.start);
    const end = fields.end.trim() ? parseDate(fields.end) : "";
    if (!start || end === null) {
      setError(zh ? "请选择有效的日期。" : "Select a valid date.");
      return;
    }
    if (end && isBefore(start, end)) {
      setError(zh ? "结束时间不能早于开始时间。" : "The end must be on or after the start.");
      return;
    }
    if (noteLength > NOTE_LIMIT) {
      setError(zh ? "备注不能超过 250 字。" : "Notes must be 250 characters or fewer.");
      return;
    }
    const id = record?.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    void commit({ ...fields, id, placeId: place.id, start, end, note: fields.note.trim() }, false);
  }

  const startLabel = domestic ? (zh ? "开始时间" : "Start") : (zh ? "到达时间" : "Arrival");
  const endLabel = domestic ? (zh ? "结束时间" : "End") : (zh ? "离开时间" : "Departure");
  const noteLabel = zh ? "备注" : "Notes";
  const close = () => { if (!pending.current) onClose(); };
  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 items-center justify-center px-4 py-5" style={{ backgroundColor: "rgba(15, 24, 20, 0.62)" }}>
        <Pressable accessible={false} className="absolute inset-0" onPress={close} />
        <View className="max-h-full w-full max-w-[540px] overflow-hidden rounded-[26px] border"
          style={{ backgroundColor: colors.surface, borderColor: colors.border }} accessibilityViewIsModal>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 p-5 sm:p-7">
            <View className="gap-1">
              <AppText accessibilityRole="header" className="text-2xl font-semibold">
                {record ? (zh ? "编辑记录" : "Edit record") : (zh ? "添加记录" : "Add record")}
              </AppText>
              <AppText className="text-sm leading-5" style={{ color: colors.secondary }}>
                {placeTrail(place.id).map(area => placeName(area, language)).join(" / ")}
              </AppText>
            </View>
            {domestic && <View className="gap-2">
              <AppText className="text-sm font-semibold">{zh ? "记录类别" : "Category"}</AppText>
              <View className="flex-row flex-wrap gap-2">
                {categoryIds.map(id => (
                  <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: fields.kind === id }}
                    className="ui-pressable min-h-11 flex-row items-center gap-2 rounded-xl border px-3"
                    style={{ borderColor: fields.kind === id ? categories[id].color : colors.border,
                      backgroundColor: fields.kind === id ? colors.surfaceSoft : colors.surface }}
                    disabled={busy} onPress={() => update("kind", id)}>
                    <Swatch color={categories[id].color} />
                    <AppText className="text-sm font-medium">{categories[id][language]}</AppText>
                  </Pressable>
                ))}
              </View>
            </View>}
            <RecordDateTimeFields start={fields.start} end={fields.end} startLabel={startLabel} endLabel={endLabel}
              disabled={busy} onChange={update} />
            <View className="gap-2">
              <View className="flex-row items-center justify-between gap-3">
                <AppText className="text-sm font-semibold">{noteLabel}</AppText>
                <AppText className="text-xs tabular-nums" style={{ color: noteLength > NOTE_LIMIT ? colors.danger : colors.secondary }}>
                  {noteLength}/{NOTE_LIMIT}
                </AppText>
              </View>
              <AppInput accessibilityLabel={noteLabel} multiline value={fields.note}
                placeholder={zh ? "为这段经历记一笔" : "Add a note about this place"}
                editable={!busy} onChangeText={value => update("note", value)} />
            </View>
            {Boolean(error) && <AppText accessibilityRole="alert" className="text-sm" style={{ color: colors.danger }}>{error}</AppText>}
            {confirmDelete && record ? <View className="gap-3">
              <AppText accessibilityRole="alert" className="text-sm" style={{ color: colors.danger }}>
                {zh ? "确定删除这条记录？" : "Delete this record?"}
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                <AppButton compact variant="secondary" label={zh ? "返回编辑" : "Back to editing"}
                  disabled={busy} onPress={() => setConfirmDelete(false)} />
                <AppButton compact variant="danger" label={zh ? "确认删除" : "Confirm deletion"}
                  disabled={busy} onPress={() => void commit(record, true)} />
              </View>
            </View> : <View className="flex-row flex-wrap items-center justify-between gap-3">
              {record ? <AppButton compact variant="secondary" iconName="trash"
                label={zh ? "删除" : "Delete"} disabled={busy} onPress={() => setConfirmDelete(true)} /> : <View />}
              <View className="flex-row flex-wrap gap-2">
                <AppButton compact variant="secondary" label={zh ? "取消" : "Cancel"} disabled={busy} onPress={close} />
                <AppButton compact iconName="save" label={zh ? "保存" : "Save"} disabled={busy} onPress={save} />
              </View>
            </View>}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
