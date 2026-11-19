import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useState } from "react";
import { Keyboard, Platform, Pressable, View } from "react-native";
import { AppText } from "@/components/app-text";
import { AppButton } from "@/components/ui";
import { useApp } from "@/context/app-context";

type Field = "start" | "end";
type Mode = "date" | "time";
type Selection = { field: Field; mode: Mode; value: Date };

function initialSelection(mode: Mode, date: string, time: string) {
  const now = new Date();
  if (mode === "time") {
    const [hours = now.getHours(), minutes = now.getMinutes()] = time ? time.split(":").map(Number) : [];
    // Pick wall-clock time independently of the trip date and its DST transitions.
    return new Date(2000, 0, 15, hours, minutes);
  }
  now.setHours(12, 0, 0, 0);
  if (date) {
    const [year, month, day] = date.split("-").map(Number);
    now.setFullYear(year, month - 1, day);
  }
  return now;
}

function selectedPart(mode: Mode, value: Date) {
  const pad = (part: number) => String(part).padStart(2, "0");
  if (mode === "time") return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
  const year = String(value.getFullYear()).padStart(4, "0");
  return `${year}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

function joinDateTime(date: string, time: string) {
  return date && time ? `${date} ${time}` : date;
}

export function RecordDateTimeFields({ start, end, startLabel, endLabel, disabled, onChange }: {
  start: string;
  end: string;
  startLabel: string;
  endLabel: string;
  disabled: boolean;
  onChange: (field: Field, value: string) => void;
}) {
  const { colors, language, theme } = useApp();
  const zh = language === "zh";
  const [selection, setSelection] = useState<Selection | null>(null);
  const fields = [
    { field: "start", value: start, label: startLabel },
    { field: "end", value: end, label: endLabel },
  ] as const;
  const cancel = () => setSelection(null);
  const confirmLabel = zh ? "确定" : "Confirm";
  const cancelLabel = zh ? "取消" : "Cancel";

  return (
    <View className="gap-4">
      {fields.map(({ field, value, label }) => {
        const [date, time = ""] = value.split(" ");
        const optional = field === "end";
        const picker = selection?.field === field ? selection : null;
        const dateLabel = zh ? `${label} · 日期` : `${label} date`;
        const timeLabel = zh ? `${label} · 时分` : `${label} time`;
        const changeDate = (next: string) => onChange(field, joinDateTime(next, time));
        const changeTime = (next: string) => onChange(field, joinDateTime(date, next));

        function open(mode: Mode) {
          Keyboard.dismiss();
          const initialDate = date || (optional ? start.slice(0, 10) : "");
          setSelection({ field, mode, value: initialSelection(mode, initialDate, time) });
        }

        function accept(mode: Mode, selected: Date) {
          const change = mode === "date" ? changeDate : changeTime;
          change(selectedPart(mode, selected));
          cancel();
        }

        return (
          <View key={field} className="gap-1">
            <View className="min-h-7 flex-row items-center justify-between gap-2">
              <AppText className="text-sm font-semibold">
                {label}{optional ? (zh ? " · 选填" : " · Optional") : ""}
              </AppText>
              {optional && Boolean(value) && <ClearSelection
                label={zh ? `清空${label}` : `Clear ${label.toLowerCase()}`}
                disabled={disabled} onPress={() => { cancel(); onChange(field, ""); }} />}
            </View>
            <View className="flex-row flex-wrap gap-x-2 gap-y-1">
              <View className="min-w-0 grow gap-1" style={{ flexBasis: 144 }}>
                <View className="min-h-8 justify-center">
                  <AppText className="text-xs" style={{ color: colors.secondary }}>{zh ? "日期" : "Date"}</AppText>
                </View>
                <PickerControl mode="date" label={dateLabel} value={date} disabled={disabled}
                  onChange={changeDate} onOpen={() => open("date")} />
              </View>
              <View className="min-w-0 grow gap-1" style={{ flexBasis: 115 }}>
                <View className="min-h-8 flex-row items-center justify-between gap-1">
                  <AppText className="shrink text-xs" style={{ color: colors.secondary }}>
                    {zh ? "时分 · 选填" : "Time · Optional"}
                  </AppText>
                  {Boolean(time) && <ClearSelection label={zh ? `清空${timeLabel}` : `Clear ${timeLabel.toLowerCase()}`}
                    disabled={disabled} onPress={() => { cancel(); changeTime(""); }} />}
                </View>
                <PickerControl mode="time" label={timeLabel} value={time} disabled={disabled || !date}
                  onChange={changeTime} onOpen={() => open("time")} />
              </View>
            </View>
            {picker && <View className="gap-2">
              <DateTimePicker key={picker.mode} mode={picker.mode} value={picker.value}
                accentColor={colors.accent} themeVariant={theme} locale={zh ? "zh_CN" : "en_US"}
                display={Platform.OS === "ios" ? "spinner" : "default"}
                presentation={Platform.OS === "android" ? "dialog" : "inline"}
                positiveButton={{ label: confirmLabel }} negativeButton={{ label: cancelLabel }} is24Hour disabled={disabled}
                style={{ width: "100%" }} onDismiss={cancel}
                onValueChange={(_, selected) => {
                  if (Platform.OS === "android") accept(picker.mode, selected);
                  else setSelection({ ...picker, value: selected });
                }} />
              {Platform.OS === "ios" && <View className="flex-row flex-wrap justify-end gap-2">
                <AppButton compact variant="secondary" label={cancelLabel} disabled={disabled} onPress={cancel} />
                <AppButton compact label={confirmLabel} disabled={disabled} onPress={() => accept(picker.mode, picker.value)} />
              </View>}
            </View>}
          </View>
        );
      })}
    </View>
  );
}

function ClearSelection({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  const { colors, language } = useApp();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
      className="ui-pressable min-h-8 justify-center px-1" hitSlop={6} onPress={onPress}>
      <AppText className="text-xs font-medium" style={{ color: colors.accent }}>{language === "zh" ? "清空" : "Clear"}</AppText>
    </Pressable>
  );
}

function PickerControl({ mode, label, value, disabled, onChange, onOpen }: {
  mode: Mode;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onOpen: () => void;
}) {
  const { colors, language, theme } = useApp();
  const surface = { backgroundColor: colors.background, borderColor: colors.border, minHeight: 48, opacity: disabled ? 0.5 : 1 };
  if (Platform.OS === "web") {
    return (
      <input className="w-full min-w-0 rounded-xl border px-2.5 text-base"
        type={mode} aria-label={label} disabled={disabled} value={value}
        min={mode === "date" ? "0001-01-01" : undefined}
        max={mode === "date" ? "9999-12-31" : undefined}
        onChange={event => onChange(event.currentTarget.value)}
        onClick={({ currentTarget }) => {
          try {
            currentTarget.showPicker?.();
          } catch {
            // The field remains usable with browsers' standard input controls.
          }
        }}
        style={{ ...surface, color: colors.text, colorScheme: theme, boxSizing: "border-box" }} />
    );
  }
  const zh = language === "zh";
  const placeholder = mode === "date" ? (zh ? "选择日期" : "Pick a date") : (zh ? "选择时分" : "Pick a time");
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={value ? `${label} ${value}` : label}
      disabled={disabled} className="ui-pressable justify-center rounded-xl border px-3"
      style={surface} onPress={onOpen}>
      <AppText className="text-sm tabular-nums" style={{ color: value ? colors.text : colors.secondary }}>
        {value || placeholder}
      </AppText>
    </Pressable>
  );
}
