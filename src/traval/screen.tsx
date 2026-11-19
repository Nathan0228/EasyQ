import { AppText } from "@/components/app-text";
import { Loading } from "@/components/portal-ui";
import { TextLink } from "@/components/text-link";
import { AppButton, AppInput, BrandHeader, Screen } from "@/components/ui";
import { useApp } from "@/context/app-context";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  Pressable,
  View,
  type GestureResponderEvent,
  type KeyDownEvent,
} from "react-native";
import { BackupControls } from "./backup-controls";
import { RecordEditor } from "./editor";
import { Swatch, TravalMap } from "./map";
import {
  CHINA_ID,
  hasChildren,
  isDomestic,
  placeName,
  placeTrail,
  placesById,
  searchPlaces,
  type MapMode,
  type Place,
} from "./places";
import {
  categories,
  changeRecord,
  exploredCountryPercentage,
  readRecords,
  summarizeActivity,
  visitColors,
  type TravelRecord,
} from "./records";

const pageSize = 15;
const doubleTapDelay = 350;
const modes = ["world", "china"] as const;

export default function TravalScreen() {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const [mode, setMode] = useState<MapMode>("world");
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<TravelRecord[] | null>(null);
  const [recordsExpanded, setRecordsExpanded] = useState(true);
  const lastTitlePress = useRef<number | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [limit, setLimit] = useState(pageSize);
  const [editor, setEditor] = useState<{
    place: Place;
    record?: TravelRecord;
  } | null>(null);

  const refreshRecords = useCallback((isActive: () => boolean = () => true) => {
    setLoadError(false);
    void readRecords()
      .then((items) => {
        if (isActive()) setRecords(items);
      })
      .catch(() => {
        if (isActive()) setLoadError(true);
      });
  }, []);
  useFocusEffect(
    useCallback(() => {
      let active = true;
      refreshRecords(() => active);
      return () => {
        active = false;
      };
    }, [refreshRecords]),
  );

  const activity = useMemo(() => summarizeActivity(records ?? []), [records]);
  const explored = useMemo(
    () => (records === null ? null : exploredCountryPercentage(records)),
    [records],
  );
  const modeRecords = useMemo(
    () =>
      (records ?? []).filter(
        (record) => isDomestic(record.placeId) === (mode === "china"),
      ),
    [mode, records],
  );
  const visibleRecords = useMemo(() => {
    const matching = selected
      ? (records ?? []).filter((record) =>
          placeTrail(record.placeId).some((place) => place.id === selected),
        )
      : modeRecords;
    return [...matching].sort((a, b) => b.start.localeCompare(a.start));
  }, [modeRecords, records, selected]);
  const results = useMemo(() => searchPlaces(query, mode), [query, mode]);
  const place = selected ? placesById.get(selected) : undefined;
  const recordsTitle = place
    ? placeName(place, language)
    : zh
      ? "足迹记录"
      : "Travel records";
  const domesticTrail =
    place && isDomestic(place.id) ? placeTrail(place.id) : [];
  const subdivision =
    domesticTrail.length && place
      ? hasChildren.has(place.id)
        ? place.id
        : place.parent
      : undefined;
  const areaCount = new Set(modeRecords.map((record) => record.placeId)).size;
  const searchLabel =
    mode === "world"
      ? zh
        ? "搜索国家或地区"
        : "Find a country or region"
      : zh
        ? "搜索省、市或区县"
        : "Find a province, city or district";

  const choose = useCallback((nextMode: MapMode, id: string | null) => {
    Keyboard.dismiss();
    lastTitlePress.current = null;
    setMode(nextMode);
    setSelected(id);
    setQuery("");
    setLimit(pageSize);
  }, []);

  const selectPlace = useCallback(
    (id: string) =>
      choose(id === CHINA_ID || isDomestic(id) ? "china" : "world", id),
    [choose],
  );

  function toggleRecords() {
    lastTitlePress.current = null;
    setRecordsExpanded((expanded) => !expanded);
  }

  function handleTitlePress(event: GestureResponderEvent) {
    // React Native Web delivers keyboard releases as unwrapped browser events.
    const input = event.nativeEvent ?? event;
    if (Platform.OS === "web" && "key" in input) return;
    if (
      Platform.OS === "web" &&
      "detail" in input &&
      (input.detail === 0 || input.detail === 2)
    ) {
      toggleRecords();
      return;
    }
    const now = performance.now();
    if (
      lastTitlePress.current !== null &&
      now - lastTitlePress.current <= doubleTapDelay
    ) {
      toggleRecords();
    } else {
      lastTitlePress.current = now;
    }
  }

  function handleTitleKeyDown(event: KeyDownEvent) {
    const { key, repeat } = event.nativeEvent;
    if (key !== "Enter" && key !== " ") return;
    event.preventDefault();
    if (!repeat) toggleRecords();
  }

  return (
    <Screen maxWidth={1110} backToTop>
      <BrandHeader showSubtitle={false} />
      <View className="flex-row flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <TextLink
          href="/tools"
          label={zh ? "工具箱" : "Toolbox"}
          iconName="arrow"
        />
        <BackupControls
          records={loadError ? null : records}
          onImport={setRecords}
        />
      </View>
      <View className="mb-6 mt-2 flex-row flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-8">
        <View className="gap-1.5">
          <AppText
            accessibilityRole="header"
            className="text-[46px] font-semibold leading-[54px] tracking-tight"
          >
            Traval
          </AppText>
          {explored !== null && (
            <AppText
              className="text-sm leading-6"
              style={{ color: colors.secondary }}
            >
              {zh
                ? `这个世界我已探索${explored}%`
                : `I've explored ${explored}% of the world`}
            </AppText>
          )}
        </View>
        {records !== null && (
          <View className="flex-row flex-wrap gap-x-6 gap-y-2">
            <Counter
              value={areaCount}
              label={
                mode === "world"
                  ? zh
                    ? "到访国家或地区"
                    : "Countries or regions"
                  : zh
                    ? "已标记地点"
                    : "Marked places"
              }
            />
            <Counter
              value={modeRecords.length}
              label={
                mode === "world"
                  ? zh
                    ? "到访记录"
                    : "Visits"
                  : zh
                    ? "国内记录"
                    : "China records"
              }
            />
          </View>
        )}
      </View>
      <View className="gap-4 lg:flex-row lg:items-start">
        <View
          className="min-w-0 overflow-hidden rounded-3xl border lg:flex-1"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View className="gap-2 px-4 pb-2 pt-4 sm:px-5">
            <View
              accessibilityRole="tablist"
              className="flex-row rounded-xl p-1"
              style={{ backgroundColor: colors.background }}
            >
              {modes.map((view) => (
                <Pressable
                  key={view}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: mode === view }}
                  onPress={() => choose(view, null)}
                  className="ui-pressable min-h-11 flex-1 items-center justify-center rounded-lg px-2"
                  style={{
                    backgroundColor:
                      mode === view ? colors.surfaceSoft : "transparent",
                  }}
                >
                  <AppText
                    className="text-sm font-semibold"
                    style={{
                      color: mode === view ? colors.text : colors.secondary,
                    }}
                  >
                    {view === "world"
                      ? zh
                        ? "世界地图"
                        : "World map"
                      : zh
                        ? "中国地图"
                        : "China map"}
                  </AppText>
                </Pressable>
              ))}
            </View>
            {mode === "china" && (
              <View className="flex-row flex-wrap items-center gap-x-2">
                <MapLink
                  label={zh ? "全国" : "All China"}
                  current={!domesticTrail.length && !selected}
                  onPress={() => choose("china", null)}
                />
                {domesticTrail.map((item) => (
                  <View key={item.id} className="flex-row items-center gap-2">
                    <AppText style={{ color: colors.secondary }}>/</AppText>
                    <MapLink
                      label={placeName(item, language)}
                      current={item.id === selected}
                      onPress={() => choose("china", item.id)}
                    />
                  </View>
                ))}
                {!domesticTrail.length && (
                  <View className="ml-auto">
                    <MapLink
                      label={zh ? "到访中国" : "Visits to China"}
                      current={selected === CHINA_ID}
                      onPress={() => choose("china", CHINA_ID)}
                    />
                  </View>
                )}
              </View>
            )}
          </View>
          <TravalMap
            mode={mode}
            subdivision={subdivision}
            selected={selected}
            activity={activity}
            onSelect={selectPlace}
          />
          <View className="gap-4 p-4 sm:px-5">
            <View className="gap-2">
              <AppInput
                accessibilityLabel={searchLabel}
                placeholder={searchLabel}
                value={query}
                autoCorrect={false}
                autoCapitalize="none"
                onChangeText={setQuery}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (results.length === 1) selectPlace(results[0].id);
                }}
              />
              {Boolean(query.trim()) && (
                <View
                  className="overflow-hidden rounded-xl border"
                  style={{ borderColor: colors.border }}
                >
                  {results.length ? (
                    results.map((result) => (
                      <Pressable
                        key={result.id}
                        accessibilityRole="button"
                        onPress={() => selectPlace(result.id)}
                        className="ui-pressable min-h-11 justify-center border-b px-3 py-2 last:border-b-0"
                        style={{ borderColor: colors.border }}
                      >
                        <AppText className="text-sm font-medium">
                          {placeTrail(result.id)
                            .map((item) => placeName(item, language))
                            .join(" / ")}
                        </AppText>
                      </Pressable>
                    ))
                  ) : (
                    <AppText
                      className="px-3 py-3 text-sm"
                      style={{ color: colors.secondary }}
                    >
                      {zh ? "没有找到对应地点。" : "No matching places."}
                    </AppText>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
        <View
          className="min-w-0 gap-4 rounded-3xl border p-4 sm:p-5 lg:w-[322px]"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
          }}
        >
          <View accessibilityRole="header">
            <Pressable
              accessibilityRole="button"
              aria-expanded={recordsExpanded}
              accessibilityLabel={recordsTitle}
              accessibilityActions={[{ name: "activate" }]}
              onAccessibilityAction={(event) => {
                if (event.nativeEvent.actionName === "activate")
                  toggleRecords();
              }}
              className="traval-record-heading ui-pressable min-h-11 justify-center gap-1 rounded-lg"
              {...(Platform.OS === "web"
                ? { onKeyDown: handleTitleKeyDown }
                : {})}
              onPress={handleTitlePress}
            >
              <AppText className="text-xl font-semibold">
                {recordsTitle}
              </AppText>
              {place && (
                <AppText
                  className="text-sm"
                  style={{ color: colors.secondary }}
                >
                  {zh
                    ? `${visibleRecords.length} 条${selected === CHINA_ID ? "到访" : ""}记录`
                    : `${visibleRecords.length} ${selected === CHINA_ID ? "visits" : "records"}`}
                </AppText>
              )}
            </Pressable>
          </View>
          {loadError ? (
            <View className="gap-3">
              <AppText
                accessibilityRole="alert"
                style={{ color: colors.danger }}
              >
                {zh
                  ? "无法读取本地记录，请重试。"
                  : "Could not load local records. Please try again."}
              </AppText>
              <AppButton
                variant="secondary"
                compact
                label={zh ? "重试" : "Retry"}
                onPress={() => refreshRecords()}
              />
            </View>
          ) : records === null ? (
            <Loading />
          ) : (
            <>
              {place && (
                <AppButton
                  iconName="plus"
                  label={zh ? "添加记录" : "Add record"}
                  onPress={() => setEditor({ place })}
                />
              )}
              {recordsExpanded && (
                <>
                  {!visibleRecords.length && (
                    <AppText
                      className="text-sm leading-6"
                      style={{ color: colors.secondary }}
                    >
                      {place
                        ? zh
                          ? "这个地点还没有记录。"
                          : "No records here yet."
                        : zh
                          ? "点选地图或搜索地点，添加第一条记录。"
                          : "Pick a place on the map or search to add a record."}
                    </AppText>
                  )}
                  {visibleRecords.slice(0, limit).map((record) => (
                    <RecordRow
                      key={record.id}
                      record={record}
                      onEdit={() => {
                        const area = placesById.get(record.placeId);
                        if (area) setEditor({ place: area, record });
                      }}
                    />
                  ))}
                  {visibleRecords.length > limit && (
                    <AppButton
                      variant="secondary"
                      compact
                      label={zh ? "加载更多记录" : "Show more records"}
                      onPress={() => setLimit((value) => value + pageSize)}
                    />
                  )}
                </>
              )}
            </>
          )}
        </View>
      </View>
      <AppText
        className="mt-5 text-xs leading-5"
        style={{ color: colors.secondary }}
      >
        {zh
          ? "记录保存在当前设备。地图数据来自 Surbowl、天地图和 GeoJSON.CN。国家与地区共195个。"
          : "Records are saved on this device. Map data from Surbowl, Tianditu and GeoJSON.CN. 195 countries and regions."}
      </AppText>
      {editor && (
        <RecordEditor
          place={editor.place}
          record={editor.record}
          onClose={() => setEditor(null)}
          onChange={async (record, remove) =>
            setRecords(await changeRecord(record, remove))
          }
        />
      )}
    </Screen>
  );
}

