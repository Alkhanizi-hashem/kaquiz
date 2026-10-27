import type { PropsWithChildren } from "react";
import { View, type ViewStyle } from "react-native";

import { colors } from "@/theme";

export function AtlasCard({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return (
    <View
      style={{
        padding: 20,
        gap: 12,
        borderRadius: 24,
        borderCurve: "continuous",
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.surface,
        boxShadow: "0 3px 14px rgba(24, 59, 50, 0.035)",
        ...style,
      }}
    >
      {children}
    </View>
  );
}
