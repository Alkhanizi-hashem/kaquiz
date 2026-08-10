import { useWindowDimensions } from "react-native";

import { layout } from "@/theme";

export function useContentStyle() {
  const { width } = useWindowDimensions();
  return {
    width: "100%" as const,
    maxWidth: layout.maxWidth,
    alignSelf: "center" as const,
    paddingHorizontal: width >= 768 ? layout.tabletGutter : layout.gutter,
  };
}
