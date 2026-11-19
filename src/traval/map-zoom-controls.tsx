import { useRef, type ReactNode } from "react";
import { Platform, Pressable, View, type GestureResponderEvent, type PointerEvent } from "react-native";
import { AppText } from "@/components/app-text";
import { useApp } from "@/context/app-context";
import { mapZoomStep, maxMapScale } from "./map-transform";

export type MapViewportProps = { aspect: number; water: string; legend: ReactNode; children: ReactNode };

export function MapZoomControls({ scale, onZoom, onReset, legend }: {
  scale: number;
  onZoom: (factor: number) => void;
  onReset: () => void;
  legend: ReactNode;
}) {
  const { language } = useApp();
  const zh = language === "zh";
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 pt-3 sm:px-5">
      {legend}
      <View className="ml-auto flex-row items-center gap-1.5">
        <ZoomButton label={zh ? "缩小地图" : "Zoom out"} text="−" disabled={scale <= 1}
          onPress={() => onZoom(1 / mapZoomStep)} />
        <ZoomButton label={zh ? "放大地图" : "Zoom in"} text="+" disabled={scale >= maxMapScale}
          onPress={() => onZoom(mapZoomStep)} />
        <ZoomButton label={zh ? "恢复全图" : "Reset map view"} text={zh ? "全图" : "Fit"}
          disabled={scale <= 1} onPress={onReset} />
      </View>
    </View>
  );
}

function ZoomButton({ label, text, disabled, onPress }: {
  label: string;
  text: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useApp();
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);
  const handledTouch = useRef(false);

  function pointerDown({ nativeEvent }: PointerEvent) {
    handledTouch.current = false;
    touch.current = nativeEvent.pointerType === "touch"
      ? { id: nativeEvent.pointerId, x: nativeEvent.clientX, y: nativeEvent.clientY }
      : null;
  }

  function pointerUp({ nativeEvent }: PointerEvent) {
    const start = touch.current;
    if (!start || start.id !== nativeEvent.pointerId) return;
    touch.current = null;
    if (disabled || Math.hypot(nativeEvent.clientX - start.x, nativeEvent.clientY - start.y) > 8) return;
    // Browsers can suppress the compatibility click immediately after a map gesture.
    handledTouch.current = true;
    onPress();
  }

  function press(event: GestureResponderEvent) {
    const input = event.nativeEvent ?? event;
    if (handledTouch.current && "detail" in input && input.detail !== 0) return;
    onPress();
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
      className="ui-pressable min-h-11 min-w-11 items-center justify-center rounded-xl border px-2"
      style={{ opacity: disabled ? 0.45 : 1, borderColor: colors.border, backgroundColor: colors.surface }}
      {...(Platform.OS === "web" ? {
        onPointerDown: pointerDown, onPointerUp: pointerUp, onPointerCancel: () => { touch.current = null; },
      } : {})}
      onPress={press}>
      <AppText className={text.length === 1 ? "text-lg font-semibold" : "text-xs font-semibold"}
        style={{ color: colors.accent }}>{text}</AppText>
    </Pressable>
  );
}
