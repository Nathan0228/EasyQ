import { useEffect, useRef, useState, type ComponentRef } from "react";
import { AccessibilityInfo, Animated, Platform, Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from "react-native";
import { AppIcon } from "@/components/app-icon";
import { InternalToolCard } from "@/components/tool-card";
import { useApp } from "@/context/app-context";
import type { InternalTool } from "@/lib/internal-tools";

// There are two tools, so the same neighbor previews Traval on both sides.
const slides = ["questions", "traval", "questions"] satisfies InternalTool[];
export const internalToolCount = new Set(slides).size;
const gap = 12;
const initialIndex = 1;
const carouselPadding = 20;
const cardInset = 36;
const sideShift = 21;

export function InternalToolsCarousel() {
  const { colors, language } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const showControls = Platform.OS === "web" && windowWidth >= 768;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const currentIndex = useRef(initialIndex);
  const measuredWidth = useRef(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [offset] = useState(() => new Animated.Value(0));
  const slideWidth = Math.max(1, Math.min(478, width - 84));
  // Keep the snap spacing wider than the card so the tilted edges have room.
  const cardWidth = Math.max(1, slideWidth - cardInset);
  const step = slideWidth + gap;

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduceMotion(value);
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  function alignCards() {
    if (!scrollRef.current || measuredWidth.current === width) return;
    measuredWidth.current = width;
    const x = currentIndex.current * step;
    scrollRef.current.scrollTo({ x, animated: false });
    offset.setValue(x);
  }

  function onScroll({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) {
    // Ignore scroll events caused by reflow before the new slide sizes are ready.
    if (measuredWidth.current !== width || Math.abs(nativeEvent.layoutMeasurement.width - width) > 1) return;
    const x = nativeEvent.contentOffset.x;
    offset.setValue(x);
    const index = Math.max(0, Math.min(slides.length - 1, Math.round(x / step)));
    if (index === currentIndex.current) return;
    currentIndex.current = index;
    setActiveIndex(index);
  }

  const zh = language === "zh";

  return (
    <View onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)} style={{ minHeight: showControls ? 318 : 270 }}>
      {width > 0 && (
        <ScrollView
          ref={scrollRef}
          nativeID="internal-tools-rail"
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          decelerationRate="fast"
          {...(Platform.OS !== "web" ? { snapToInterval: step, disableIntervalMomentum: true } : {})}
          onContentSizeChange={alignCards}
          onScroll={onScroll}
          contentContainerStyle={{
            paddingHorizontal: (width - slideWidth) / 2,
            paddingVertical: carouselPadding,
            gap,
          }}
        >
          {slides.map((tool, index) => {
            const inputRange = [(index - 1) * step, index * step, (index + 1) * step];
            const active = index === activeIndex;
            const opacity = offset.interpolate({ inputRange, outputRange: [0.6, 1, 0.6], extrapolate: "clamp" });
            const translateX = offset.interpolate({ inputRange, outputRange: [-sideShift, 0, sideShift], extrapolate: "clamp" });
            const rotateY = offset.interpolate({ inputRange, outputRange: ["36deg", "0deg", "-36deg"], extrapolate: "clamp" });
            const scale = offset.interpolate({ inputRange, outputRange: [1.02, 0.96, 1.02], extrapolate: "clamp" });
            return (
              <View
                key={index}
                className="tool-carousel-slide"
                pointerEvents={active ? "auto" : "none"}
                style={{ width: slideWidth, alignItems: "center", zIndex: active ? 0 : 1 }}
              >
                <Animated.View style={{
                  flex: 1,
                  width: cardWidth,
                  opacity,
                  transform: reduceMotion ? undefined : [
                    { perspective: 800 },
                    { translateX },
                    { rotateY },
                    { scale },
                  ],
                }}>
                  <InternalToolCard tool={tool} active={active} />
                </Animated.View>
              </View>
            );
          })}
        </ScrollView>
      )}
      {showControls && (
        <View className="mt-1 flex-row items-center justify-center gap-3">
          {([-1, 1] as const).map(direction => {
            const previous = direction < 0;
            const index = activeIndex + direction;
            const disabled = width === 0 || index < 0 || index >= slides.length;
            const label = previous
              ? (zh ? "上一张工具卡片" : "Previous tool")
              : (zh ? "下一张工具卡片" : "Next tool");
            return (
              <Pressable
                key={direction}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled }}
                disabled={disabled}
                onPress={() => scrollRef.current?.scrollTo({ x: index * step, animated: !reduceMotion })}
                className="tool-carousel-control ui-pressable h-11 w-11 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.surfaceSoft, opacity: disabled ? 0.4 : 1 }}
              >
                <View style={previous ? undefined : { transform: [{ rotate: "180deg" }] }}>
                  <AppIcon name="arrow" size={16} color={colors.accent} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
