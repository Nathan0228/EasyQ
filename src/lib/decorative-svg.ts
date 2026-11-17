import { Platform } from "react-native";

// The containing link or button supplies the accessible name.
export const decorativeSvgProps = Platform.OS === "web"
  ? { "aria-hidden": true, focusable: false } as const
  : { accessible: false, focusable: false } as const;
