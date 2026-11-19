import { AppText } from "@/components/app-text";
import { AppButton } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { memo, useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { MapViewport } from "./map-viewport";
import {
  baseMaps,
  loadSubdivision,
  placeName,
  placesById,
  type MapGeometry,
  type MapMode,
} from "./places";
import {
  categories,
  categoryIds,
  visitColors,
  type PlaceActivity,
} from "./records";

type MapProps = {
  mode: MapMode;
  subdivision?: string;
  selected: string | null;
  activity: Map<string, PlaceActivity>;
  onSelect: (id: string) => void;
};

const RegionPath = Platform.OS === "web" ? "path" : Path;
const RegionDot = Platform.OS === "web" ? "circle" : Circle;

function regionEvents(onSelect: () => void, label?: string) {
  // Passing onPress to react-native-svg on web forwards native responders to the DOM.
  return Platform.OS === "web"
    ? { onClick: onSelect, "aria-label": label, style: { cursor: "pointer" } }
    : { onPress: onSelect, accessibilityLabel: label };
}

export function TravalMap({
  mode,
  subdivision,
  selected,
  activity,
  onSelect,
}: MapProps) {
  if (subdivision) {
    return (
      <SubdivisionMap
        key={subdivision}
        id={subdivision}
        mode={mode}
        selected={selected}
        activity={activity}
        onSelect={onSelect}
      />
    );
  }
  return (
    <MapDrawing
      key={mode}
      geometry={baseMaps[mode]}
      mode={mode}
      selected={selected}
      activity={activity}
      onSelect={onSelect}
    />
  );
}

function SubdivisionMap({
  id,
  ...props
}: Omit<MapProps, "subdivision"> & { id: string }) {
  const { colors, language } = useApp();
  const [geometry, setGeometry] = useState<MapGeometry | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    loadSubdivision(id)
      .then((map) => {
        if (active) setGeometry(map);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [id, attempt]);

  if (geometry) return <MapDrawing geometry={geometry} {...props} />;
  const zh = language === "zh";
  const place = placesById.get(id);
  return (
    <View
      className="min-h-48 items-center justify-center gap-3 p-4"
      style={{ backgroundColor: colors.background }}
    >
      {failed ? (
        <>
          <AppText accessibilityRole="alert">
            {zh ? "地图加载失败" : "Could not load map"}
          </AppText>
          <AppButton
            compact
            variant="secondary"
            label={zh ? "重试" : "Retry"}
            onPress={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          />
        </>
      ) : (
        <>
          <ActivityIndicator
            color={colors.accent}
            accessibilityLabel={zh ? "正在加载地图" : "Loading map"}
          />
          {place && !place.parent && (
            <AppText
              accessibilityLiveRegion="polite"
              className="text-center text-sm"
              style={{ color: colors.secondary }}
            >
              {zh
                ? "省份首次加载耗时多，等待一会儿哦"
                : "The first load of a province can take a moment. Please wait."}
            </AppText>
          )}
        </>
      )}
    </View>
  );
}

const MapDrawing = memo(function MapDrawing({
  geometry,
  mode,
  selected,
  activity,
  onSelect,
}: Omit<MapProps, "subdivision"> & {
  geometry: MapGeometry;
}) {
  const { colors, theme, language } = useApp();
  const water = theme === "dark" ? "#1B2B29" : "#EDF3ED";
  const land = theme === "dark" ? "#555555" : "#C2C2C2";
  const border = theme === "dark" ? "#263A33" : "#F5F8F0";
  const selection = theme === "dark" ? "#F5DFB6" : "#243C33";
  const shapes = geometry.shapes.map((shape) => {
    const info = activity.get(shape.id);
    const categoryColors = categoryIds
      .filter((category) => info?.categories.has(category))
      .map((category) => categories[category].color);
    const visits = info?.visits ?? 0;
    const fill = visits
      ? visitColors[Math.min(visits, visitColors.length) - 1]
      : (categoryColors[0] ?? land);
    const place = placesById.get(shape.id);
    const label = place ? placeName(place, language) : shape.id;
    return {
      ...shape,
      categoryColors,
      fill,
      label,
      select: () => onSelect(shape.id),
    };
  });
  const selectedShape = shapes.find((shape) => shape.id === selected);
  const mapName =
    mode === "world"
      ? language === "zh"
        ? "世界地图"
        : "World map"
      : language === "zh"
        ? "中国地图"
        : "China map";
  return (
    <MapViewport
      aspect={geometry.width / geometry.height}
      water={water}
      legend={<MapLegend mode={mode} />}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label={mapName}
      >
        {shapes.map((shape) =>
          shape.d ? (
            <RegionPath
              key={shape.id}
              d={shape.d}
              fill={shape.fill}
              fillRule="evenodd"
              strokeWidth={0.9}
              stroke={border}
              {...regionEvents(shape.select, shape.label)}
            />
          ) : null,
        )}
        {geometry.boundary && (
          <Path
            d={geometry.boundary}
            fill="none"
            stroke={colors.secondary}
            strokeWidth={0.8}
            pointerEvents="none"
          />
        )}
        {selectedShape?.d && (
          <Path
            d={selectedShape.d}
            fill="none"
            stroke={selection}
            strokeWidth={2.7}
            strokeLinejoin="round"
            pointerEvents="none"
          />
        )}
        {shapes
          .filter((shape) => shape.small)
          .map((shape) => (
            <RegionDot
              key={shape.id}
              cx={shape.x}
              cy={shape.y}
              r={4.4}
              fill={shape.fill}
              stroke={shape.id === selected ? selection : border}
              strokeWidth={shape.id === selected ? 2.5 : 1.15}
              {...regionEvents(shape.select, shape.d ? undefined : shape.label)}
            />
          ))}
        {shapes
          .filter((shape) => shape.categoryColors.length > 1)
          .flatMap((shape) =>
            shape.categoryColors.map((color, index) => (
              <Circle
                key={`${shape.id}-${color}`}
                cx={
                  shape.x + (index - (shape.categoryColors.length - 1) / 2) * 11
                }
                cy={shape.y}
                r={5.6}
                fill={color}
                stroke={water}
                strokeWidth={1.4}
                pointerEvents="none"
              />
            )),
          )}
      </Svg>
    </MapViewport>
  );
});

function MapLegend({ mode }: { mode: MapMode }) {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const items =
    mode === "world"
      ? visitColors.map((color, index) => ({
          color,
          label: `${index + 1}${index === visitColors.length - 1 ? "+" : ""}`,
        }))
      : categoryIds.map((id) => ({
          color: categories[id].color,
          label: categories[id][language],
        }));
  return (
    <View className="flex-row flex-wrap items-center gap-x-3.5 gap-y-2">
      {mode === "world" && (
        <AppText className="text-xs" style={{ color: colors.secondary }}>
          {zh ? "到访次数" : "Visits"}
        </AppText>
      )}
      {items.map(({ color, label }) => (
        <View key={label} className="flex-row items-center gap-1.5">
          <Swatch color={color} />
          <AppText className="text-xs" style={{ color: colors.secondary }}>
            {label}
          </AppText>
        </View>
      ))}
    </View>
  );
}

export function Swatch({ color }: { color: string }) {
  return (
    <View
      className="h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: color }}
    />
  );
}