function MapLink({
  label,
  current,
  onPress,
}: {
  label: string;
  current: boolean;
  onPress: () => void;
}) {
  const { colors } = useApp();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: current }}
      onPress={onPress}
      className="ui-pressable min-h-11 justify-center rounded-lg px-2"
    >
      <AppText
        className={current ? "text-sm font-semibold" : "text-sm"}
        style={{ color: current ? colors.text : colors.accent }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function Counter({ value, label }: { value: number; label: string }) {
  const { colors } = useApp();
  return (
    <View className="flex-row items-baseline gap-1.5">
      <AppText
        className="text-xl font-semibold tabular-nums"
        style={{ color: colors.accent }}
      >
        {value}
      </AppText>
      <AppText className="text-xs" style={{ color: colors.secondary }}>
        {label}
      </AppText>
    </View>
  );
}

function RecordRow({
  record,
  onEdit,
}: {
  record: TravelRecord;
  onEdit: () => void;
}) {
  const { colors, language } = useApp();
  const zh = language === "zh";
  const visit = record.kind === "visit";
  const category =
    record.kind === "visit"
      ? { color: visitColors[1], zh: "到访", en: "Visit" }
      : categories[record.kind];
  return (
    <View
      className="gap-2 border-t pt-3"
      style={{ borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Swatch color={category.color} />
            <AppText className="text-xs" style={{ color: colors.secondary }}>
              {category[language]}
            </AppText>
          </View>
          <AppText className="text-sm font-semibold leading-5">
            {placeTrail(record.placeId)
              .map((place) => placeName(place, language))
              .join(" / ")}
          </AppText>
        </View>
        <AppButton
          label={zh ? "编辑" : "Edit"}
          iconName="edit"
          variant="secondary"
          compact
          onPress={onEdit}
        />
      </View>
      <View className="flex-row flex-wrap gap-x-4 gap-y-1">
        <AppText
          className="text-xs leading-5 tabular-nums"
          style={{ color: colors.secondary }}
        >
          {visit ? (zh ? "到达" : "Arrival") : zh ? "开始" : "Start"}{" "}
          {record.start}
        </AppText>
        <AppText
          className="text-xs leading-5 tabular-nums"
          style={{ color: colors.secondary }}
        >
          {record.end
            ? `${visit ? (zh ? "离开" : "Departure") : zh ? "结束" : "End"} ${record.end}`
            : zh
              ? visit
                ? "尚未填写离开时间"
                : "尚未填写结束时间"
              : "End time open"}
        </AppText>
      </View>
      {Boolean(record.note) && (
        <AppText className="text-sm leading-6" style={{ color: colors.text }}>
          {record.note}
        </AppText>
      )}
    </View>
  );
}
