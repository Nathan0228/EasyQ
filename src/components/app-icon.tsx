import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconName = "arrow" | "lock" | "moon" | "sun" | "history" | "check" | "message" | "download" | "upload" | "trash" | "close";

export function AppIcon({ name, size = 20, color = "currentColor" }: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === "arrow" && <Path d="M19 12H5m7 7-7-7 7-7" {...common} />}
      {name === "lock" && <><Rect x="5" y="10" width="14" height="11" rx="2.5" {...common} /><Path d="M8 10V7a4 4 0 0 1 8 0v3" {...common} /></>}
      {name === "moon" && <Path d="M20.3 15.8A8.5 8.5 0 0 1 8.2 3.7 8.5 8.5 0 1 0 20.3 15.8Z" {...common} />}
      {name === "sun" && <><Circle cx="12" cy="12" r="4" {...common} /><Path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" {...common} /></>}
      {name === "history" && <><Path d="M3 11a9 9 0 1 1 2.2 6M3 4v7h7" {...common} /><Path d="M12 7v5l3 2" {...common} /></>}
      {name === "check" && <Path d="m4 12 5 5L20 6" {...common} />}
      {name === "message" && <Path d="M20 11.5a8 8 0 0 1-8 8 8.6 8.6 0 0 1-3.2-.6L4 20l1.1-4.8A8 8 0 1 1 20 11.5Z" {...common} />}
      {name === "download" && <><Path d="M12 3v12m-4-4 4 4 4-4M4 17v3h16v-3" {...common} /></>}
      {name === "upload" && <><Path d="M12 16V4m-4 4 4-4 4 4M4 17v3h16v-3" {...common} /></>}
      {name === "trash" && <><Path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v6m4-6v6" {...common} /></>}
      {name === "close" && <Path d="M5 5 19 19M19 5 5 19" {...common} />}
    </Svg>
  );
}
