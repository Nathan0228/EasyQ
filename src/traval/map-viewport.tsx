import { useState, type ReactNode } from "react";
import { View } from "react-native";
import { GestureDetector, GestureHandlerRootView, usePanGesture, usePinchGesture, useSimultaneousGestures } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { constrainMap, fullMap, zoomMap, type MapTransform, type Point } from "./map-transform";
import { MapZoomControls, type MapViewportProps } from "./map-zoom-controls";

export function MapGestureRoot({ children }: { children: ReactNode }) {
  return <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>;
}

export function MapViewport({ aspect, water, legend, children }: MapViewportProps) {
  const dimensions = useSharedValue({ width: 0, height: 0 });
  const transform = useSharedValue(fullMap);
  const pinchStart = useSharedValue<{ transform: MapTransform; focal: Point } | null>(null);
  const canPan = useDerivedValue(() => transform.get().scale > 1);
  const [scale, setScale] = useState(1);
  const frameAspect = Math.max(1.22, Math.min(2.05, aspect));

  const pan = usePanGesture({
    enabled: canPan,
    maxPointers: 1,
    minDistance: 5,
    onUpdate: event => {
      "worklet";
      if (pinchStart.get() || event.numberOfPointers !== 1) return;
      const current = transform.get();
      transform.set(constrainMap({
        scale: current.scale,
        x: current.x + event.changeX,
        y: current.y + event.changeY,
      }, dimensions.get(), aspect));
    },
  });
  const pinch = usePinchGesture({
    onActivate: event => {
      "worklet";
      const { width, height } = dimensions.get();
      pinchStart.set({
        transform: transform.get(),
        focal: { x: event.focalX - width / 2, y: event.focalY - height / 2 },
      });
    },
    onUpdate: event => {
      "worklet";
      const start = pinchStart.get();
      if (!start) return;
      const size = dimensions.get();
      const focal = { x: event.focalX - size.width / 2, y: event.focalY - size.height / 2 };
      transform.set(zoomMap(start.transform, start.transform.scale * event.scale, size, aspect, start.focal, focal));
    },
    onFinalize: () => {
      "worklet";
      pinchStart.set(null);
      scheduleOnRN(setScale, transform.get().scale);
    },
  });
  const gesture = useSimultaneousGestures(pan, pinch);
  const animatedStyle = useAnimatedStyle(() => {
    const current = transform.get();
    return { transform: [{ translateX: current.x }, { translateY: current.y }, { scale: current.scale }] };
  });

  function update(next: MapTransform) {
    pinchStart.set(null);
    transform.set(next);
    setScale(next.scale);
  }

  return (
    <>
      <View className="overflow-hidden" style={{ width: "100%", aspectRatio: frameAspect, maxHeight: 465, backgroundColor: water }}
        onLayout={event => {
          const { width, height } = event.nativeEvent.layout;
          const size = { width, height };
          dimensions.set(size);
          transform.set(constrainMap(transform.get(), size, aspect));
        }}>
        <GestureDetector gesture={gesture}>
          <View style={{ width: "100%", height: "100%" }}>
            <Animated.View style={[{ width: "100%", height: "100%" }, animatedStyle]}>{children}</Animated.View>
          </View>
        </GestureDetector>
      </View>
      <MapZoomControls scale={scale} legend={legend} onReset={() => update(fullMap)} onZoom={factor => {
        const current = transform.get();
        update(zoomMap(current, current.scale * factor, dimensions.get(), aspect));
      }} />
    </>
  );
}
